// Best Work: the best of the best, and only that (a second, stricter review
// of every project, Nov 2026). Five, each a whole idea rather than a single
// post: a lead piece and the pieces that prove it holds as a system. What
// was cut, and why: the Fluid AI brain imagery (reads as stock AI), single
// social posts and grids (good, not best), decks and web mocks (better seen
// in their projects). Each opens the project it comes from.
const P = '/assets/projects/';

export const BEST_WORK = [
  {
    title: 'Momentum 2026',
    client: 'Milestone Technologies',
    kind: 'Event identity',
    line: 'One heavy line of type and one ribbon of light, carried from the poster to the welcome screens to the wall behind the stage.',
    projectId: 2,
    pieces: [
      { src: `${P}02-milestone/01-momentum-2026/02.jpg`, alt: 'Momentum 2026 poster: "One team. One vision." in heavy white type over a red and pink ribbon of light.' },
      { src: `${P}02-milestone/01-momentum-2026/01.jpg`, alt: 'Momentum 2026 welcome screen: "Welcome!" in gold italic over a blue ribbon.' },
      { src: `${P}02-milestone/01-momentum-2026/03.jpg`, alt: 'Momentum 2026 screen: "Welcome to Momentum", 23 to 25 March, Miami, over blue light.' },
      { src: `${P}02-milestone/01-momentum-2026/cover.jpg`, alt: 'Momentum 2026 step-and-repeat wall: the Milestone and Momentum marks tiled over an orange ribbon.' },
    ],
  },
  {
    title: 'Prevent transmission',
    client: 'Covid safety series',
    kind: 'Illustration system',
    line: 'Seven rules, one figure, one yellow. A single-line drawing does the explaining so the words can stay short.',
    projectId: 8,
    pieces: [
      { src: `${P}08-print-info/Covid Safety/06-covid-safety-personal__covid-01-prevent-transmission.png`, alt: 'Covid safety poster: "Prevent transmission of Covid-19" in yellow on cobalt, a single-line masked face.' },
      { src: `${P}08-print-info/Covid Safety/06-covid-safety-personal__covid-02-clean-hands.png`, alt: 'Covid safety poster: "Clean your hands frequently", a line drawing of hands under a yellow tap.' },
      { src: `${P}08-print-info/Covid Safety/06-covid-safety-personal__covid-03-cough-sneeze.png`, alt: 'Covid safety poster: "Cough or sneeze using a tissue or a bent elbow", a line figure into its elbow.' },
      { src: `${P}08-print-info/Covid Safety/06-covid-safety-personal__covid-05-avoid-gatherings.png`, alt: 'Covid safety poster: "Avoid attending social gatherings", a row of line figures crossed out.' },
    ],
  },
  {
    title: 'Different by design',
    client: 'Aloft, Marriott Hotels',
    kind: 'Illustration series',
    line: 'Musicians for a hotel that sells itself on music: each one cut out over blocks of the brand’s colours, each with its own line.',
    projectId: 3,
    pieces: [
      { src: `${P}03-marriott-aloft/Artwork/louis-armstrong-aloft.png`, alt: 'Louis Armstrong playing trumpet, notes flying out over blocks of red, yellow, green and blue.' },
      { src: `${P}03-marriott-aloft/Artwork/james-hetfield-aloft.png`, alt: 'James Hetfield with a guitar, cut out over pink, yellow and green blocks.' },
      { src: `${P}03-marriott-aloft/Artwork/kenny-g-quote-poster.png`, alt: 'Kenny G poster: a black and white saxophone silhouette with his quote in pink.' },
    ],
  },
  {
    title: 'High speed cyber defense',
    client: 'Paladion',
    kind: 'Poster',
    line: 'A leaf for something alive and a red band for the line it must not cross: security without a padlock in sight.',
    projectId: 8,
    pieces: [
      { src: `${P}08-print-info/Other/cyber-defense-poster.png`, alt: 'Paladion poster: a grey leaf cut by a red band, on black with mint accents.' },
    ],
  },
  {
    title: 'An evening with Milestone',
    client: 'Milestone Technologies',
    kind: 'Invitations',
    line: 'Invitations that feel like the evening: low light and gold for the whisky, a pink glass for the cocktails, orange for the mixer.',
    projectId: 2,
    pieces: [
      { src: `${P}02-milestone/12-internal-social/01.jpg`, alt: 'Happy Hour invitation in thin gold serif type over a glass of whisky in low light.' },
      { src: `${P}02-milestone/12-internal-social/02.jpg`, alt: 'Happy Hour invitation: a red cocktail in a coupe on pink, "An exclusive evening with Milestone".' },
      { src: `${P}02-milestone/13-others/02.jpg`, alt: 'Orange "Save the date" poster in heavy white type for a mixer at The Ferryman.' },
    ],
  },
];
