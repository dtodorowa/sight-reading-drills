# NoteDash

Fast, adaptive **sight-reading drills** for piano. See a note, name it, get quicker.
Built to learn the staff over a weekend and keep the habit on your phone.

Pick a level, and the app shows you one note at a time. Tap the letter (or use your
keyboard, A to G). Notes you miss or answer slowly come back more often, so practice
targets exactly the notes you don't know yet. Everything is saved locally, no account.

## Why it works

It is built on the way reading actually sticks: **spaced, effortful retrieval with
instant feedback.**

- **Adaptive weighting** Struggling and unseen notes resurface sooner; mastered
  ones fade back. Speed counts, not just correctness, because the goal is reading
  _fast_.
- **Instant feedback** Every answer flashes right or wrong and the next note follows
  within a beat.
- **Visible mastery** A per-note heatmap (new -> shaky -> learning -> solid ->
  mastered) turns progress into something you can see. Day streaks keep you coming
  back.

## Levels

Treble on-staff, treble with ledger lines, bass on-staff, bass with ledger lines,
the middle-C crossover, and the full grand staff. They climb in the order a reader
actually learns them.

## Tech

- SvelteKit + Svelte 5 (runes) + TypeScript
- Tailwind v4, mobile-first dark theme
- [VexFlow](https://github.com/0xfe/vexflow) for real music notation
- `localStorage` for all progress, static-adapter build (host anywhere), installable
  to your home screen (PWA manifest)

Logic (pitch math, note selection, mastery, stats) is pure, unit-tested TypeScript.
VexFlow sits behind one thin, browser-only rendering shell. See
[CLAUDE.md](CLAUDE.md) for the build rules and [CONTEXT.md](CONTEXT.md) for the
domain language.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run test       # Vitest (pure logic)
npm run check      # svelte-check
npm run format     # prettier
npm run build      # prerender to ./build (static)
```

## Deploy

`npm run build` writes a static site to `build/`. Drop it on GitHub Pages, Vercel,
Netlify, or any static host. On your phone, open the site and "Add to Home Screen"
to run it fullscreen and offline-friendly.

## Roadmap

Later stages are tracked as GitHub issues, most notably **hear what you play**:
point the mic (or a MIDI cable) at your piano and have the app check the note you
actually played. See the issues tab.
