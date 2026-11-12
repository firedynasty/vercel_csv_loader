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

`markCol: false` only stops the x column being **drawn**. The sheet's shape is
unchanged everywhere — col 1 = x, col 2 = name (the front), col 3+ = the back — which
is what the rest of `loader.html` counts on.

## Downloads

**⬇ Download** writes three slices of the loaded sheet, all of them CSV, all of them the
same shape — header row kept, col 1 = the `x` mark, col 2 = name, col 3+ = back — so any
one of them loads straight back into the loader without a column shifting.

| Choice | File | What is in it |
| --- | --- | --- |
| Everything | `<name>_x.csv` | Every row, marks as they stand. For filtering on col 1 in Excel. |
| Only the rows marked x | `<name>_known.csv` | The pile you know. |
| Only the rows without an x | `<name>_unknown.csv` | The pile still to learn. |

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
