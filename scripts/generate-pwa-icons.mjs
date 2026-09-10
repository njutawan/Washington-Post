/**
 * Generate minimal PWA icons (no external image library needed).
 * Creates a solid black rounded square with the serif "WP" mark in white,
 * plus a small mono badge. Run once during dev: `node scripts/generate-pwa-icons.mjs`.
 * Uses pure Node zlib + chunked PNG encoding — no dependencies.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { resolve } from 'node:path';

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, pixels /* Uint8Array RGBA */) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  // Add filter byte (0) at start of each scanline
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// Draw "W" mark on a dark background with red bar at bottom.
function draw(size) {
  const buf = Buffer.alloc(size * size * 4);
  const bg = [18, 18, 18, 255];      // #121212
  const fg = [250, 249, 246, 255];  // #faf9f6
  const accent = [180, 0, 1, 255];  // #b40001
  const pad = Math.round(size * 0.08);
  const accentH = Math.max(4, Math.round(size * 0.08));

  // Background with rounded corners (approximate with solid fill; iOS masks)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * 4;
      let c = bg;
      if (y >= size - accentH - pad && y < size - pad && x >= pad && x < size - pad) c = accent;
      buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2]; buf[o + 3] = c[3];
    }
  }
  // Draw a bold serif-ish "WP" using diagonal strokes of "W" + two vertical "P" bars.
  // This is intentionally primitive but legible at 192/512; the letters fill the center.
  const stroke = Math.max(6, Math.round(size * 0.09));
  const top = pad * 2;
  const bottom = size - accentH - pad * 2;
  const left = pad * 2;
  const right = size - pad * 2;

  function line(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0, y = y0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      for (let oy = -Math.floor(stroke / 2); oy < Math.ceil(stroke / 2); oy++) {
        for (let ox = -Math.floor(stroke / 2); ox < Math.ceil(stroke / 2); ox++) {
          const px = x + ox, py = y + oy;
          if (px < 0 || py < 0 || px >= size || py >= size) continue;
          // only draw within letter area (above red bar, inside padding)
          if (py > bottom || py < top) continue;
          if (px < left || px > right) continue;
          const o = (py * size + px) * 4;
          buf[o] = fg[0]; buf[o + 1] = fg[1]; buf[o + 2] = fg[2]; buf[o + 3] = fg[3];
        }
      }
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  const wRight = Math.round((right - left) * 0.48) + left;
  const midX = Math.round((left + wRight) / 2);
  const wBottom1 = Math.round(left + (wRight - left) * 0.25);
  const wBottom2 = Math.round(left + (wRight - left) * 0.75);
  // W shape
  line(left, top, wBottom1, bottom);
  line(wBottom1, bottom, midX, Math.round(top + (bottom - top) * 0.55));
  line(midX, Math.round(top + (bottom - top) * 0.55), wBottom2, bottom);
  line(wBottom2, bottom, wRight, top);

  // P shape (simplified: vertical bar + bowl)
  const pLeft = wRight + Math.round(size * 0.06);
  const pRight = right;
  const pMidV = Math.round(top + (bottom - top) * 0.45);
  line(pLeft, top, pLeft, bottom);
  // Bowl using diagonals + a horizontal
  const bowlRight = pRight - Math.round(size * 0.02);
  line(pLeft, top, bowlRight, top + Math.round((pMidV - top) * 0.2));
  line(bowlRight, top + Math.round((pMidV - top) * 0.2), bowlRight, pMidV - Math.round(stroke / 2));
  line(bowlRight, pMidV - Math.round(stroke / 2), pLeft, pMidV);
  return buf;
}

mkdirSync(resolve('public/icons'), { recursive: true });
for (const size of [72, 192, 512]) {
  const pixels = draw(size);
  const png = encodePng(size, size, pixels);
  writeFileSync(resolve(`public/icons/icon-${size}.png`), png);
  console.log(`wrote public/icons/icon-${size}.png (${png.length} bytes)`);
}
// Badge: solid red square with white "W" (smaller monochrome)
const B = 72;
const badge = Buffer.alloc(B * B * 4);
for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) {
  const o = (y * B + x) * 4;
  badge[o] = 180; badge[o + 1] = 0; badge[o + 2] = 1; badge[o + 3] = 255;
}
const strokeW = Math.max(4, Math.round(B * 0.11));
function bline(x0,y0,x1,y1) {
  const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0);const sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx-dy,x=x0,y=y0;
  while(true){
    for(let oy=-Math.floor(strokeW/2);oy<Math.ceil(strokeW/2);oy++)for(let ox=-Math.floor(strokeW/2);ox<Math.ceil(strokeW/2);ox++){
      const px=x+ox,py=y+oy;if(px<0||py<0||px>=B||py>=B)continue;const o=(py*B+px)*4;badge[o]=250;badge[o+1]=249;badge[o+2]=246;badge[o+3]=255;
    }
    if(x===x1&&y===y1)break;const e2=2*err;if(e2>-dy){err-=dy;x+=sx;}if(e2<dx){err+=dx;y+=sy;}
  }
}
const m=8, bl=m, br=B-m, bt=m, bb=B-m;
bline(bl,bt,Math.round(bl+(br-bl)*0.25),bb);
bline(Math.round(bl+(br-bl)*0.25),bb,Math.round((bl+br)/2),Math.round(bt+(bb-bt)*0.55));
bline(Math.round((bl+br)/2),Math.round(bt+(bb-bt)*0.55),Math.round(bl+(br-bl)*0.75),bb);
bline(Math.round(bl+(br-bl)*0.75),bb,br,bt);
writeFileSync(resolve('public/icons/badge-72.png'), encodePng(B, B, badge));
console.log(`wrote public/icons/badge-72.png`);
