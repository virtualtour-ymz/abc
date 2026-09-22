import type { SVGProps } from "react";

type Mood = "idle" | "cheer" | "comfort";

/**
 * «پُرس» — rigged vector mascot (goose nurse). Smooth CSS animation with
 * separated parts: wing wave, blink, breathe, heart pulse, cheer jump,
 * brow tilt + tear for comfort mood. Gradient-shaded (not flat) with
 * soft rim-light and cheek blush for a polished, professional look.
 */
export function Mascot({ mood = "idle", className = "", ...props }: { mood?: Mood } & SVGProps<SVGSVGElement>) {
  const cheer = mood === "cheer";
  const comfort = mood === "comfort";
  const wave = mood === "idle";

  return (
    <span className={`inline-block aspect-square ${cheer ? "m-jump" : comfort ? "m-sway" : "m-float"} ${className}`}>
      <svg viewBox="0 0 180 210" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
        <defs>
          <radialGradient id="p-head" cx="40%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#FFF9EC" />
            <stop offset="70%" stopColor="#FBEED6" />
            <stop offset="100%" stopColor="#EED6AC" />
          </radialGradient>
          <radialGradient id="p-body" cx="42%" cy="28%" r="85%">
            <stop offset="0%" stopColor="#3FCBB6" />
            <stop offset="55%" stopColor="#2BB3A0" />
            <stop offset="100%" stopColor="#1E9382" />
          </radialGradient>
          <linearGradient id="p-cap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3FCBB6" />
            <stop offset="100%" stopColor="#24998A" />
          </linearGradient>
          <linearGradient id="p-beak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F9BC70" />
            <stop offset="100%" stopColor="#E88F3A" />
          </linearGradient>
          <radialGradient id="p-wing" cx="42%" cy="30%" r="85%">
            <stop offset="0%" stopColor="#FBEED6" />
            <stop offset="100%" stopColor="#E8CE9F" />
          </radialGradient>
          <radialGradient id="p-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="p-blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF9E9E" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FF9E9E" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="p-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ground shadow */}
        <ellipse className="m-shadow" cx="90" cy="198" rx="54" ry="10" fill="url(#p-shadow)" />

        {/* tail feathers (peek out behind body) */}
        <g opacity="0.95">
          <path d="M124 118 Q146 122 150 138 Q136 132 122 132 Z" fill="url(#p-wing)" />
        </g>

        {/* legs + feet */}
        <g>
          <rect x="67" y="168" width="7" height="22" rx="3.5" fill="#E88F3A" />
          <rect x="106" y="168" width="7" height="22" rx="3.5" fill="#E88F3A" />
          <path d="M58 190 q12 8 24 0 q-4 10 -12 10 t-12 -10 z" fill="#F6A54A" />
          <path d="M98 190 q12 8 24 0 q-4 10 -12 10 t-12 -10 z" fill="#F6A54A" />
        </g>

        {/* body / gown */}
        <g className="m-body">
          <path
            d="M48 90 Q45 112 52 140 Q60 176 90 176 Q120 176 128 140 Q135 112 132 90 Q116 80 90 80 Q64 80 48 90 Z"
            fill="url(#p-body)"
          />
          {/* rim light, upper-left */}
          <path d="M50 92 Q47 114 54 138 Q58 150 64 158 Q54 150 50 132 Q46 112 50 92 Z" fill="url(#p-rim)" />
          {/* V-neck cream */}
          <path d="M76 82 L90 104 L104 82 Q90 78 76 82 Z" fill="url(#p-head)" />
          {/* hem shading */}
          <path d="M52 168 Q90 178 128 168 L128 176 Q90 186 52 176 Z" fill="#17877A" opacity="0.55" />
          {/* buttons */}
          <circle cx="90" cy="146" r="2.1" fill="#0E6E62" opacity="0.7" />
          <circle cx="90" cy="156" r="2.1" fill="#0E6E62" opacity="0.7" />
        </g>

        {/* left wing (static) */}
        <g className="m-wing-static">
          <path d="M26 108 Q16 128 26 150 Q40 142 44 126 Q46 114 38 104 Q31 100 26 108 Z" fill="url(#p-wing)" />
          <path d="M30 116 Q28 130 33 142" stroke="#D8B98A" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>

        {/* right wing (waving / raised / drooping) */}
        <g className={cheer ? "m-wing m-wing-up" : comfort ? "m-wing m-wing-droop" : wave ? "m-wing m-wing-wave" : "m-wing"}>
          <path d="M154 108 Q164 128 154 150 Q140 142 136 126 Q134 114 142 104 Q149 100 154 108 Z" fill="url(#p-wing)" />
          <path d="M150 116 Q152 130 147 142" stroke="#D8B98A" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>

        {/* neck + head */}
        <rect x="76" y="58" width="28" height="46" rx="13" fill="url(#p-head)" />
        <g className="m-head">
          <circle cx="90" cy="52" r="26" fill="url(#p-head)" />
          <path d="M68 40 Q72 26 90 26" stroke="url(#p-rim)" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />

          {/* cheek blush */}
          <circle cx="70" cy="58" r="7" fill="url(#p-blush)" />
          <circle cx="110" cy="58" r="7" fill="url(#p-blush)" />

          {/* cap */}
          <path d="M64 46 Q90 18 116 46 L116 50 Q90 40 64 50 Z" fill="url(#p-cap)" />
          <path d="M68 40 Q90 24 112 40" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.35" />
          <rect x="64" y="48" width="52" height="7" rx="3.5" fill="#1F8F7F" />
          <g stroke="#0E6E62" strokeWidth="2.4" strokeLinecap="round">
            <path d="M88 41 v8" />
            <path d="M84 45 h8" />
          </g>

          {/* brows — tilt expresses mood */}
          <g className="m-brow" stroke="#B08A52" strokeWidth="2.2" strokeLinecap="round">
            <path d={comfort ? "M72 44 q5 3 9 3" : cheer ? "M72 45 q5 -3 9 -1" : "M72 44 q5 -2 9 0"} fill="none" />
            <path d={comfort ? "M108 44 q-5 3 -9 3" : cheer ? "M108 45 q-5 -3 -9 -1" : "M108 44 q-5 -2 -9 0"} fill="none" />
          </g>

          {/* eyes */}
          <g className={comfort ? "" : "m-eye"}>
            {comfort ? (
              <>
                <path d="M74 53 q4 -3 8 0" stroke="#26323A" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                <path d="M98 53 q4 -3 8 0" stroke="#26323A" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="78" cy="52" r="4.2" fill="#26323A" />
                <circle cx="102" cy="52" r="4.2" fill="#26323A" />
                <circle cx="79.4" cy="50.6" r="1.5" fill="#FFFFFF" />
                <circle cx="103.4" cy="50.6" r="1.5" fill="#FFFFFF" />
              </>
            )}
          </g>

          {/* comfort tear */}
          {comfort && (
            <path className="m-tear" d="M74 57 q3 5 0 8 q-3 -3 0 -8 Z" fill="#7DD3E8" opacity="0.9" />
          )}

          {/* beak */}
          <g>
            <ellipse cx="90" cy="68" rx="15" ry="10" fill="url(#p-beak)" />
            <path d={comfort ? "M78 71 Q90 68 102 71" : "M78 70 Q90 74 102 70"} stroke="#D67C2C" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        </g>

        {/* stethoscope */}
        <g stroke="#33424A" strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M72 52 Q72 78 90 84 Q108 78 108 52" />
        </g>
        <circle cx="90" cy="98" r="7" fill="#33424A" />
        <circle cx="90" cy="98" r="3" fill="#4A5D68" />

        {/* pocket + heart */}
        <rect x="79" y="116" width="22" height="18" rx="4" fill="#1E9382" opacity="0.85" />
        <g transform="translate(90 125) scale(0.62) translate(-12 -12)">
          <path
            className={comfort ? "" : "m-heart"}
            d="M12 21s-6.7-4.35-9.33-8.11C.9 10.53 1.6 7.5 4 6.5c2-.84 4 .5 5 2 1-1.5 3-2.84 5-2 2.4 1 3.1 4.03 1.33 6.39C18.7 16.65 12 21 12 21z"
            fill="#EE5A6E"
          />
        </g>

        {/* flower badge (left sleeve) */}
        <g transform="translate(52 112)">
          <circle cx="0" cy="0" r="7" fill="#EE5A6E" />
          <circle cx="0" cy="0" r="3" fill="#F7B32B" />
        </g>

        {/* celebrate sparkles */}
        {cheer && (
          <g fill="#FFD66B">
            <path className="m-spark" d="M150 40 l2.4 5.4 5.4 2.4 -5.4 2.4 -2.4 5.4 -2.4 -5.4 -5.4 -2.4 5.4 -2.4 z" />
            <path className="m-spark" style={{ animationDelay: ".4s" }} d="M30 60 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2 z" />
            <circle className="m-spark" cx="128" cy="24" r="3" style={{ animationDelay: ".2s" }} />
            <circle className="m-spark" cx="48" cy="28" r="2.4" style={{ animationDelay: ".6s" }} />
          </g>
        )}

        {/* comfort hover sparkle (gentle, reassuring) */}
        {comfort && (
          <circle className="m-comfort-glow" cx="132" cy="46" r="3" fill="#7DD3E8" />
        )}
      </svg>
    </span>
  );
}
