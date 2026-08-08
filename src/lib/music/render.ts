// The I/O shell around VexFlow. Everything DOM-and-library lives here so the
// component that uses it stays a thin wrapper. VexFlow is dynamically imported so
// it is never pulled into the server/prerender bundle.

import { toVexKey } from './pitch';
import type { NoteCard } from './levels';

const WIDTH = 320;
const HEIGHT = 180;

export type RenderOptions = {
	/** Tint the note head, e.g. for right/wrong feedback. Defaults to ink black. */
	color?: string;
};

/** Draw a single whole note on its clef into `container`, replacing anything there. */
export async function drawNote(
	container: HTMLDivElement,
	card: NoteCard,
	options: RenderOptions = {}
): Promise<void> {
	const { Renderer, Stave, StaveNote, Accidental, Formatter } = await import('vexflow');

	container.innerHTML = '';
	const renderer = new Renderer(container, Renderer.Backends.SVG);
	renderer.resize(WIDTH, HEIGHT);
	const context = renderer.getContext();

	const stave = new Stave(8, 20, WIDTH - 16);
	stave.addClef(card.clef);
	stave.setContext(context).draw();

	const note = new StaveNote({ keys: [toVexKey(card.pitch)], duration: 'w', clef: card.clef });
	if (card.pitch.alter !== 0) {
		note.addModifier(new Accidental(card.pitch.alter === 1 ? '#' : 'b'));
	}
	if (options.color) {
		note.setStyle({ fillStyle: options.color, strokeStyle: options.color });
	}

	Formatter.FormatAndDraw(context, stave, [note]);

	// Make the SVG scale to the card width instead of its fixed pixel size.
	const svg = container.querySelector('svg');
	if (svg) {
		svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
		svg.removeAttribute('width');
		svg.removeAttribute('height');
		svg.style.width = '100%';
		svg.style.height = 'auto';
		svg.style.display = 'block';
	}
}
