/**
 * Podcast episode catalog + RSS feed generation.
 *
 * Audio URLs use the public-domain SoundHelix samples so the player actually
 * plays audio in development; real deployments replace these with real MP3s.
 */
export type Episode = {
  id: string;
  title: string;
  date: string;     // ISO
  duration: number; // seconds
  durationLabel: string;
  url: string;
  description: string;
  author?: string;
  image?: string;
};

export const EPISODES: Episode[] = [
  {
    id: 'post-reports-231',
    title: 'The shutdown deadline, explained',
    date: new Date().toISOString(),
    duration: 22 * 60 + 14,
    durationLabel: '22:14',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    description: 'We break down what happens if the government shuts down Sunday night — and who stands to lose the most.',
    author: 'Martine Powers',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
  },
  {
    id: 'post-reports-230',
    title: 'Inside the Speaker\'s gambit',
    date: new Date(Date.now() - 86400000).toISOString(),
    duration: 27 * 60 + 3,
    durationLabel: '27:03',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    description: 'How a last-minute deal came together on the House floor — and why it might not hold.',
    author: 'Theo Balcomb',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
  },
  {
    id: 'post-reports-229',
    title: 'The Georgia indictments, explained',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    duration: 19 * 60 + 48,
    durationLabel: '19:48',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    description: 'What the racketeering charges against the former president actually mean.',
    author: 'Martine Powers',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
  },
  {
    id: 'post-reports-228',
    title: 'Why your grocery bill still feels high',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    duration: 24 * 60 + 30,
    durationLabel: '24:30',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    description: 'Eggs, cereal, beef — prices aren\'t coming down even as inflation cools. We explain.',
    author: 'Arelis Hernández',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
  },
];

export function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
