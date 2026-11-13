# vercel_csv_loader

Static site, no build step. `cleanUrls` in `vercel.json` is what serves `/loader` and
`/xlsx-cards` without the `.html`; anything unrecognised falls through to the menu.

| Page | URL | What it is |
| --- | --- | --- |
| `index.html` | `/` | The menu. Opens nothing by itself — you pick which kind of CSV you are about to load. |
| `loader.html` | `/loader` | The loader. One page, several states; `?profile=<id>` says which. |
| `xlsx-cards.html` | `/xlsx-cards` | Tack rows in a spreadsheet, study them with TTS. Its own page. |
| `items-for-sale.html` | `/items-for-sale` | The for-sale list. |
| `profiles.js` | — | The one list of states, read by both `index.html` and `loader.html`. |

## Profiles

A profile is one state of the loader: what a click does, table or cards, whether the
answer starts hidden, whether the x column is drawn, and whether the study toolbar is
on screen at all. They live in `profiles.js`, so **adding a kind of CSV is adding one
entry there** — the menu grows a button and the loader learns the state, with nothing
to keep in sync.

```js
{
  id: 'chess',
  name: 'Chess games',
  tint: '#8a5a2b',
  blurb: 'What it is for.',
  state: { clickMode: 'clipboard', view: 'cards', hideAnswers: false,
           frontOnly: false, hideKnown: false, markCol: false, tools: false,
           copy: 'back' }
}
```

`clickMode` / `view` / `hideAnswers` / `frontOnly` / `hideKnown` are a **starting**
state: stamped in when you arrive from the menu, yours to change afterwards, and not
re-stamped when you reload `/loader` without a `?profile=`. `markCol` and `tools`
belong to the profile itself and are re-applied every visit.

`copy: 'back'` makes a click anywhere in a row — the name field included — put the
row's back (col 3+) on the clipboard instead of the cell you happened to hit. That is
the name + PGN case: the name is only how you find the game, the PGN is what you want
to paste. `copy: 'cell'` is the old cell-by-cell behaviour. Known and the Speak modes
ignore the knob; they already act on the whole row.

`wrap: true` keeps the newlines inside a cell. HTML collapses them, which is right for a
word and its definition and wrong for a cell holding a whole message — its paragraphs,
lists and code blocks would run together into one line. It also caps a card at 72ch, the
width long prose is actually readable at. Left out, it is off, so the other profiles are
unchanged.

`markdown: true` draws a cell as markdown in the **cards** view — ```` ```fences ```` as code
blocks, tables as tables, lists as lists — via `marked` + `DOMPurify` from cdnjs. The table
view is untouched, and the clipboard and all three downloads still carry the raw markdown,
because they read the parsed data and never the DOM. If either library fails to load the
text is escaped as before and the `md-cards` class is not applied, so `wrap`'s `pre-wrap`
is still there to keep it readable — which is why a markdown profile sets both.

`body` carries `data-profile="<id>"`, so a profile can bring its own CSS without a class
per profile. `session-notes` uses it for the one thing the cards builder cannot do — it
stacks a row's fields without labels, which leaves a question and an answer looking alike
— and labels them You and Claude in CSS.

`markCol: false` only stops the x column being **drawn**. The sheet's shape is
unchanged everywhere — col 1 = x, col 2 = name (the front), col 3+ = the back — which
is what the rest of `loader.html` counts on.

**⬇ Download** writes three slices of the loaded sheet, all of them CSV, all of them the
same shape — header row kept, col 1 = the `x` mark, col 2 = name, col 3+ = back — so any
one of them loads straight back into the loader without a column shifting.

## Session notes

`session_to_csv.py` (in `~/.claude/scripts/`) turns a Claude Code session into this
loader's shape — one row per exchange, col 2 what you asked, col 3 what Claude answered,
col 1 the empty x. `edithere` → **c** writes one and opens this page.

The point is culling by clicking: read the exchanges, click the ones worth keeping,
**⬇ Download → Only the rows marked x**, then

```bash
python3 -I ~/.claude/scripts/csv_to_md.py <name>_known.csv
```

turns that slice back into Markdown — the same `## You` / `## Claude` file `edithere` → **m**
writes, holding only the exchanges you kept. Or skip the script: **⬇ Download** offers the
same three slices as `.md` directly, which is the same bytes.

## Downloads

| Choice | File | What is in it |
| --- | --- | --- |
| Everything | `<name>_x.csv` | Every row, marks as they stand. For filtering on col 1 in Excel. |
| Only the rows marked x | `<name>_known.csv` | The pile you know. |
| Only the rows without an x | `<name>_unknown.csv` | The pile still to learn. |

A profile with `markdown: true` gets a second set of the same three slices as `.md`
(`<name>_known.md` and so on) — one `## You` / `## Claude` pair per row, col 3+ as the
answer. That is the same file `~/.claude/scripts/csv_to_md.py` writes from the downloaded
CSV, so the button just saves the trip through the script; both were diffed and are
byte-identical. It reads the parsed rows, never the DOM, so the markdown goes out raw
rather than as the rendered HTML.

Blank lines are dropped from all three. The mark is read from **column 1 of the file**, not
from the in-page click state, because col 1 is what a click writes to and what travels with
the file.

## Dropbox sign-in

Dropbox checks the redirect URI against the list in its app console, so `dbxRedirectUri()`
in `loader.html` pins it to the **site root** — the address that was already registered
back when the loader was `index.html`. Dropbox therefore lands on the menu, which forwards
the `?code=` straight to `/loader`. Moving that redirect to `/loader` would mean adding
`https://<domain>/loader` in the Dropbox app console first.

Google sign-in is unaffected: it uses GIS token client, which authorises by JavaScript
origin, not by path.
