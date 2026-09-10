const fs = require('fs');
const path = require('path');
const jiti = require('jiti')(__filename, { interopDefault: true, esmResolve: true });

// jiti handles TS + path aliases via tsconfig paths? Need to register
// We'll resolve @/ manually by patching require
const Module = require('module');
const origReq = Module.prototype.require;
const ROOT = path.resolve(__dirname, '..');
Module.prototype.require = function(id) {
  if (id.startsWith('@/')) id = path.join(ROOT, 'src', id.slice(2));
  return origReq.call(this, id);
};

const data = jiti(path.join(ROOT, 'src/lib/data.ts'));
const allArticles = data.getAllArticles();

const OUT_DIR = path.join(ROOT, 'content', 'articles');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const existingSlugs = new Set(fs.readdirSync(OUT_DIR).map(f => f.replace(/\.mdx$/, '')));

const OPENERS = {
  Politics: ['WASHINGTON —','On a crisp morning on Capitol Hill,','In a sign of how quickly the political winds can shift,'],
  Business: ['The latest numbers landed like a jolt on Wall Street','For business owners across the country, the new figures represent','Economists spent much of this week recalibrating their forecasts after'],
  Tech: ['For years, Silicon Valley has promised that the next wave of innovation','The announcement landed in a blog post Tuesday evening, and by sunrise','Investors have been pouring money into the sector at a pace not seen'],
  World: ['PARIS —','LONDON —','Officials in two European capitals confirmed Monday that'],
  Sports: ['It was the kind of moment that reminded everyone why they watch','Inside the locker room after the game, the mood was','For the second consecutive week,'],
  Style: ['Telluride, Colo. —','Cultural moments this unmistakable don\u2019t arrive every year','On a recent evening in Lower Manhattan,'],
  Food: ['Any list like this is bound to start arguments','Washington\u2019s dining scene has shifted so dramatically','The meal started quietly enough:'],
  Travel: ['The first thing you notice about the place is the silence','Most visitors to the national parks arrive in July and August','Getting there requires a little patience'],
  'Well+Being': ['Researchers have long suspected a link, but the new study','The conventional advice, it turns out, may be wrong','Scientists studying longevity say one habit appears consistently'],
  Opinions: ['Let\u2019s get one thing straight at the outset:','The conventional wisdom in Washington has settled, prematurely,','It is a peculiar feature of our politics that'],
  Investigations: ['The documents tell a story that few were willing to hear six months ago.','For months, the numbers didn\u2019t add up.','Interviews with more than two dozen current and former employees'],
};
const catKey = (c) => c && OPENERS[c] ? c : (c && /opin/i.test(c) ? 'Opinions' : 'Politics');
const pick = (l, s) => l[s % l.length];
const hash = (s) => { let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h); };

function buildBody(a){
  const cat = catKey(a.category);
  const seed = hash(a.slug);
  const opener = pick(OPENERS[cat], seed);
  const titleRest = a.title.charAt(0).toLowerCase() + a.title.slice(1).replace(/\.$/, '');
  const author = (a.byline||'officials').replace(/^By\s+/i,'');
  return [
    `${opener} ${titleRest} \u2014 a development that policymakers, analysts and ordinary Americans will be parsing for weeks.`,
    `In interviews Tuesday, ${author} and other experts described a rapidly evolving situation, with new details emerging by the hour. \u201cWe are watching this very closely,\u201d one senior administration official said, speaking on the condition of anonymity to discuss internal deliberations. \u201cThere is no precedent for what we're seeing right now.\u201d`,
    `The announcement marks a turning point for an issue that has languished in Washington for years. It arrives as voters across the country grow increasingly frustrated with the pace of change and as both parties search for a message that will resonate heading into the next election cycle.`,
    '',
    `> \u201cIt's hard to overstate how significant this is,\u201d said a person familiar with the discussions, who was not authorized to speak publicly. \u201cThe public hasn't yet processed what it means.\u201d`,
    '',
    `At the heart of the debate is a disagreement over how to balance competing priorities in an era of divided government. Proponents argue the shift is long overdue, while critics warn of unintended consequences that could ripple through the economy and everyday American life for years to come.`,
    `Markets reacted cautiously in early trading before settling into a pattern that suggested investors were still weighing the long-term implications. The Dow Jones industrial average swung between gains and losses for much of the session before closing slightly higher.`,
    `For ordinary Americans, the impact will be felt in ways both obvious and subtle \u2014 in household budgets, in commutes, in the price of a gallon of milk or a tank of gas, and in the conversations unfolding around kitchen tables from coast to coast.`,
    '',
    `What comes next remains uncertain. Officials cautioned that the situation remains fluid, with additional announcements expected as early as this week. For now, Americans are left waiting \u2014 and watching.`,
  ].join('\n\n');
}
function yamlVal(v){
  if(v===undefined||v===null) return '';
  if(typeof v==='boolean') return v?'true':'false';
  const s=String(v).replace(/\n/g,' ').replace(/"/g,'\\"');
  if(/[:#\-?&*!|>'"%@`]/.test(s) || /^[\s]|[\s]$/.test(s) || s==='') return `"${s}"`;
  return s;
}

let written=0, skipped=0;
for(const a of allArticles){
  if(!a.slug || existingSlugs.has(a.slug) || a.live){ skipped++; continue; }
  const fm = ['title','dek','kicker','category','categorySlug','byline','time','readTime','image','credit','caption','opinion','authorTitle'];
  let out='---\n';
  for(const k of fm){ if(a[k]!==undefined&&a[k]!==null&&a[k]!=='') out+=`${k}: ${yamlVal(a[k])}\n`; }
  out+='---\n\n'+buildBody(a)+'\n';
  fs.writeFileSync(path.join(OUT_DIR, a.slug+'.mdx'), out, 'utf-8');
  written++;
}
console.log('Wrote', written, 'MDX files, skipped', skipped);
console.log('Total MDX articles:', fs.readdirSync(OUT_DIR).length);
