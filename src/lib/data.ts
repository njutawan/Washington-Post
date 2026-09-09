export type Article = {
  id: string;
  slug: string;
  category?: string;
  categorySlug?: string;
  categoryColor?: string;
  kicker?: string;
  title: string;
  dek?: string;
  body?: string[];
  pullQuote?: string;
  byline?: string;
  dateline?: string;
  time?: string;
  readTime?: string;
  image?: string;
  credit?: string;
  caption?: string;
  live?: boolean;
  opinion?: boolean;
  authorTitle?: string;
  wordCount?: number;
  /** ISO date string (YYYY-MM-DD or full ISO). Sourced from MDX frontmatter
   *  `publishedAt` or CMS `_createdAt`. Used for SEO dates — never fake it. */
  publishedAt?: string;
  /** Human-friendly update label ("6:42 p.m. ET") or ISO string. */
  updatedAt?: string;
};

/** When an article body is MDX-sourced, Content is the React component to render. */
export type MdxArticle = Article & { Content: React.ComponentType };

export type Columnist = {
  id: string;
  name: string;
  slug: string;
  title: string;
  beat?: string;
  avatar: string;
  bio?: string;
  twitter?: string;
  email?: string;
};

export type BreakingNews = {
  id: string;
  text: string;
  href: string;
  live?: boolean;
};

export const topNav = [
  { label: 'Politics', slug: 'politics' },
  { label: 'Opinions', slug: 'opinions' },
  { label: 'U.S. News', slug: 'us-news' },
  { label: 'Style', slug: 'style' },
  { label: 'Investigations', slug: 'investigations' },
  { label: 'Well+Being', slug: 'wellbeing' },
  { label: 'Business', slug: 'business' },
  { label: 'Tech', slug: 'tech' },
  { label: 'World', slug: 'world' },
  { label: 'D.C., Md. & Va.', slug: 'local' },
  { label: 'Sports', slug: 'sports' },
];

export const subNav = [
  { label: 'WP Intelligence', slug: 'wp-intelligence' },
  { label: 'Ripple', slug: 'ripple' },
  { label: 'Games', slug: 'games' },
  { label: 'Newsletters', slug: 'newsletters' },
  { label: 'Climate', slug: 'climate' },
  { label: 'Food', slug: 'food' },
  { label: 'Travel', slug: 'travel' },
  { label: 'Obituaries', slug: 'obituaries' },
];

export const columnists: Columnist[] = [
  { id: 'c1', name: 'David Ignatius', slug: 'david-ignatius', title: 'Foreign affairs columnist', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', bio: 'Covering global politics, intelligence and national security. Ignatius has reported from more than 70 countries and is the author of 11 novels.', twitter: '@davidignatius', email: 'david.ignatius@example.com' },
  { id: 'c2', name: 'Jennifer Rubin', slug: 'jennifer-rubin', title: 'Opinion writer', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80', bio: 'Writing about American politics from a conservative perspective — with a sharp eye on the health of democratic norms.', twitter: '@JRubinBlogger' },
  { id: 'c3', name: 'Henry Olsen', slug: 'henry-olsen', title: 'Senior fellow, Ethics and Public Policy Center', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', bio: 'Populism, conservatism and American elections. Olsen studies the intersection of working-class voters and Republican politics.' },
  { id: 'c4', name: 'Eugene Robinson', slug: 'eugene-robinson', title: 'Pulitzer Prize-winning columnist', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', bio: 'Politics, race and the culture wars. Robinson won the 2009 Pulitzer Prize for Commentary.', twitter: '@Eugene_Robinson' },
  { id: 'c5', name: 'Catherine Rampell', slug: 'catherine-rampell', title: 'Opinion columnist', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80', bio: 'Economics, public policy and data-driven takes on the news of the day.', twitter: '@crampell' },
  { id: 'c6', name: 'Marc A. Thiessen', slug: 'marc-thiessen', title: 'Columnist', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80', bio: 'Conservative commentator, former speechwriter for President George W. Bush, and author of six books.' },
  { id: 'c7', name: 'Karen Tumulty', slug: 'karen-tumulty', title: 'Deputy editorial page editor', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80', bio: 'Political commentary and profile writing. Tumulty has covered every presidential campaign since 1980.' },
  { id: 'c8', name: 'Jonathan Capehart', slug: 'jonathan-capehart', title: 'Associate editor', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', bio: 'Politics and social justice. Capehart is also host of "The Saturday Show" and co-host of "Cape Up."' , twitter: '@CapehartJ' },
];

export const breakingNews: BreakingNews[] = [
  { id: 'bn1', text: 'House passes short-term spending bill, sending it to Senate ahead of shutdown deadline', href: '/article/house-passes-short-term-spending-bill', live: true },
  { id: 'bn2', text: 'Oil surges past $95 per barrel as tensions escalate in the Middle East', href: '/article/oil-rockets-toward-100-per-barrel' },
  { id: 'bn3', text: 'NYC mayor Mamdani holds strong approval ratings in new Suffolk poll', href: '/article/mamdani-nyc-mayor-poll', live: true },
  { id: 'bn4', text: 'Two Renoir paintings missing after overnight heist at French museum', href: '/article/renoir-paintings-missing-french-museum-heist' },
  { id: 'bn5', text: 'Canada countertariffs take effect today; Trump threatens Bombardier jet ban', href: '/article/canada-tariffs-rebuke' },
  { id: 'bn6', text: 'WATCH: Press briefing with White House press secretary at 2 p.m. ET', href: '#', live: true },
];

export const trending = [
  'Schools ban peanuts — but experts say that’s the wrong move',
  'Elizabeth Holmes documentary premieres at Telluride',
  'Focusing attention may help your brain fight inflammation',
  'Grab your Discmans: CDs are back, baby',
  'Amazon cargo plane crash on Florida highway',
  'Lindsay Clancy attorney makes public plea for Trump pardon',
];

// ---------- Core articles ----------

export const leadStory: Article = {
  id: 'lead-1',
  slug: 'house-passes-short-term-spending-bill',
  category: 'Politics',
  categorySlug: 'politics',
  kicker: 'The Agenda',
  title: 'House passes short-term spending bill, sending it to Senate as shutdown deadline looms',
  dek: 'The measure would keep the government funded through mid-November, but its fate in the Senate is uncertain as conservatives push for deeper cuts and policy riders.',
  body: [
    'The House voted Tuesday to pass a short-term government funding bill, sending the measure to the Senate with just days remaining before a midnight deadline that would trigger a partial federal shutdown.',
    'The 236-192 vote sends a clear signal that Speaker of the House Mike Johnson (R-La.) was willing to rely on Democratic votes to advance the bill, a move that already has drawn fierce backlash from hard-line conservatives in his conference. A small group of Democrats joined nearly all Republicans in support.',
    '"The American people expect us to keep the government open," Johnson told reporters after the vote, defending his decision to move a "clean" continuing resolution free of the deep spending cuts and conservative policy demands that have been sought by members of the hard-line Freedom Caucus.',
    'Senate leaders have signaled they will move quickly to take up the bill, but the timeline is tight. Without action by 12:01 a.m. Sunday, large swaths of the federal government would shut down — halting paychecks for hundreds of thousands of workers, closing national parks, and disrupting everything from food safety inspections to the release of key economic data.',
    'The bill would fund the government through Nov. 15 at current spending levels and does not include any of the policy riders — on border security, abortion, or gender-affirming care — that some conservatives had demanded.',
  ],
  pullQuote: '"The American people expect us to keep the government open," the Speaker told reporters.',
  byline: 'By Erica Werner, Paul Kane and Marianna Sotomayor',
  dateline: 'WASHINGTON',
  time: '12 minutes ago',
  readTime: '6 min read',
  image: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=1400&q=80',
  credit: 'Jabin Botsford for The Washington Post',
  caption: 'The U.S. Capitol as lawmakers raced to pass a stopgap funding bill ahead of the shutdown deadline.',
};

export const topStories: Article[] = [
  { id: 't1', slug: 'renoir-paintings-missing-french-museum-heist', category: 'World', categorySlug: 'world', title: 'Two Renoir paintings are missing after French museum heist, officials say', byline: 'By Aoife Walsh', time: '3 hours ago', readTime: '4 min read', image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=80' },
  { id: 't2', slug: 'oil-rockets-toward-100-per-barrel', category: 'Business', categorySlug: 'business', title: 'Drivers in for more pain as oil rockets back toward $100 per barrel', byline: 'By Evan Halper', time: '1 hour ago', readTime: '5 min read', image: 'https://images.unsplash.com/photo-1545479834-2e1b31e6f107?w=800&q=80' },
  { id: 't3', slug: 'cds-are-back-baby', category: 'Style', categorySlug: 'style', title: 'Grab your Discmans out of storage: CDs are back, baby', byline: 'By Chris Richards', time: '4 hours ago', readTime: '7 min read', image: 'https://images.unsplash.com/photo-1598387947332-c3220f06e4f8?w=800&q=80' },
  { id: 't4', slug: 'crypto-empire-collapse', category: 'Investigations', categorySlug: 'investigations', title: 'Inside the quiet collapse of a billion-dollar crypto empire', byline: 'By Todd C. Frankel', time: '6 hours ago', readTime: '12 min read' },
];

export const theSeven: Article[] = [
  { id: 's1', slug: 'mamdani-nyc-mayor-poll', title: 'NYC voters give Mamdani high marks, say mayor is doing better than expected', byline: 'Erin Cox', time: '42 minutes ago', live: true, publishedAt: '2026-09-10' },
  { id: 's2', slug: 'canada-tariffs-rebuke', title: "Canada's countertariffs kick in, drawing political rebuke from Trump", byline: 'Riley Beggin', time: '1 hour ago' },
  { id: 's3', slug: 'extra-steps-heart-health', title: 'Walking an extra 1,000 steps a day may help your heart, study finds', byline: 'Gretchen Reynolds', time: '5 hours ago' },
  { id: 's4', slug: 'eiffel-tower-hindu-group', title: "Paris in uproar after Eiffel Tower restricts female staff for Hindu group's visit", byline: 'Victoria Craw', time: '4 hours ago' },
  { id: 's5', slug: 'king-charles-harry-meghan', title: "King sends letter to clarify Harry and Meghan's status in U.K.", byline: 'Victoria Craw', time: '5 hours ago' },
  { id: 's6', slug: 'social-security-taxes', title: "As Social Security fund runs dry, some Republicans say it's time to raise taxes", byline: 'Tony Romm', time: '2 hours ago' },
  { id: 's7', slug: 'tuesday-briefing', title: 'Tuesday briefing: Canada, tariffs, and how to fight inflammation', byline: 'Izin Akhabau', time: '7 hours ago' },
];

export const opinions: Article[] = [
  { id: 'o1', slug: 'economy-not-bad', category: 'Opinion', categorySlug: 'opinions', kicker: 'Perspective', title: 'The economy is not as bad as you think. Here\u2019s why.', byline: 'Henry Olsen', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80', opinion: true, authorTitle: 'Columnist' },
  { id: 'o2', slug: 'middle-east-war', category: 'Opinion', categorySlug: 'opinions', kicker: 'Column', title: 'We are underestimating the risk of a wider Middle East war', byline: 'David Ignatius', opinion: true, authorTitle: 'Columnist' },
  { id: 'o3', slug: 'supreme-court-unpopular', category: 'Opinion', categorySlug: 'opinions', kicker: 'Column', title: 'The Supreme Court is about to make itself very unpopular', byline: 'Jennifer Rubin', opinion: true, authorTitle: 'Columnist' },
  { id: 'o4', slug: 'congress-avoidable-disaster', category: 'Opinion', categorySlug: 'opinions', kicker: 'Editorial', title: 'Congress is on the verge of another avoidable disaster', byline: 'The Editorial Board', opinion: true, authorTitle: 'Editorial Board' },
  { id: 'o5', slug: 'populism-future-gop', category: 'Opinion', categorySlug: 'opinions', kicker: 'Column', title: 'Populism is the future of the Republican Party. The question is what kind.', byline: 'Henry Olsen', image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80', opinion: true, authorTitle: 'Columnist' },
  { id: 'o6', slug: 'election-poll-warning', category: 'Opinion', categorySlug: 'opinions', kicker: 'Column', title: 'Democrats, stop celebrating. These polls carry a warning.', byline: 'Eugene Robinson', image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80', opinion: true, authorTitle: 'Columnist' },
  { id: 'o7', slug: 'fed-inflation-mistake', category: 'Opinion', categorySlug: 'opinions', kicker: 'Column', title: 'The Fed is about to make a big mistake on inflation', byline: 'Catherine Rampell', opinion: true, authorTitle: 'Columnist' },
];

export type Letter = {
  id: string;
  slug: string;
  title: string;
  location: string;
  excerpt: string;
  inResponseTo?: string;
};

export const letters: Letter[] = [
  {
    id: 'l1',
    slug: 'letter-shutdown-compromise',
    title: 'The shutdown debate requires compromise, not ultimatums',
    location: 'Arlington, Va.',
    excerpt: 'I am tired of watching both parties dig in while federal workers miss paychecks. The time for grandstanding is over; the time for governing is now.',
    inResponseTo: '“Congress is on the verge of another avoidable disaster,” Sept. 8',
  },
  {
    id: 'l2',
    slug: 'letter-ai-regulation',
    title: 'AI needs rules — but not the kind Silicon Valley wants to write',
    location: 'Bethesda, Md.',
    excerpt: 'Letting the companies building these systems write their own safety rules is like letting the fox guard the henhouse. Congress must move faster.',
    inResponseTo: '“AI startup valuations are starting to look like 2021 again,” Sept. 7',
  },
  {
    id: 'l3',
    slug: 'letter-oil-prices',
    title: 'Oil at $100 a barrel is a choice, not a fact of nature',
    location: 'Washington',
    excerpt: 'For decades we have heard that drilling more will bring down prices, and for decades drivers are still paying. It is long past time for a real energy transition.',
    inResponseTo: '“Drivers in for more pain as oil rockets back,” Sept. 6',
  },
];

export type Cartoon = {
  id: string;
  slug: string;
  cartoonist: string;
  caption: string;
  // A cartoon-style SVG illustration rendered inline (WaPo uses editorial cartoons by Toles, etc.)
  theme: 'congress' | 'economy' | 'ai' | 'whitehouse';
  date: string;
};

export const cartoons: Cartoon[] = [
  {
    id: 'ct1',
    slug: 'toles-shutdown-clock',
    cartoonist: 'Ann Telnaes',
    caption: 'The shutdown clock keeps ticking while Congress stares at its shoes.',
    theme: 'congress',
    date: 'Sept. 8, 2026',
  },
  {
    id: 'ct2',
    slug: 'telnaes-ai-takeover',
    cartoonist: 'Tom Toles',
    caption: 'The AI says it can do my job. It didn’t mention it can also take my parking spot.',
    theme: 'ai',
    date: 'Sept. 7, 2026',
  },
  {
    id: 'ct3',
    slug: 'toles-oil-barrel',
    cartoonist: 'Ann Telnaes',
    caption: '$100 oil, and a driver left holding the (gas) pump.',
    theme: 'economy',
    date: 'Sept. 6, 2026',
  },
];

export const sports: Article[] = [
  { id: 'sp1', slug: 'commanders-real-football', category: 'Sports', categorySlug: 'sports', title: 'The Commanders finally look like a real football team. Can they keep it up?', byline: 'By Barry Svrluga', time: '3 hours ago', readTime: '8 min read', image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80' },
  { id: 'sp2', slug: 'mlb-playoff-picture', category: 'Sports', categorySlug: 'sports', title: 'MLB playoff picture: The races that will go down to the final weekend', byline: 'By Chelsea Janes', time: '5 hours ago', readTime: '6 min read' },
  { id: 'sp3', slug: 'undrafted-rookie-starter', category: 'Sports', categorySlug: 'sports', title: 'From anonymity to the NFL: How an undrafted rookie became a starter', byline: 'By Nicki Jhabvala', time: '8 hours ago', readTime: '9 min read' },
];

export const techBusiness: Article[] = [
  { id: 'b1', slug: 'ai-startup-valuations-2021', category: 'Tech', categorySlug: 'tech', title: 'AI startup valuations are starting to look like 2021 again — and that should worry everyone', byline: 'By Gerrit De Vynck', time: '2 hours ago', readTime: '7 min read', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80' },
  { id: 'b2', slug: 'small-business-insurance', category: 'Business', categorySlug: 'business', title: 'Small businesses face a new threat: Their own insurance companies', byline: 'By Abha Bhattarai', time: '6 hours ago', readTime: '9 min read' },
  { id: 'b3', slug: 'iphone-subscriptions', category: 'Tech', categorySlug: 'tech', title: 'The iPhone 16 is fine. What Apple really wants you to buy is the subscription.', byline: 'By Chris Velazco', time: '8 hours ago', readTime: '5 min read' },
];

export const styleArts: Article[] = [
  { id: 'a1', slug: 'elizabeth-holmes-documentary', category: 'Style', categorySlug: 'style', title: 'At Telluride, an Elizabeth Holmes documentary tries to have it both ways', byline: 'By Ann Hornaday', time: '1 day ago', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80' },
  { id: 'a2', slug: 'best-restaurants-washington', category: 'Food', categorySlug: 'food', title: 'The 40 best restaurants in Washington right now', byline: 'By Tim Carman', time: '2 days ago', readTime: '15 min read' },
  { id: 'a3', slug: 'quietest-national-parks', category: 'Travel', categorySlug: 'travel', title: 'The quietest national parks in America — and when to visit them', byline: 'By Andrea Sachs', time: '1 day ago', readTime: '8 min read' },
];

export const wellbeing: Article[] = [
  { id: 'w1', slug: 'attention-brain-inflammation', category: 'Well+Being', categorySlug: 'wellbeing', title: 'Focusing your attention may help your brain fight inflammation, study suggests', byline: 'By Richard Sima', time: '4 hours ago', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80' },
  { id: 'w2', slug: 'stop-stretching-before-running', category: 'Well+Being', categorySlug: 'wellbeing', title: 'Why you should stop stretching before you run', byline: 'By Gretchen Reynolds', time: '1 day ago', readTime: '4 min read' },
  { id: 'w3', slug: 'sleep-habit-long-life', category: 'Well+Being', categorySlug: 'wellbeing', title: 'The sleep habit that could add years to your life, according to research', byline: 'By Kelyn Soong', time: '2 days ago', readTime: '5 min read' },
];

// Additional articles for section pages / load more
export const moreArticles: Article[] = [
  { id: 'p1', slug: 'senate-spending-vote-saturday', category: 'Politics', categorySlug: 'politics', title: 'Senate schedules Saturday vote as shutdown clock ticks down', byline: 'By Paul Kane', time: '45 minutes ago', readTime: '5 min read' },
  { id: 'p2', slug: 'biden-trump-polls-october', category: 'Politics', categorySlug: 'politics', title: 'New polls show tightening race in three key battleground states', byline: 'By Michael Scherer', time: '2 hours ago', readTime: '8 min read', image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80' },
  { id: 'p3', slug: 'white-house-correspondents-dinner', category: 'Politics', categorySlug: 'politics', title: 'Who\u2019s going to the White House Correspondents\u2019 Dinner? A running list.', byline: 'By Roxanne Roberts', time: '3 hours ago', readTime: '3 min read' },
  { id: 'p4', slug: 'justice-department-voting-rights', category: 'Politics', categorySlug: 'politics', title: 'Justice Department sues three states over new voting maps', byline: 'By Matt Zapotosky', time: '5 hours ago', readTime: '6 min read' },
  { id: 'p5', slug: 'speaker-johnson-conservative-caucus', category: 'Politics', categorySlug: 'politics', title: 'Conservatives float motion to vacate as Johnson moves funding bill', byline: 'By Marianna Sotomayor', time: '6 hours ago', readTime: '7 min read' },
  { id: 'wld1', slug: 'ukraine-russia-frontline', category: 'World', categorySlug: 'world', title: 'On the front line in eastern Ukraine, troops hold out against new Russian push', byline: 'By Sudarsan Raghavan', time: '2 hours ago', readTime: '10 min read', image: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=800&q=80' },
  { id: 'wld2', slug: 'china-economy-stimulus', category: 'World', categorySlug: 'world', title: 'China unveils sweeping stimulus package as property crisis deepens', byline: 'By Christian Shepherd', time: '4 hours ago', readTime: '7 min read' },
  { id: 'wld3', slug: 'germany-coalition-crisis', category: 'World', categorySlug: 'world', title: 'German coalition on brink after key minister resigns', byline: 'By Loveday Morris', time: '6 hours ago', readTime: '5 min read' },
  { id: 'wld4', slug: 'mexico-election-judicial-reform', category: 'World', categorySlug: 'world', title: 'Mexico\u2019s judicial reform could reshape its democracy — and its relationship with the U.S.', byline: 'By Mary Beth Sheridan', time: '8 hours ago', readTime: '9 min read' },
  { id: 'b4', slug: 'fed-interest-rates-september', category: 'Business', categorySlug: 'business', title: 'Fed signals it will cut rates in September. Here\u2019s what that means for you.', byline: 'By Rachel Siegel', time: '3 hours ago', readTime: '6 min read' },
  { id: 'b5', slug: 'housing-market-inventory', category: 'Business', categorySlug: 'business', title: 'Housing inventory hits highest level since 2019 — but buyers aren\u2019t biting', byline: 'By Kathy Orton', time: '7 hours ago', readTime: '8 min read', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80' },
  { id: 'b6', slug: 'tech-layoffs-2026', category: 'Tech', categorySlug: 'tech', title: 'As AI booms, another major tech company announces layoffs', byline: 'By Naomi Nix', time: '10 hours ago', readTime: '5 min read' },
  { id: 'sp4', slug: 'wizards-offseason-preview', category: 'Sports', categorySlug: 'sports', title: 'The Wizards are rebuilding. Here\u2019s what the offseason could look like.', byline: 'By Ava Wallace', time: '6 hours ago', readTime: '7 min read' },
  { id: 'sp5', slug: 'capitals-playoff-chances', category: 'Sports', categorySlug: 'sports', title: 'The Capitals are aging, but their playoff window isn\u2019t closed yet', byline: 'By Samantha Pell', time: '9 hours ago', readTime: '6 min read' },
  { id: 'sp6', slug: 'nfl-week-2-picks', category: 'Sports', categorySlug: 'sports', title: 'NFL Week 2 picks: Can the Commanders keep rolling?', byline: 'By The Post Sports Desk', time: '1 day ago', readTime: '8 min read' },
  { id: 'wb4', slug: 'mediterranean-diet-brain', category: 'Well+Being', categorySlug: 'wellbeing', title: 'A Mediterranean diet may slow cognitive decline, long-term study finds', byline: 'By Ariana Eunjung Cha', time: '6 hours ago', readTime: '5 min read' },
  { id: 'wb5', slug: 'cold-plunge-benefits', category: 'Well+Being', categorySlug: 'wellbeing', title: 'Are cold plunges actually good for you? What the science says.', byline: 'By Kelyn Soong', time: '1 day ago', readTime: '7 min read', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80' },
];

export const mostRead = [
  'Schools are quietly banning peanuts. Experts say that\u2019s the wrong move.',
  'Opinion: I used to be a Republican speechwriter. Now I\u2019m voting for Democrats.',
  'The surprising science of why you should take an extra 1,000 steps today',
  'Review: The new Apple Watch is actually worth upgrading for',
  'A cargo plane crashed onto a Florida highway. The full story is even stranger.',
];

// ---------- Helpers ----------

function getLocalArticlesOnly(): Article[] {
  return [
    leadStory,
    ...topStories,
    ...theSeven,
    ...opinions,
    ...sports,
    ...techBusiness,
    ...styleArts,
    ...wellbeing,
    ...moreArticles,
  ];
}

/** All articles, merging file-based MDX content (in content/articles/) over
 *  the legacy in-memory stubs. MDX wins when slugs collide.
 *
 *  IMPORTANT: because `data.ts` is imported by client components (Masthead,
 *  cards, etc.), we MUST NOT statically `require('./mdx')` here — that
 *  would drag the server-only `fs` import into the client bundle. Instead
 *  we only attempt the MDX merge on the server, detected via `globalThis`
 *  having a Node `process` with no window. Client-side callers always get
 *  the in-memory article set (which already includes the stub metadata for
 *  every MDX article; the bodies are rendered server-side on the article
 *  route itself). */
export function getAllArticles(): Article[] {
  const isServer =
    typeof window === 'undefined' &&
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null;
  if (isServer) {
    try {
      // Eval the require as a non-literal string so webpack never statically
      // follows it from a client-compilation boundary.
      // eslint-disable-next-line no-eval
      const mdx = eval("require")('./mdx') as typeof import('./mdx');
      return mdx.getAllArticlesMerged();
    } catch {
      /* fall through to local */
    }
  }
  return getLocalArticlesOnly();
}

export const _LOCAL_ARTICLES_FOR_MDX = getLocalArticlesOnly;

export function getArticleBySlug(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}

export function getRelatedArticles(current: Article, count = 4): Article[] {
  return getAllArticles()
    .filter((a) => a.id !== current.id)
    .filter((a) => !a.opinion)
    .slice(0, count);
}

import { subsectionParent } from './sections';
// Re-exported here so consumers can import from a single barrel.
export { subsectionParent };

export function getSectionBySlug(slug: string): { label: string; slug: string } | undefined {
  const fromNav = [...topNav, ...subNav].find((s) => s.slug === slug);
  if (fromNav) return fromNav;
  // Check section hierarchy (subsections like /whitehouse, /courts, /ai)
  const sub = subsectionParent[slug];
  if (sub) return { label: sub.label, slug };
  return undefined;
}

export function getArticlesBySection(sectionSlug: string): Article[] {
  // Keyword hints for subsections (e.g. /whitehouse, /ai, /courts).
  // Each key is a subsection slug; values are case-insensitive title/kicker/body keywords.
  const keywordMap: Record<string, string[]> = {
    whitehouse: ['white house', 'president', 'biden', 'trump', 'oval office'],
    congress: ['congress', 'senate', 'house of representatives', 'speaker', 'shutdown', 'lawmakers'],
    courts: ['court', 'supreme court', 'justices', 'judge', 'ruling', 'scotus'],
    policy: ['policy', 'regulation', 'reform', 'legislation'],
    elections: ['election', 'campaign', 'vote', 'ballot', 'primary', 'nominee'],
    markets: ['market', 'stocks', 'wall street', 'shares', 'dow', 's&p', 'nasdaq', 'fed', 'interest rate'],
    economy: ['economy', 'gdp', 'inflation', 'jobs', 'unemployment', 'recession'],
    technology: ['tech', 'technology', 'silicon valley', 'startup'],
    'personal-finance': ['personal finance', 'retirement', 'savings', 'mortgage', 'debt', 'credit'],
    ai: ['ai', 'artificial intelligence', 'chatgpt', 'openai', 'anthropic', 'llm'],
    'social-media': ['social media', 'facebook', 'tiktok', 'instagram', 'x ', 'twitter'],
    gadgets: ['gadget', 'iphone', 'apple', 'smartphone', 'laptop', 'device', 'pixel'],
    cybersecurity: ['cybersecurity', 'hack', 'ransomware', 'breach', 'security'],
    europe: ['europe', 'european union', 'ukraine', 'russia', 'france', 'germany', 'britain', 'uk '],
    asia: ['asia', 'china', 'japan', 'korea', 'india', 'taiwan'],
    'middle-east': ['middle east', 'israel', 'gaza', 'hamas', 'iran', 'lebanon', 'syria'],
    americas: ['latin america', 'mexico', 'canada', 'brazil', 'argentina'],
    africa: ['africa', 'ethiopia', 'nigeria', 'sudan', 'kenya'],
    movies: ['movie', 'film', 'oscar', 'hollywood', 'cinema', 'box office'],
    music: ['music', 'album', 'grammy', 'song', 'concert', 'taylor swift', 'beyoncé'],
    television: ['television', 'tv ', 'netflix', 'hbo', 'series', 'episode', 'streaming'],
    books: ['book', 'novel', 'author', 'bestseller', 'literature'],
    'art-design': ['art', 'design', 'museum', 'gallery', 'exhibition'],
    commanders: ['commanders', 'washington commanders', 'nfl'],
    wizards: ['wizards', 'washington wizards', 'nba'],
    capitals: ['capitals', 'washington capitals', 'nhl', 'hockey'],
    nationals: ['nationals', 'washington nationals', 'mlb'],
    nfl: ['nfl', 'football', 'quarterback', 'super bowl'],
    mlb: ['mlb', 'baseball', 'world series'],
    health: ['health', 'doctor', 'patient', 'drug', 'fda', 'covid', 'disease', 'hospital'],
    science: ['science', 'research', 'nasa', 'study', 'scientist', 'space'],
    fitness: ['fitness', 'exercise', 'workout', 'running', 'gym', 'yoga'],
    'food-well': ['food', 'diet', 'recipe', 'nutrition'],
    mindfulness: ['mindfulness', 'meditation', 'mental health', 'stress', 'therapy'],
    weather: ['weather', 'storm', 'hurricane', 'tornado', 'snow', 'forecast'],
    energy: ['energy', 'oil', 'solar', 'wind', 'battery', 'ev ', 'electric vehicle'],
    environment: ['environment', 'pollution', 'wildfire', 'ocean', 'conservation'],
    recipes: ['recipe', 'cook', 'ingredient', 'dish', 'bake'],
    restaurants: ['restaurant', 'chef', 'dining', 'michelin'],
    drinks: ['wine', 'cocktail', 'beer', 'coffee', 'drink'],
    destinations: ['destination', 'visit', 'hotel', 'tourist', 'island', 'beach'],
    'travel-tips': ['travel tips', 'passport', 'luggage', 'airline', 'flight', 'airport'],
    deals: ['deal', 'travel deal', 'airfare', 'discount'],
    editorials: ['editorial'],
    columns: ['column', 'opinion'],
    letters: ['letter to the editor', 'letters'],
    'guest-opinions': ['guest opinion', 'contributing'],
    dc: ['washington, d.c.', 'district', 'd.c.'],
    maryland: ['maryland', 'baltimore'],
    virginia: ['virginia', 'richmond', 'norfolk'],
    traffic: ['traffic', 'commute', 'metro', 'beltway'],
    obituaries: ['died', 'dies at', 'obituary', 'remembered'],
    advice: ['advice', 'ask me', ' Carolyn Hax', 'problem solver'],
    games: ['crossword', 'sudoku', 'quiz', 'puzzle', 'game'],
  };

  const labelMap: Record<string, string | string[]> = {
    politics: 'Politics',
    opinions: 'Opinion',
    'us-news': 'U.S. News',
    style: 'Style',
    investigations: 'Investigations',
    wellbeing: 'Well+Being',
    business: ['Business', 'Economy'],
    tech: 'Tech',
    world: 'World',
    local: 'D.C., Md. & Va.',
    sports: 'Sports',
    food: 'Food',
    travel: 'Travel',
    climate: 'Climate',
    games: 'Games',
  };

  const all = getAllArticles();

  // Subsections use keyword matching on title/kicker/body/category.
  if (keywordMap[sectionSlug]) {
    const kws = keywordMap[sectionSlug];
    const isOpinionSub = ['editorials', 'columns', 'letters', 'guest-opinions'].includes(sectionSlug);
    const matchesKws = (a: Article) => {
      const hay = [a.title, a.kicker, a.category, a.dek, ...(a.body || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return kws.some((k) => hay.includes(k.toLowerCase()));
    };
    const pool = isOpinionSub ? all : all.filter((a) => !a.opinion);
    let matched = pool.filter(matchesKws);
    // Opinion subs prefer opinion=true at the top.
    if (isOpinionSub) {
      matched.sort((a, b) => Number(!!b.opinion) - Number(!!a.opinion));
    }
    if (matched.length >= 4) return matched;
    const others = pool.filter((a) => !matched.includes(a));
    return [...matched, ...others].slice(0, 12);
  }

  const label = labelMap[sectionSlug];
  if (!label) return all.slice(0, 12);
  const labels = Array.isArray(label) ? label : [label];

  // Exact matches first
  const matched = all.filter((a) => {
    if (a.opinion) return false;
    if (a.categorySlug === sectionSlug) return true;
    if (a.category && labels.includes(a.category)) return true;
    return false;
  });

  // If we have fewer than 8 articles, fill with other non-opinion articles
  if (matched.length >= 8) return matched;
  const others = all.filter((a) => !a.opinion && !matched.includes(a));
  return [...matched, ...others].slice(0, 12);
}

export const PAGE_SIZE = 4;

export function getPaginatedArticles(articleList: Article[], page: number, size = PAGE_SIZE) {
  const start = (page - 1) * size;
  return articleList.slice(start, start + size);
}

export function getTotalPages(articleList: Article[], size = PAGE_SIZE) {
  return Math.ceil(articleList.length / size);
}

// ---------- Author helpers ----------

export type Author = {
  slug: string;
  name: string;
  title?: string;
  avatar?: string;
  bio?: string;
  isColumnist: boolean;
  twitter?: string;
  email?: string;
};

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/^by\s+/i, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Strip "By " prefix, split on " and " / "," to get individual author names.
export function parseBylineNames(byline?: string): string[] {
  if (!byline) return [];
  const cleaned = byline
    .replace(/^by\s+/i, '')
    .replace(/\s+and\s+/gi, ',')
    .replace(/\s*,\s*/g, ',');
  return cleaned.split(',').map((s) => s.trim()).filter(Boolean);
}

export function getAllAuthors(): Author[] {
  const bySlug = new Map<string, Author>();
  // Start with known columnists.
  for (const c of columnists) {
    bySlug.set(c.slug, {
      slug: c.slug,
      name: c.name,
      title: c.title,
      avatar: c.avatar,
      bio: c.bio,
      isColumnist: true,
      twitter: c.twitter,
      email: c.email,
    });
  }
  // Add every unique byline writer found across articles.
  for (const a of getAllArticles()) {
    const names = parseBylineNames(a.byline);
    for (const name of names) {
      if (name.toLowerCase() === 'the editorial board') continue;
      const slug = slugify(name);
      if (!slug || bySlug.has(slug)) continue;
      bySlug.set(slug, {
        slug,
        name,
        isColumnist: false,
        title: 'Staff writer',
      });
    }
  }
  return Array.from(bySlug.values());
}

export function getAuthorBySlug(slug: string): Author | undefined {
  return getAllAuthors().find((a) => a.slug === slug);
}

export function getArticlesByAuthor(slug: string): Article[] {
  const author = getAuthorBySlug(slug);
  if (!author) return [];
  // For known columnists, match by exact name. For others, use substring of byline
  // to catch co-authored pieces ("By Erica Werner and Paul Kane").
  const name = author.name.toLowerCase();
  return getAllArticles()
    .filter((a) => {
      if (!a.byline) return false;
      const b = a.byline.toLowerCase();
      // Match whole first+last name, avoiding partial surname collisions by
      // requiring a word boundary or comma/space around the name.
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|\\b|by\\s+)${escaped}(\\b|,|$)`, 'i').test(b);
    })
    .sort((a, b) => {
      // Opinion pieces first for columnists, then by reverse chronological-ish order
      if (author.isColumnist && a.opinion && !b.opinion) return -1;
      if (author.isColumnist && b.opinion && !a.opinion) return 1;
      return 0;
    });
}

export function getAuthorRssFeedUrl(slug: string) {
  return `/api/feed/author/${slug}`;
}

// Section-specific config (different hero images, accent colors, taglines)
export type SectionConfig = {
  label: string;
  tagline: string;
  accent: string;
  heroImage?: string;
};

export const sectionConfig: Record<string, SectionConfig> = {
  politics: { label: 'Politics', tagline: 'Coverage of the White House, Congress, campaigns and political power in Washington.', accent: 'wp-red', heroImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1400&q=80' },
  opinions: { label: 'Opinions', tagline: 'Editorials, columns and letters from our board, contributors and readers.', accent: 'wp-black' },
  world: { label: 'World', tagline: 'International news, analysis and on-the-ground reporting from across the globe.', accent: 'wp-red', heroImage: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1400&q=80' },
  business: { label: 'Business', tagline: 'Markets, economics, companies and the economy that shapes American life.', accent: 'wp-ink' },
  tech: { label: 'Technology', tagline: 'Silicon Valley, AI, gadgets, platforms and the future of the digital economy.', accent: 'wp-ink' },
  sports: { label: 'Sports', tagline: 'Coverage of the Commanders, Wizards, Capitals, Nationals and the games we love.', accent: 'wp-red', heroImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1400&q=80' },
  style: { label: 'Style', tagline: 'Culture, movies, music, fashion, food and the arts that define our moment.', accent: 'wp-red' },
  wellbeing: { label: 'Well+Being', tagline: 'Science-backed advice for living healthier, smarter and happier.', accent: 'wp-link' },
  investigations: { label: 'Investigations', tagline: 'Accountability journalism that holds the powerful to account.', accent: 'wp-black' },
  local: { label: 'D.C., Md. & Va.', tagline: 'Local news, weather, traffic and politics for the Washington region.', accent: 'wp-red' },
  'us-news': { label: 'U.S. News', tagline: 'Breaking and enterprise reporting from across America.', accent: 'wp-ink' },
  food: { label: 'Food', tagline: 'Recipes, restaurant reviews, cooking guides and dining out in D.C.', accent: 'wp-red' },
  travel: { label: 'Travel', tagline: 'Where to go, what to know, and how to make the most of every trip.', accent: 'wp-link' },
  climate: { label: 'Climate', tagline: 'The environment, energy and the changing planet.', accent: 'wp-link' },
  games: { label: 'Games', tagline: 'Crosswords, sudoku and puzzles to play every day.', accent: 'wp-black' },
  'wp-intelligence': { label: 'WP Intelligence', tagline: 'Data journalism, insights and analysis from The Post.', accent: 'wp-ink' },
  ripple: { label: 'Ripple', tagline: 'Stories of community and connection from across America.', accent: 'wp-red' },
  obituaries: { label: 'Obituaries', tagline: 'Lives remembered.', accent: 'wp-ink' },
};
