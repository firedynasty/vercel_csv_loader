// ─────────────────────────────────────────────────────────────────────────────
// PROFILES — the one list of states the loader can be in.
//
// Read by two pages, so there is nothing to keep in sync:
//   index.html   draws one button per profile (name, blurb, tint).
//   loader.html  puts itself in a profile's `state` when it is opened as
//                /loader?profile=<id>.
//
// Adding a kind of CSV = adding one entry here. Nothing else needs touching
// unless the kind needs behaviour no knob below covers.
//
// The knobs in `state`:
//   clickMode    what a click on a cell/row does: clipboard | dropbox |
//                speakFront | speakBack | known
//   view         table | cards
//   hideAnswers  cards view: show only the first field, → reveals for 10s
//   frontOnly    hide the back for good, no reveal
//   hideKnown    hide rows already marked x
//   markCol      false hides column 1, the x filter column. The column is still
//                there in the data — every other part of loader.html counts on
//                col 1 = x, col 2 = name, col 3+ = back — it is just not drawn.
//   tools        true keeps the study toolbar (TTS, Known, print, the x
//                pipeline); false hides it, for a CSV you are only reading out of.
//   wrap         true keeps the newlines inside a cell, for a sheet whose cells hold
//                whole messages rather than a word or a phrase. HTML collapses them by
//                default, which would run a message's paragraphs, lists and code blocks
//                together into one line. Like markCol and tools it is a body class, so
//                it costs nothing at run time; left out, it is off.
//   markdown     true draws a cell as markdown in the cards view -- ```fences``` as code
//                blocks, tables as tables, lists as lists -- instead of showing the
//                backticks and pipes. Needs marked + DOMPurify from the CDN; if either
//                fails to load the text is escaped as before, so set wrap as well and the
//                fallback stays readable. The table view is untouched, and the clipboard
//                and the downloads still carry the raw markdown.
//   copy         what a click puts on the clipboard (or sends to Dropbox):
//                'cell' = the cell you actually clicked, the old behaviour.
//                'back' = the row's back, col 3+, wherever in the row you click —
//                         including on the name. For a sheet of name + PGN the
//                         name is only there to find the row by; the PGN is what
//                         you came for.
//
// clickMode / view / hideAnswers / frontOnly / hideKnown are a STARTING state:
// they are applied when you arrive from the menu, and after that the toggles in
// the page are yours. markCol, tools, wrap and markdown belong to the profile itself and
// are re-applied on every visit.
// ─────────────────────────────────────────────────────────────────────────────
window.CSV_PROFILES = [
  {
    id: 'plain',
    name: 'Plain table',
    tint: '#3B82F6',
    blurb: 'Any CSV or Excel file as a table. Click a cell to copy just that cell. Every control on.',
    state: { clickMode: 'clipboard', view: 'table', hideAnswers: false, frontOnly: false, hideKnown: false, markCol: true, tools: true, copy: 'cell' }
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    tint: '#d97706',
    blurb: 'Col 2 is the front, col 3+ the back. Answers start hidden, a click marks a card Known, and the x column rides along to the sheet.',
    state: { clickMode: 'known', view: 'cards', hideAnswers: true, frontOnly: false, hideKnown: false, markCol: true, tools: true, copy: 'cell' }
  },
  {
    id: 'session-notes',
    name: 'Session notes',
    tint: '#7c3aed',
    blurb: 'A Claude Code session, one card per exchange: col 2 is what you asked, col 3 what Claude answered, drawn as markdown so code blocks look like code. Click an exchange to keep it, then download only the rows marked x.',
    state: { clickMode: 'known', view: 'cards', hideAnswers: false, frontOnly: false, hideKnown: false, markCol: true, tools: true, copy: 'back', wrap: true, markdown: true }
  },
  {
    id: 'read-aloud',
    name: 'Read aloud',
    tint: '#16a34a',
    blurb: 'Same cards, nothing hidden: a click reads the front out loud. Pick the language and speed in the navbar.',
    state: { clickMode: 'speakFront', view: 'cards', hideAnswers: false, frontOnly: false, hideKnown: false, markCol: true, tools: true, copy: 'cell' }
  },
  {
    id: 'chess',
    name: 'Chess games',
    tint: '#8a5a2b',
    blurb: 'A name column beside a PGN column. Cards, no x column, no study tools — click a game anywhere, name included, and the PGN lands on your clipboard.',
    state: { clickMode: 'clipboard', view: 'cards', hideAnswers: false, frontOnly: false, hideKnown: false, markCol: false, tools: false, copy: 'back' }
  }
];

window.CSV_PROFILE_DEFAULT = 'plain';

window.csvProfileById = function (id) {
  var list = window.CSV_PROFILES;
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
};
