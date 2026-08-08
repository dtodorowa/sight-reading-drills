# 0001 - VexFlow for notation, pure TS for everything else

Status: accepted

## Context

The drill needs to draw a single note on a staff: clef, correct line/space,
ledger lines, and (later) accidentals. Getting clef glyphs and ledger lines right
across every phone is fiddly, and Unicode music glyphs render inconsistently.

## Decision

Use **VexFlow** for rendering only. It bundles its own music font, so notation
looks identical everywhere, and it handles ledger lines and glyphs for free.

Keep all the _logic_ (pitch math, note selection, mastery, formatting) as pure,
unit-tested TypeScript with no dependency on VexFlow. VexFlow lives behind one
thin I/O shell (`src/lib/music/render.ts`) that is **dynamically imported**, so it
never enters the server/prerender bundle.

## Consequences

- Correct, portable notation with almost no notation code of our own.
- The hard-to-test part (drawing) is isolated; the testable part (which note,
  where, how well known) is 100% pure and covered.
- Rendering is browser-only. Anything that must run during prerender cannot depend
  on `render.ts`.
