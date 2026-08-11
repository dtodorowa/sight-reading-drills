// The progression book. Chapters wrap the imported exercises with a little
// teaching, in the order the learning-piano course teaches them: land on an
// anchor, warm up with scales, then walking bass, stepwise tucks, the four-flat
// key, and finally the two keys interleaved. Each chapter points at exercise ids
// from `exercises.data` (the generated notebook import).
//
// Teaching intros are kept tiny on purpose (the learner freezes when overwhelmed)
// and phrased as shape + key, never note-by-note. No em dashes, per the copy rule.

export type Chapter = {
	id: string;
	/** 1-based order shown in the book. */
	number: number;
	title: string;
	/** One or two warm sentences of teaching, shown above the exercises. */
	intro: string;
	exerciseIds: string[];
};

export const CHAPTERS: Chapter[] = [
	{
		id: 'landmarks',
		number: 1,
		title: 'Find your anchor',
		intro:
			'Do not count up from the bottom line. Drop onto a note you know, Treble G or Bass F, and read everything else as a shape out from it. These two lines just walk around that anchor.',
		exerciseIds: ['02-treble-G-anchor', '01-bass-F-anchor']
	},
	{
		id: 'scales',
		number: 2,
		title: 'Scales, up and down',
		intro:
			'The friendliest reading there is: every note is one step from the last. Read the shape (step up, step up) and let the key signature supply the flats. Play it slow, both directions.',
		exerciseIds: ['gm-04-scale', 'fm-04-scale']
	},
	{
		id: 'walking-gm',
		number: 3,
		title: 'Walking bass in G minor',
		intro:
			'Each bar is one chord walking by: root, fifth, third, root. Read the leaps as shapes, and notice the whole bar spells a Gm chord. You are reading harmony, not four loose dots.',
		exerciseIds: ['gm-01-walking-in-staff', 'gm-02-walking-progression', '03-bass-chord-tones']
	},
	{
		id: 'stepwise',
		number: 4,
		title: 'Stepwise lines and the tuck',
		intro:
			'Smooth stepwise runs, built to make your thumb tuck under. Keep your eyes a note ahead of your hand so the tuck is ready before you get there.',
		exerciseIds: ['gm-03-stepwise', 'fm-03-stepwise']
	},
	{
		id: 'fminor',
		number: 5,
		title: 'F minor, four flats',
		intro:
			'Same reading, four flats. You never read the flats one by one: set your hand in F minor and every B, E, A, D comes out flat on its own. Just read the letter and the shape. This is Primavera country.',
		exerciseIds: ['fm-01-walking-in-staff', 'fm-02-walking-progression']
	},
	{
		id: 'interleaved',
		number: 6,
		title: 'Mix the keys',
		intro:
			'This line starts in G minor and switches to F minor halfway. Jumping between the two is harder on purpose, and that difficulty is exactly what makes the reading stick.',
		exerciseIds: ['mixed-gm-fm']
	}
];

export function chapterById(id: string): Chapter | undefined {
	return CHAPTERS.find((chapter) => chapter.id === id);
}

/** The chapter that owns an exercise, for back-links from the player. */
export function chapterForExercise(exerciseId: string): Chapter | undefined {
	return CHAPTERS.find((chapter) => chapter.exerciseIds.includes(exerciseId));
}
