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
           frontOnly: false, markCol: false, tools: false,
           copy: 'back' }
}
```

`clickMode` / `view` / `hideAnswers` / `frontOnly` are a **starting**
state: stamped in when you arrive from the menu, yours to change afterwards, and not
re-stamped when you reload `/loader` without a `?profile=`. `markCol` and `tools`
belong to the profile itself and are re-applied every visit.

`copy: 'back'` makes a click anywhere in a row — the name field included — put the
row's back (col 3+) on the clipboard instead of the cell you happened to hit. That is
the name + PGN case: the name is only how you find the game, the PGN is what you want
to paste. `copy: 'cell'` is the old cell-by-cell behaviour. The Speak modes
ignore the knob; they already act on the whole row.

`wrap: true` keeps the newlines inside a cell. HTML collapses them, which is right for a
word and its definition and wrong for a cell holding a whole message — its paragraphs,
lists and code blocks would run together into one line. It also caps a card at 72ch, the
width long prose is actually readable at. Left out, it is off, so the other profiles are
unchanged.

`markdown: true` draws a cell as markdown in the **cards** view — ```` ```fences ```` as code
blocks, tables as tables, lists as lists — via `marked` + `DOMPurify` from cdnjs. The table
view is untouched, and the clipboard and both downloads still carry the raw markdown,
because they read the parsed data and never the DOM. If either library fails to load the
text is escaped as before and the `md-cards` class is not applied, so `wrap`'s `pre-wrap`
is still there to keep it readable — which is why a markdown profile sets both.

`body` carries `data-profile="<id>"`, so a profile can bring its own CSS without a class
per profile. `session-notes` uses it for the one thing the cards builder cannot do — it
stacks a row's fields without labels, which leaves a question and an answer looking alike
— and labels them You and Claude in CSS.

`markCol: false` only stops the filter column being **drawn**. The sheet's shape is
unchanged everywhere — col 1 = the filter column, col 2 = name (the front), col 3+ = the
back — which is what the rest of `loader.html` counts on.

**⬇ Download** writes the loaded sheet back out in that same shape — header row kept,
col 1 the filter column, col 2 name, col 3+ back — so what comes out loads straight back
into the loader without a column shifting.

## Flashcard answers

In the Flashcards profile, **hover over a card for 700 ms** to reveal its back. Leaving
the card before 700 ms cancels the timer. The answer stays visible for 10 seconds;
Right, Enter, Slash, or right-click reveals it immediately.

**The card under the mouse is the one the keys act on.** There is no stored selection and
no highlight: Right, Enter, Slash, Space, Comma and Period all read the hovered card live,
and off a card they do nothing. The page used to remember a "focused" card and scroll back
to it whenever the view was rebuilt — which Left does, to toggle Reveal all — so toggling
from two thirds down the page threw you back up to card 1. Nothing moves the page now
except Up/Down and typing a card number.

**Up/Down scroll the page**, 60 px a press. The page does
that scrolling itself rather than leaving the keys to the browser: with
caret browsing on (F7), the browser hands Up/Down to a blinking text cursor sitting in a
card, which then crawls line by line while the page stays put. That cursor is hidden in
the cards and the table too, since nothing there is editable. Shift+Up/Down still selects
text. The cards also have a wider left gutter (at least 56 px) so you can scroll beside
them without hovering over a card or touching one on a phone.

**Typing a card number** (e.g. `1`, `5`, then Enter or a short pause) scrolls card #15 into
the middle of the screen. That is all it does — it selects nothing and starts no reveal
timer; hover the card once you are there.

**Reveal all** shows every answer and keeps them visible until you press **Hide all**.
Left toggles the same control. Hide all returns to revealing cards on mouseover.
Reveal all also turns off Front only so answers can actually appear. Table view and
Front only pause automatic reveals.

## Session notes

`session_to_csv.py` (in `~/.claude/scripts/`) turns a Claude Code session into this
loader's shape — one row per exchange, col 2 what you asked, col 3 what Claude answered,
col 1 the empty x. `edithere` → **c** writes one and opens this page.

Read the exchanges here, then **⬇ Download → Download Markdown** writes the whole
transcript back out as the same `## You` / `## Claude` file `edithere` → **m** writes.
`python3 -I ~/.claude/scripts/csv_to_md.py <name>.csv` does the same thing from the
downloaded CSV; the button just saves the trip through the script.

Culling used to happen here — click the exchanges worth keeping, download only the rows
marked x. That went when the Known marks did: cut the rows in the sheet instead, or in
the `.md` afterwards.

## Downloads

| Button | File | What is in it |
| --- | --- | --- |
| Download CSV | `<name>.csv` | Every non-blank row, in the sheet's shape. Loads straight back in. |
| Download Markdown | `<name>.md` | The same rows as one `## You` / `## Claude` pair each, col 3+ as the answer. |

Markdown is offered on a profile with `markdown: true`. It is the same file
`~/.claude/scripts/csv_to_md.py` writes from the downloaded CSV — both were diffed and
are byte-identical. It reads the parsed rows, never the DOM, so the markdown goes out raw
rather than as the rendered HTML.

Blank lines are dropped from both.

## Dropbox sign-in

Dropbox checks the redirect URI against the list in its app console, so `dbxRedirectUri()`
in `loader.html` pins it to the **site root** — the address that was already registered
back when the loader was `index.html`. Dropbox therefore lands on the menu, which forwards
the `?code=` straight to `/loader`. Moving that redirect to `/loader` would mean adding
`https://<domain>/loader` in the Dropbox app console first.

Google sign-in is unaffected: it uses GIS token client, which authorises by JavaScript
origin, not by path.
