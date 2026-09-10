/**
 * Derive a small set of related-topic chips from an article's category,
 * kicker, title, and dek. Pure heuristic — on the real site this comes from
 * the editorial taxonomy.
 */
const TOPIC_LIBRARY = [
  'Congress','Government Shutdown','House Republicans','Senate','White House',
  'Supreme Court','Joe Biden','Donald Trump','Kamala Harris','Mike Johnson',
  'Federal Reserve','Economy','Inflation','Oil Prices','Stock Market',
  'Ukraine','Russia','Israel','Gaza','China','Middle East',
  'Elections 2026','Immigration','Border Security','Climate','Health Care',
  'Social Security','Abortion','Gun Policy','Investigations',
  'NFL','MLB','NBA','NHL','Olympics',
  'Food','Travel','Arts','Movies','Television','Books','Music',
  'Artificial Intelligence','Tech Industry','Crypto',
];

export function inferTopics(input: {
  category?: string;
  kicker?: string;
  title?: string;
  dek?: string;
}): string[] {
  const haystack = [input.category, input.kicker, input.title, input.dek]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const found = TOPIC_LIBRARY.filter((t) => haystack.includes(t.toLowerCase()));
  // Always anchor with the article's category, de-duplicated.
  const out = new Set<string>();
  if (input.category) out.add(input.category);
  found.forEach((t) => out.add(t));
  // If nothing matched, fall back to a generic tag
  if (out.size === 0) out.add('Breaking News');
  return Array.from(out).slice(0, 6);
}
