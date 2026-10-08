import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CANDIDATE_LOGO_PATHS = [
  '/final logo.png',
  '/final-logo.png',
  '/final_logo.png',
  '/logo.png',
];

/**
 * Official IELTS DECODED Brand Logo (`final logo.png`).
 * Directly renders `/final logo.png` from `/public` as soon as it is uploaded,
 * with a matching vector fallback of the exact ID emblem + IELTS DECODED lockup.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [useFallbackSvg, setUseFallbackSvg] = useState(false);

  const imgSizeClasses =
    size === 'sm'
      ? 'h-10 sm:h-11 w-auto'
      : size === 'lg'
        ? 'h-14 sm:h-16 w-auto'
        : 'h-11 sm:h-12 w-auto';

  return (
    <span className={`inline-flex items-center select-none shrink-0 ${className}`}>
      {!useFallbackSvg ? (
        <img
          src={CANDIDATE_LOGO_PATHS[candidateIdx]}
          alt="IELTS DECODED"
          decoding="async"
          onError={() => {
            if (candidateIdx + 1 < CANDIDATE_LOGO_PATHS.length) {
              setCandidateIdx((prev) => prev + 1);
            } else {
              setUseFallbackSvg(true);
            }
          }}
          className={`${imgSizeClasses} object-contain dark:invert`}
        />
      ) : (
        <span className="inline-flex items-center gap-2.5">
          {/* Exact ID Emblem Mark */}
          <svg
            viewBox="30 25 115 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={
              size === 'sm'
                ? 'h-7 w-auto'
                : size === 'lg'
                  ? 'h-10 w-auto'
                  : 'h-8 w-auto'
            }
          >
            <defs>
              <linearGradient
                id="id-logo-ribbon"
                x1="114"
                y1="48"
                x2="100"
                y2="108"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#9B7EDE" />
                <stop offset="50%" stopColor="#E2D6FC" />
                <stop offset="100%" stopColor="#8661D1" />
              </linearGradient>
            </defs>
            {/* Left "I" column with angled top */}
            <path d="M 66 45 L 89 30 V 96 H 66 Z" className="fill-ink" />
            {/* Right "D" shape */}
            <path
              d="M 97 52 L 112 48 L 131 57 C 136 60 138 65 138 72 C 138 89 125 99 97 108 Z"
              className="fill-ink"
            />
            {/* Lavender/purple wave ribbon */}
            <path
              d="M 112 48 L 131 57 C 132 68 128 74 121 82 C 113 90 105 98 97 108 C 101 93 104 82 110 73 C 117 64 119 56 112 48 Z"
              fill="url(#id-logo-ribbon)"
            />
          </svg>
          <span className="flex flex-col leading-none">
            <span className="font-sans font-extrabold text-sm sm:text-base tracking-[0.28em] text-ink">
              IELTS
            </span>
            <span className="font-sans font-normal text-[9px] sm:text-[10px] tracking-[0.34em] text-ink mt-0.5">
              DECODED
            </span>
          </span>
        </span>
      )}
    </span>
  );
};
