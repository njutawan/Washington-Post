// Quick WCAG contrast checker
function hex(c) { c = c.replace('#',''); if(c.length===3) c=c.split('').map(x=>x+x).join(''); return [parseInt(c.slice(0,2),16)/255,parseInt(c.slice(2,4),16)/255,parseInt(c.slice(4,6),16)/255]; }
function lin(v){return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}
function lum(c){const [r,g,b]=hex(c).map(lin);return 0.2126*r+0.7152*g+0.0722*b;}
function ratio(a,b){const l1=lum(a),l2=lum(b);const [x,y]=l1>l2?[l1,l2]:[l2,l1];return (x+0.05)/(y+0.05);}
const pairs=[
  ['#121212','#f0ede6','cream text on dark bg'],
  ['#121212','#b5b0a6','muted gray on dark bg'],
  ['#121212','#7fb3e6','link blue on dark bg'],
  ['#121212','#ff5555','red on dark bg'],
  ['#1a1a1a','#f0ede6','text on surface'],
  ['#faf9f6','#121212','black on cream'],
  ['#faf9f6','#b40001','red on cream'],
  ['#faf9f6','#1a6ec5','link on cream'],
  ['#faf9f6','#6b6b6b','gray on cream'],
  ['#1a1a1a','#e4e0d6','body on dark card'],
  ['#1a1a1a','#b5b0a6','muted on dark card'],
  ['#1a1a1a','#ff5555','red on dark card'],
  ['#1a1a1a','#7fb3e6','link on dark card'],
  ['#1a1a1a','#6fd48b','green on dark card'],
  ['#b40001','#ffffff','white on pinned red'],
  ['#121212','#ffffff','white on pinned black'],
  ['#1e7e34','#ffffff','white on pinned green'],
  ['#f5f3ee','#6b6b6b','gray on image-box'],
  ['#121212','#f87171','footer kicker red-400'],
];
for(const [bg,fg,n]of pairs){const r=ratio(bg,fg);console.log(`${n.padEnd(28)} ${fg}/${bg} = ${r.toFixed(2)}:1 ${r>=7?'AAA':r>=4.5?'AA':r>=3?'AA-large':'FAIL'}`);}
