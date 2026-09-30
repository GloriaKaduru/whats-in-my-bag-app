import type { JSX } from 'react'
import type { ArtKey } from '../data/bag'

/**
 * Shaded vector stand-ins for each object. They exist so the experience is
 * complete before the real photographs arrive, and so a missing photo
 * degrades gracefully instead of leaving a hole in the composition.
 */
export function ObjectArt({ art }: { art: ArtKey }) {
  const Art = ART[art]
  return <Art />
}

const svg = { xmlns: 'http://www.w3.org/2000/svg', role: 'presentation', width: '100%', style: { display: 'block' } }

const ART: Record<ArtKey, () => JSX.Element> = {
  idcard: () => (
    <svg {...svg} viewBox="0 0 160 102">
      <defs>
        <linearGradient id="id-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9ede4" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="156" height="98" rx="8" fill="url(#id-card)" stroke="#d5dccd" />
      <path d="M2 10 Q2 2 10 2 L150 2 Q158 2 158 10 L158 26 L2 26 Z" fill="#1f7a3f" />
      <text x="80" y="19" textAnchor="middle" fontFamily="Lato, sans-serif" fontWeight="700" fontSize="11" letterSpacing="2" fill="#fff">
        NYSC
      </text>
      <rect x="12" y="34" width="40" height="50" rx="3" fill="#c9d3c0" />
      <circle cx="32" cy="52" r="10" fill="#9fae95" />
      <path d="M16 84 Q32 64 48 84 Z" fill="#9fae95" />
      <rect x="62" y="38" width="80" height="6" rx="3" fill="#43302e" opacity=".75" />
      <rect x="62" y="52" width="64" height="5" rx="2.5" fill="#43302e" opacity=".35" />
      <rect x="62" y="64" width="72" height="5" rx="2.5" fill="#43302e" opacity=".35" />
      <rect x="62" y="76" width="50" height="5" rx="2.5" fill="#43302e" opacity=".35" />
      <rect x="2" y="94" width="156" height="6" fill="#e3c75a" opacity=".6" />
    </svg>
  ),

  cdscard: () => (
    <svg {...svg} viewBox="0 0 92 130">
      <rect x="2" y="2" width="88" height="126" rx="6" fill="#fbfaf4" stroke="#dcd6c6" />
      <rect x="2" y="2" width="88" height="22" rx="6" fill="#1f7a3f" />
      <rect x="2" y="16" width="88" height="8" fill="#1f7a3f" />
      <text x="46" y="17" textAnchor="middle" fontFamily="Lato, sans-serif" fontWeight="700" fontSize="9" letterSpacing="1.5" fill="#fff">
        CDS
      </text>
      <circle cx="46" cy="46" r="13" fill="#e3e8dc" stroke="#1f7a3f" strokeWidth="1.5" />
      {[70, 82, 94, 106].map((y, i) => (
        <g key={y}>
          <rect x="12" y={y} width="22" height="4" rx="2" fill="#43302e" opacity=".5" />
          <rect x="38" y={y} width={[40, 32, 36, 26][i]} height="4" rx="2" fill="#43302e" opacity=".22" />
        </g>
      ))}
      <path d="M58 112 q6 -8 10 0 t10 0" fill="none" stroke="#2b4f8f" strokeWidth="1.4" />
    </svg>
  ),

  keys: () => (
    <svg {...svg} viewBox="0 0 150 160">
      <defs>
        <linearGradient id="k-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dc9a" />
          <stop offset=".5" stopColor="#b8913d" />
          <stop offset="1" stopColor="#e8c878" />
        </linearGradient>
        <linearGradient id="k-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2f2f0" />
          <stop offset=".5" stopColor="#9a9a98" />
          <stop offset="1" stopColor="#dcdcda" />
        </linearGradient>
      </defs>
      <circle cx="75" cy="40" r="26" fill="none" stroke="url(#k-silver)" strokeWidth="5" />
      <g transform="rotate(30 75 66)">
        <path d="M67 62 h16 v56 l-4 4 v6 h6 v6 h-6 v8 l-4 4 h-8 Z" fill="url(#k-gold)" />
        <circle cx="75" cy="72" r="3" fill="#6b5320" />
      </g>
      <g transform="rotate(-24 75 66)">
        <path d="M68 64 h14 v50 h5 v6 h-5 v6 h7 v6 h-7 v10 h-14 Z" fill="url(#k-silver)" />
      </g>
      <g transform="rotate(4 75 66)">
        <path d="M70 64 h10 v42 h4 v5 h-4 v6 h6 v5 h-6 v8 h-10 Z" fill="url(#k-gold)" opacity=".92" />
      </g>
    </svg>
  ),

  makeup: () => (
    <svg {...svg} viewBox="0 0 150 110">
      <defs>
        <linearGradient id="mk-pouch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3c6cf" />
          <stop offset="1" stopColor="#d9929f" />
        </linearGradient>
        <pattern id="mk-quilt" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0 H16 M0 0 V16" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
        </pattern>
      </defs>
      <path d="M14 24 Q14 16 22 16 L128 16 Q136 16 136 24 L144 92 Q145 106 130 106 L20 106 Q5 106 6 92 Z" fill="url(#mk-pouch)" />
      <path d="M14 24 Q14 16 22 16 L128 16 Q136 16 136 24 L144 92 Q145 106 130 106 L20 106 Q5 106 6 92 Z" fill="url(#mk-quilt)" />
      <rect x="14" y="16" width="122" height="8" fill="#b97884" />
      <path d="M18 20 H132" stroke="#e8d7a8" strokeWidth="2" strokeDasharray="2 2" />
      <rect x="120" y="14" width="10" height="22" rx="3" fill="#e8d7a8" />
      <path d="M125 36 q-4 10 0 16" fill="none" stroke="#e8d7a8" strokeWidth="2" />
      <ellipse cx="50" cy="44" rx="30" ry="8" fill="#fff" opacity=".22" />
    </svg>
  ),

  laptop: () => (
    <svg {...svg} viewBox="0 0 260 176">
      <defs>
        <linearGradient id="lp-lid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9eaec" />
          <stop offset=".5" stopColor="#c9cbcf" />
          <stop offset="1" stopColor="#a9acb1" />
        </linearGradient>
      </defs>
      <rect x="6" y="10" width="248" height="162" rx="10" fill="#8e9196" />
      <rect x="4" y="4" width="248" height="162" rx="10" fill="url(#lp-lid)" />
      <rect x="4" y="4" width="248" height="162" rx="10" fill="none" stroke="#fff" strokeOpacity=".5" />
      <circle cx="128" cy="85" r="12" fill="#fff" opacity=".45" />
      <path d="M20 14 L90 14 L40 150 L20 150 Z" fill="#fff" opacity=".12" />
    </svg>
  ),

  passport: () => (
    <svg {...svg} viewBox="0 0 100 140">
      <defs>
        <linearGradient id="pp-cover" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e6b3b" />
          <stop offset="1" stopColor="#0f4a26" />
        </linearGradient>
      </defs>
      <rect x="6" y="4" width="92" height="134" rx="5" fill="#f1ecdf" />
      <rect x="2" y="2" width="92" height="134" rx="5" fill="url(#pp-cover)" />
      <text x="48" y="30" textAnchor="middle" fontFamily="Lustria, serif" fontSize="8" letterSpacing="1" fill="#e3c75a">
        NIGERIA
      </text>
      <circle cx="48" cy="66" r="18" fill="none" stroke="#e3c75a" strokeWidth="1.6" />
      <path d="M40 72 L48 56 L56 72 Z" fill="#e3c75a" />
      <text x="48" y="108" textAnchor="middle" fontFamily="Lustria, serif" fontSize="9" letterSpacing="1.5" fill="#e3c75a">
        PASSPORT
      </text>
      <rect x="40" y="118" width="16" height="10" rx="1" fill="none" stroke="#e3c75a" strokeWidth="1" />
    </svg>
  ),

  cash: () => (
    <svg {...svg} viewBox="0 0 190 120">
      <g transform="rotate(-8 95 60)">
        <rect x="18" y="26" width="160" height="76" rx="3" fill="#7a5b8f" />
        <rect x="26" y="34" width="144" height="60" rx="2" fill="none" stroke="#fff" strokeOpacity=".3" />
      </g>
      <g transform="rotate(4 95 60)">
        <rect x="12" y="20" width="160" height="76" rx="3" fill="#3f7a5a" />
        <rect x="20" y="28" width="144" height="60" rx="2" fill="none" stroke="#fff" strokeOpacity=".3" />
        <circle cx="130" cy="58" r="18" fill="#fff" opacity=".18" />
        <text x="40" y="50" fontFamily="Lato, sans-serif" fontWeight="700" fontSize="16" fill="#fff" opacity=".85">
          ₦500
        </text>
        <rect x="36" y="64" width="50" height="4" rx="2" fill="#fff" opacity=".4" />
      </g>
    </svg>
  ),

  earbuds: () => (
    <svg {...svg} viewBox="0 0 120 100">
      <defs>
        <radialGradient id="e-case" cx=".4" cy=".3" r=".9">
          <stop offset="0" stopColor="#4a4a4d" />
          <stop offset=".7" stopColor="#1f1f21" />
          <stop offset="1" stopColor="#0e0e0f" />
        </radialGradient>
      </defs>
      <rect x="6" y="8" width="108" height="86" rx="34" fill="url(#e-case)" />
      <path d="M8 38 Q60 44 112 38" fill="none" stroke="#000" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="2.5" fill="#6ccf6a" />
      <ellipse cx="44" cy="22" rx="22" ry="7" fill="#fff" opacity=".14" />
    </svg>
  ),

  handcream: () => (
    <svg {...svg} viewBox="0 0 56 190">
      <defs>
        <linearGradient id="hc-tube" x1="0" x2="1">
          <stop offset="0" stopColor="#d9d6d1" />
          <stop offset=".35" stopColor="#ffffff" />
          <stop offset="1" stopColor="#bdb8b0" />
        </linearGradient>
        <linearGradient id="hc-cap" x1="0" x2="1">
          <stop offset="0" stopColor="#8c8780" />
          <stop offset=".4" stopColor="#e6e2da" />
          <stop offset="1" stopColor="#7a756e" />
        </linearGradient>
      </defs>
      <path d="M4 6 L52 6 L50 16 L6 16 Z" fill="#cfcac2" />
      <path d="M6 14 L50 14 L44 150 L12 150 Z" fill="url(#hc-tube)" />
      <rect x="12" y="148" width="32" height="36" rx="4" fill="url(#hc-cap)" />
      <text x="28" y="84" textAnchor="middle" fontFamily="Lustria, serif" fontSize="8" letterSpacing="1" fill="#43302e" transform="rotate(-90 28 84)">
        hand cream
      </text>
    </svg>
  ),

  powerbank: () => (
    <svg {...svg} viewBox="0 0 150 96">
      <defs>
        <linearGradient id="pb-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#56585c" />
          <stop offset="1" stopColor="#26272a" />
        </linearGradient>
      </defs>
      <rect x="4" y="6" width="142" height="86" rx="14" fill="url(#pb-body)" />
      <rect x="4" y="6" width="142" height="30" rx="14" fill="#fff" opacity=".06" />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={98 + i * 10} cy="72" r="2.6" fill={i < 3 ? '#8fd3f4' : '#44474c'} />
      ))}
      <rect x="16" y="66" width="20" height="8" rx="2" fill="#141416" />
      <rect x="42" y="66" width="12" height="8" rx="3" fill="#141416" />
    </svg>
  ),
}
