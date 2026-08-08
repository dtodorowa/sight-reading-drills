# NoteDash: build rules

Sight-reading drills for piano. The whole point is reading music **fast**, so the
app is adaptive: notes you miss or answer slowly come back more often. Domain
words live in [CONTEXT.md](CONTEXT.md); decisions in [docs/adr](docs/adr). This
file is **how** we build.

## Stack

SvelteKit + Svelte 5 (runes only) + TypeScript + Tailwind v4 + Vitest. Static
adapter, fully prerendered, all state in `localStorage`. Notation is rendered by
**VexFlow** (never hand-draw clefs or ledger lines). Mobile-first, dark theme.

## The teach philosophy is the product

This app is built on spaced, effortful retrieval. Keep it that way:

- **Struggling notes resurface more.** The weighting lives in
  `src/lib/music/picker.ts`. Speed counts, not just correctness: slow-but-right
  still pulls a note back sooner (mission is reading _fast_).
- **Feedback is instant.** Every answer flashes right/wrong immediately and the
  next note follows within a beat. Never add a blocking step between answer and
  feedback.
- **Progress is visible.** The mastery heatmap turns storage strength into
  something you can see. Don't hide it behind menus.

## Keep files small and single-purpose

- **Pure logic** (pitch math, note picking, stats, formatting) -> plain `.ts` in
  `src/lib/music/**`, `src/lib/stats/**`, `src/lib/utils/**`, each with a
  colocated `*.test.ts`. A pure helper takes inputs as **arguments** and returns a
  value: no stores, no DOM, no `Math.random` reached from inside (inject an `rng`).
- **Reactive state / orchestration** -> a `.svelte.ts` store in
  `src/lib/stores/**` (`progress.svelte.ts`, `drill.svelte.ts`).
- **Presentation** -> `.svelte` components in `src/lib/components/**`.
- **I/O shell around a library** (e.g. VexFlow drawing) -> its own `.ts`, kept
  thin, split from the pure core. See `src/lib/music/render.ts`.
- Route `+page.svelte` files are **composition roots**: wire things together and
  branch between screens, don't dump logic in them.

## Svelte (runes only)

- State is `$state` / `$derived` / `$props`. Never `export let`, `$:`, `$$props`.
- **`$derived` is the default for computed state; `$effect` is a last resort** for
  true side effects outside the reactive graph (DOM measurement, drawing to a
  canvas/SVG, event listeners). Drawing a note with VexFlow is a legit `$effect`.
- **`onMount` for one-time non-reactive setup** (window listeners, loading
  localStorage). We read `localStorage` in the layout's `onMount`, not at import,
  so prerendered HTML matches the first client render.

## Styling

- Tailwind v4 utilities, inline. The one global stylesheet is
  `src/routes/layout.css` (the shared theme); no per-component `<style>` blocks.
- **Never smaller than `text-sm`; content is `text-base`.**
- Border-radius by role: `rounded-full` (pills), `rounded-lg` (buttons/controls),
  `rounded-2xl` (cards/surfaces), `rounded-[3px]` (data marks / heatmap swatches).

## Copy

- **No em dashes in user-facing copy.** Ever. Use a comma, colon, or period. All
  hype strings live in `src/lib/copy/encouragement.ts`; keep the vibe warm and a
  little gen-z, never corny. A test guards against em dashes there.
- En dashes in real number ranges are fine. Comments are exempt.

## Clarity and naming

- Spell it out: `recording` not `rec`, `index` not `idx`. `url`, `id`, `api` ok.
- Name the props type (`type Props = { ... }`) above the destructure; don't inline.
- No nested ternaries in logic (an `if`/`else if` chain reads better). Prefer guard
  clauses. Comment the _why_, not the _what_.

## Imports

`$lib` for cross-feature imports; relative paths for colocated siblings
(`./Child.svelte`, its `*.svelte.ts`, its `*.test.ts`).

## Before you finish

- `npm run test` (Vitest) and `npm run check` (svelte-check) pass.
- `npm run format` (prettier). Formatting is not optional.
- `npm run build` prerenders cleanly (this is where SSR/localStorage bugs surface).
- No `: any` where a real type fits; no stray `console.*`.
