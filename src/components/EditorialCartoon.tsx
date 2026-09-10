import type { Cartoon } from '@/lib/data';

/**
 * Inline SVG editorial cartoon. The style is a deliberately simplified,
 * black-and-white-with-red-accent caricature (in the spirit of WaPo's Toles/Telnaes).
 * Four themes cover the available cartoons without using real artwork.
 */
export default function EditorialCartoon({ cartoon }: { cartoon: Cartoon }) {
  return (
    <figure className="bg-white border-2 border-wp-black p-4 sm:p-6">
      <div className="border-b border-wp-border pb-2 mb-3 flex items-center justify-between text-[11px] font-sans uppercase tracking-widest text-wp-gray">
        <span>Political Cartoon</span>
        <span>{cartoon.date}</span>
      </div>
      <div className="w-full aspect-[4/3] bg-wp-cream border border-wp-border flex items-center justify-center relative overflow-hidden">
        <svg viewBox="0 0 400 300" className="w-full h-full" aria-label={cartoon.caption} role="img">
          <defs>
            <pattern id="crosshatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#000" strokeWidth="0.5" opacity="0.35" />
            </pattern>
          </defs>

          {/* Ground line */}
          <line x1="0" y1="260" x2="400" y2="260" stroke="#000" strokeWidth="2" />

          {cartoon.theme === 'congress' && (
            <>
              {/* A confused legislator */}
              {/* Body/suit */}
              <rect x="120" y="150" width="70" height="100" fill="#121212" />
              {/* Head */}
              <circle cx="155" cy="120" r="36" fill="#f3d6b7" stroke="#000" strokeWidth="2" />
              {/* Hair */}
              <path d="M120 110 Q155 78 190 110 Q185 95 155 90 Q125 95 120 110 Z" fill="#444" />
              {/* Eyes looking sideways at the clock */}
              <circle cx="148" cy="120" r="2.5" fill="#000" />
              <circle cx="166" cy="120" r="2.5" fill="#000" />
              {/* Worried mouth */}
              <path d="M145 138 Q155 130 165 138" stroke="#000" strokeWidth="2" fill="none" />
              {/* Tie */}
              <polygon points="155,150 148,175 155,200 162,175" fill="#b21414" />
              {/* Label */}
              <text x="155" y="268" textAnchor="middle" fontSize="10" fontFamily="serif" fontStyle="italic">Congress</text>

              {/* Giant shutdown clock */}
              <circle cx="305" cy="160" r="70" fill="#fff" stroke="#000" strokeWidth="3" />
              <circle cx="305" cy="160" r="62" fill="url(#crosshatch)" />
              {/* Clock face marks */}
              <text x="305" y="108" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="serif">12</text>
              <text x="360" y="164" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="serif">3</text>
              <text x="305" y="220" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="serif">6</text>
              <text x="250" y="164" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="serif">9</text>
              {/* Hands at 11:59 */}
              <line x1="305" y1="160" x2="305" y2="108" stroke="#b21414" strokeWidth="4" strokeLinecap="round" />
              <line x1="305" y1="160" x2="358" y2="168" stroke="#000" strokeWidth="3" strokeLinecap="round" transform="rotate(-6 305 160)" />
              <circle cx="305" cy="160" r="4" fill="#000" />
              {/* Sweat drops around congressman */}
              <path d="M195 100 q-3 6 0 12 q3 -6 0 -12 z" fill="#2a8bd4" />
              <path d="M110 98 q-3 6 0 12 q3 -6 0 -12 z" fill="#2a8bd4" />
              {/* Shutdown label on clock */}
              <text x="305" y="268" textAnchor="middle" fontSize="10" fontFamily="serif" fontWeight="bold" fill="#b21414">SHUTDOWN</text>
            </>
          )}

          {cartoon.theme === 'ai' && (
            <>
              {/* Robot figure */}
              <rect x="220" y="100" width="110" height="130" rx="8" fill="#d0d6dc" stroke="#000" strokeWidth="2" />
              <rect x="240" y="80" width="70" height="30" rx="6" fill="#d0d6dc" stroke="#000" strokeWidth="2" />
              <circle cx="255" cy="95" r="5" fill="#b21414" />
              <circle cx="295" cy="95" r="5" fill="#b21414" />
              <rect x="260" y="106" width="30" height="4" fill="#000" />
              {/* Antenna */}
              <line x1="275" y1="80" x2="275" y2="60" stroke="#000" strokeWidth="2" />
              <circle cx="275" cy="58" r="5" fill="#b21414" />
              {/* Arm reaching */}
              <line x1="220" y1="140" x2="150" y2="170" stroke="#000" strokeWidth="6" strokeLinecap="round" />
              {/* Hand holding briefcase labeled "JOB" */}
              <rect x="110" y="160" width="40" height="30" fill="#8b5a2b" stroke="#000" strokeWidth="2" />
              <text x="130" y="180" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold" fontFamily="sans-serif">JOB</text>
              {/* Worried person */}
              <circle cx="70" cy="150" r="28" fill="#f3d6b7" stroke="#000" strokeWidth="2" />
              <circle cx="62" cy="148" r="2" fill="#000" />
              <circle cx="78" cy="148" r="2" fill="#000" />
              <path d="M60 160 q10 -8 20 0" stroke="#000" strokeWidth="2" fill="none" />
              <rect x="50" y="178" width="40" height="70" fill="#121212" />
              {/* AI label on chest */}
              <text x="275" y="170" textAnchor="middle" fontSize="22" fontFamily="monospace" fontWeight="bold" fill="#000">AI</text>
              {/* Speech bubble robot */}
              <path d="M330 90 L375 60 L375 110 Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
              <rect x="330" y="60" width="55" height="40" fill="#fff" stroke="#000" strokeWidth="1.5" rx="4" />
              <text x="357" y="85" textAnchor="middle" fontSize="10" fontFamily="serif" fontStyle="italic">&ldquo;Relax.&rdquo;</text>
            </>
          )}

          {cartoon.theme === 'economy' && (
            <>
              {/* Giant oil barrel */}
              <rect x="230" y="90" width="80" height="150" rx="6" fill="#1a1a1a" stroke="#000" strokeWidth="2" />
              <ellipse cx="270" cy="90" rx="40" ry="10" fill="#333" stroke="#000" strokeWidth="2" />
              <ellipse cx="270" cy="240" rx="40" ry="10" fill="#000" stroke="#000" strokeWidth="2" />
              <rect x="230" y="110" width="80" height="6" fill="#555" />
              <rect x="230" y="220" width="80" height="6" fill="#555" />
              <text x="270" y="170" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#b21414" fontFamily="serif">$100</text>
              <text x="270" y="195" textAnchor="middle" fontSize="10" fill="#fff" fontFamily="sans-serif">PER BARREL</text>
              {/* Worried driver holding gas pump */}
              <circle cx="110" cy="140" r="30" fill="#f3d6b7" stroke="#000" strokeWidth="2" />
              <circle cx="100" cy="138" r="2.5" fill="#000" />
              <circle cx="120" cy="138" r="2.5" fill="#000" />
              <path d="M100 155 q10 -4 20 2" stroke="#000" strokeWidth="2" fill="none" />
              <rect x="85" y="170" width="50" height="80" fill="#2a8bd4" stroke="#000" strokeWidth="2" />
              {/* Arm holding hose to barrel */}
              <path d="M135 190 Q180 180 230 160" stroke="#000" strokeWidth="4" fill="none" />
              <rect x="215" y="150" width="18" height="26" fill="#444" stroke="#000" strokeWidth="2" />
              {/* Dollar signs flying from driver to barrel */}
              <text x="170" y="130" fontSize="18" fill="#2e7d32" fontWeight="bold" fontFamily="serif" transform="rotate(-10 170 130)">$</text>
              <text x="195" y="115" fontSize="18" fill="#2e7d32" fontWeight="bold" fontFamily="serif" transform="rotate(-10 195 115)">$</text>
              <text x="218" y="105" fontSize="18" fill="#2e7d32" fontWeight="bold" fontFamily="serif" transform="rotate(-10 218 105)">$</text>
            </>
          )}

          {cartoon.theme === 'whitehouse' && (
            <>
              {/* White House silhouette */}
              <rect x="100" y="170" width="200" height="80" fill="#fafafa" stroke="#000" strokeWidth="2" />
              <polygon points="90,170 310,170 280,130 120,130" fill="#fafafa" stroke="#000" strokeWidth="2" />
              {/* Columns */}
              {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} x={120 + i * 38} y={170} width={8} height={80} fill="#fafafa" stroke="#000" strokeWidth="1.5" />
              ))}
              <circle cx="200" cy="150" r="8" fill="#fff" stroke="#000" strokeWidth="1.5" />
              {/* Person standing at podium */}
              <circle cx="200" cy="210" r="12" fill="#f3d6b7" stroke="#000" strokeWidth="1.5" />
              <rect x="190" y="222" width="20" height="28" fill="#121212" />
              <rect x="175" y="250" width="50" height="10" fill="#4a3527" stroke="#000" strokeWidth="1" />
              {/* Red tape / seal */}
              <circle cx="200" cy="205" r="3" fill="#b21414" />
            </>
          )}
        </svg>
      </div>
      <figcaption className="mt-3 font-serif italic text-wp-ink text-[15px] leading-snug">
        &ldquo;{cartoon.caption}&rdquo;
      </figcaption>
      <p className="mt-1 byline text-wp-gray text-xs">
        — {cartoon.cartoonist}, editorial cartoonist
      </p>
    </figure>
  );
}
