// The I/O shell around VexFlow. Everything DOM-and-library lives here so the
// component that uses it stays a thin wrapper. VexFlow is dynamically imported so
// it is never pulled into the server/prerender bundle.

import { toVexKey, type Pitch } from './pitch';
import type { Clef, NoteCard } from './levels';

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

// Line rendering (a whole etude, one note per beat) lives below. It keeps its own
// fixed pixel width and does NOT stretch to the container, so the caller can put
// it in a horizontally scrolling box and follow the current note.

const LINE_HEIGHT = 210;
const NOTE_GAP = 44; // horizontal room per note
const LINE_LEFT = 56; // room for the clef
const LINE_RIGHT = 24;

const INK = '#181826';
const CURRENT = '#c026d3'; // fuchsia: the note to play now
const DONE_GOOD = '#16a34a'; // played right first try
const DONE_RETRY = '#d97706'; // got it, but needed another go

export type DrawLineParams = {
	clef: Clef;
	notes: Pitch[];
	/** Index of the note to play now; notes before it are done, after are upcoming. */
	currentIndex: number;
	/** firstTry[i] === false means that done note took more than one attempt. */
	firstTry: boolean[];
};

function lineColor(index: number, currentIndex: number, firstTry: boolean[]): string {
	if (index === currentIndex) return CURRENT;
	if (index > currentIndex) return INK;
	return firstTry[index] === false ? DONE_RETRY : DONE_GOOD;
}

/**
 * Draw a full line of notes with the current one highlighted. Returns the x of
 * the current note within the SVG (natural coords) so the caller can scroll it
 * into view, or null when there is no current note (line finished).
 */
export async function drawLine(
	container: HTMLDivElement,
	{ clef, notes, currentIndex, firstTry }: DrawLineParams
): Promise<number | null> {
	const { Renderer, Stave, StaveNote, Accidental, Formatter } = await import('vexflow');

	const width = LINE_LEFT + LINE_RIGHT + Math.max(1, notes.length) * NOTE_GAP;

	container.innerHTML = '';
	const renderer = new Renderer(container, Renderer.Backends.SVG);
	renderer.resize(width, LINE_HEIGHT);
	const context = renderer.getContext();

	const stave = new Stave(8, 40, width - 16);
	stave.addClef(clef);
	stave.setContext(context).draw();

	const staveNotes = notes.map((pitch, index) => {
		const note = new StaveNote({ keys: [toVexKey(pitch)], duration: 'q', clef });
		if (pitch.alter !== 0) {
			note.addModifier(new Accidental(pitch.alter === 1 ? '#' : 'b'));
		}
		const color = lineColor(index, currentIndex, firstTry);
		note.setStyle({ fillStyle: color, strokeStyle: color });
		return note;
	});

	Formatter.FormatAndDraw(context, stave, staveNotes);

	const svg = container.querySelector('svg');
	if (svg) {
		svg.style.display = 'block';
		svg.style.height = `${LINE_HEIGHT}px`;
	}

	const active = staveNotes[currentIndex];
	return active ? active.getAbsoluteX() : null;
}
