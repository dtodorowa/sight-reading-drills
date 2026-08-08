# Domain language

The words the code uses, so names stay consistent.

- **Pitch** (`src/lib/music/pitch.ts`) A note as `{ step, octave, alter }`. `step`
  is a letter A to G, `alter` is -1/0/1 (flat/natural/sharp). Middle C is
  `{ C, 4, 0 }`.
- **Diatonic index** A single number that increases as a note climbs the staff,
  counting letter positions only (F, F#, Fb share one index). This _is_ the
  vertical staff position, so it drives rendering and is easy to test.
- **Clef** `treble` or `bass`.
- **NoteCard** (`levels.ts`) One drawable question: a `clef` plus a `pitch`. The
  same pitch on two clefs is two different cards, because reading them is two
  different skills.
- **cardId** Stable string key for a card, e.g. `treble:E4`. The key for mastery
  stats.
- **Level** The thing you pick before a drill: a label plus one or more
  **segments** (a clef and an inclusive low..high range of natural notes). Levels
  climb in the order a reader learns them (on-staff, then ledger lines, then the
  grand staff).
- **NoteStat** (`stats/mastery.ts`) Per-card memory: attempts, correct, timing,
  streak, last seen.
- **Mastery score / bucket** A 0..1 blend of accuracy and speed, bucketed into
  `new | shaky | learning | solid | mastered` for the heatmap.
- **Attempt** One answered note: `{ cardId, correct, responseMs }`.
- **Session / round** A run of drilling. Summarized into accuracy, average speed,
  best streak, and notes-per-minute when you end it.
- **Day streak** Consecutive calendar days with at least one finished round.
- **Picker** (`music/picker.ts`) The weighted chooser. Struggling and unseen notes
  get more weight; just-shown notes get damped (spacing + interleaving). Never
  repeats the immediately previous card.
