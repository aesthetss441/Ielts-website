import React, { useEffect, useRef, useState } from 'react';

export type RedPenType =
  | 'underline'
  | 'double-underline'
  | 'wavy'
  | 'circle'
  | 'strike'
  | 'arrow'
  | 'divider'
  | 'bracket'
  | 'check';

interface RedPenProps {
  type: RedPenType;
  seed?: number;
  children?: React.ReactNode;
  className?: string;
  svgClassName?: string;
  /** Optional delay in ms before drawing after entering view (e.g., after 27/40 count-up) */
  delayMs?: number;
  /** If true, draws on hover (used for button hover underlines) */
  drawOnHover?: boolean;
  /** If true, forces draw state from parent */
  active?: boolean;
}

/**
 * Slightly different imperfect hand-drawn SVG paths per seed so no two marks look identical.
 */
const UNDERLINE_PATHS = [
  'M 3 13.5 C 74 6.2, 168 4.5, 316 10.2 C 232 12.1, 114 14.3, 19 15.6',
  'M 2 11.8 C 88 15.1, 205 6.4, 318 8.9 C 245 10.8, 95 11.9, 11 14.2',
  'M 4 14.2 C 62 7.8, 184 5.9, 315 11.4',
  'M 3 10.5 C 94 14.6, 212 7.2, 317 12.1',
];

const DOUBLE_UNDERLINE_PATHS = [
  'M 3 10.5 C 95 6.2, 205 5.8, 317 9.4 M 12 15.8 C 110 13.2, 218 12.4, 312 14.9',
  'M 2 9.8 C 84 12.4, 196 6.8, 318 8.9 M 8 15.4 C 104 16.8, 220 12.1, 314 14.2',
];

const WAVY_PATHS = [
  'M 2 11 Q 22 4, 42 11 T 82 11 T 122 11 T 162 11 T 202 11 T 242 11 T 282 11 T 318 11',
  'M 2 12 Q 20 5, 39 12 T 78 11 T 118 12 T 158 10 T 198 12 T 238 11 T 278 12 T 318 10',
  'M 3 10 Q 24 16, 45 10 T 88 11 T 130 10 T 172 12 T 214 10 T 256 11 T 298 10 T 317 11',
];

const CIRCLE_PATHS = [
  'M 96 14 C 68 3, 14 7, 8 36 C 2 62, 38 73, 80 67 C 111 62, 118 35, 97 19 C 83 8, 52 9, 36 18',
  'M 24 15 C 62 4, 112 11, 114 38 C 116 64, 72 73, 30 66 C 4 60, 3 32, 23 18 C 39 8, 76 9, 95 21',
  'M 88 12 C 52 4, 10 12, 7 39 C 5 64, 46 72, 86 65 C 115 59, 116 31, 92 16 C 74 6, 44 11, 29 20',
];

const STRIKE_PATHS = [
  'M 2 14 C 48 9, 112 7, 198 5 M 8 17 C 66 13, 134 10, 194 9',
  'M 3 15 C 58 10, 128 8, 197 6',
  'M 2 12 C 64 11, 132 8, 198 7 M 12 16 C 78 13, 142 11, 192 9',
];

const ARROW_PATHS = [
  'M 4 9 C 24 6, 44 15, 55 34 M 55 34 L 43 31 M 55 34 L 58 22',
  'M 5 12 C 22 4, 45 13, 56 32 M 56 32 L 44 30 M 56 32 L 57 20',
  'M 3 7 C 26 9, 41 18, 53 35 M 53 35 L 41 32 M 53 35 L 56 23',
];

const DIVIDER_PATHS = [
  'M 2 12 C 140 5, 290 19, 440 10 C 590 3, 750 18, 910 9 C 1040 4, 1130 15, 1198 10',
  'M 2 10 C 165 17, 320 4, 490 12 C 650 19, 810 5, 970 11 C 1080 15, 1145 7, 1198 11',
];

const BRACKET_PATHS = [
  'M 9 3 C 3 3, 3 5, 3 15 C 3 25, 3 27, 9 27 M 111 3 C 117 3, 117 5, 117 15 C 117 25, 117 27, 111 27',
  'M 8 2 C 2 4, 3 8, 3 15 C 3 22, 2 26, 8 28 M 112 2 C 118 4, 117 8, 117 15 C 117 22, 118 26, 112 28',
];

const CHECK_PATHS = [
  'M 3 13 C 6 15, 8 18, 10 20 C 14 12, 19 6, 25 2',
  'M 2 12 C 5 14, 8 17, 10 19 C 14 11, 18 6, 24 3',
];

export function RedPen({
  type,
  seed = 0,
  children,
  className = '',
  svgClassName = '',
  delayMs = 0,
  drawOnHover = false,
  active,
}: RedPenProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (drawOnHover) return;
    if (typeof active === 'boolean') {
      setInView(active);
      return;
    }

    const node = ref.current;
    if (!node) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delayMs > 0) {
              timer = setTimeout(() => setInView(true), delayMs);
            } else {
              setInView(true);
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [delayMs, drawOnHover, active]);

  const isDrawn = typeof active === 'boolean' ? active : inView;

  if (type === 'divider') {
    const path = DIVIDER_PATHS[Math.abs(seed) % DIVIDER_PATHS.length];
    return (
      <span
        ref={ref}
        className={`block w-full overflow-hidden pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1200 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-3.5 text-examiner-red ${svgClassName}`}
          preserveAspectRatio="none"
        >
          <path
            d={path}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            pathLength={1}
            className={`red-pen-stroke ${isDrawn ? 'is-drawn' : ''}`}
          />
        </svg>
      </span>
    );
  }

  if (type === 'check') {
    const path = CHECK_PATHS[Math.abs(seed) % CHECK_PATHS.length];
    return (
      <span
        ref={ref}
        className={`inline-flex items-center justify-center pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 28 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`text-examiner-red overflow-visible ${svgClassName || 'w-3.5 h-3.5'}`}
        >
          <path
            d={path}
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            className={`red-pen-stroke ${isDrawn ? 'is-drawn' : ''}`}
          />
        </svg>
      </span>
    );
  }

  if (type === 'arrow') {
    const path = ARROW_PATHS[Math.abs(seed) % ARROW_PATHS.length];
    return (
      <span
        ref={ref}
        className={`inline-block pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 64 42"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`text-examiner-red overflow-visible ${svgClassName || 'w-11 h-7'}`}
        >
          <path
            d={path}
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            className={`red-pen-stroke ${isDrawn ? 'is-drawn' : ''}`}
          />
        </svg>
      </span>
    );
  }

  if (type === 'bracket') {
    const path = BRACKET_PATHS[Math.abs(seed) % BRACKET_PATHS.length];
    return (
      <span ref={ref} className={`relative inline-block ${className}`}>
        {children}
        <svg
          viewBox="0 0 120 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`absolute -inset-x-1.5 -inset-y-0.5 w-[calc(100%+0.75rem)] h-[calc(100%+0.25rem)] text-examiner-red pointer-events-none select-none overflow-visible ${svgClassName}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={path}
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            pathLength={1}
            className={`red-pen-stroke ${isDrawn ? 'is-drawn' : ''}`}
          />
        </svg>
      </span>
    );
  }

  if (type === 'circle') {
    const path = CIRCLE_PATHS[Math.abs(seed) % CIRCLE_PATHS.length];
    return (
      <span ref={ref} className={`relative inline-block ${className}`}>
        {children}
        <svg
          viewBox="0 0 120 76"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`absolute -inset-x-2.5 -inset-y-1.5 w-[calc(100%+1.25rem)] h-[calc(100%+0.75rem)] text-examiner-red pointer-events-none select-none overflow-visible ${svgClassName}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={path}
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            pathLength={1}
            className={`red-pen-stroke ${isDrawn ? 'is-drawn' : ''}`}
          />
        </svg>
      </span>
    );
  }

  if (type === 'strike') {
    const path = STRIKE_PATHS[Math.abs(seed) % STRIKE_PATHS.length];
    return (
      <span ref={ref} className={`relative inline-block ${className}`}>
        {children}
        <svg
          viewBox="0 0 200 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`absolute inset-x-[-4%] top-1/2 -translate-y-1/2 w-[108%] h-4 text-examiner-red pointer-events-none select-none overflow-visible ${svgClassName}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={path}
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            pathLength={1}
            className={`red-pen-stroke ${isDrawn ? 'is-drawn' : ''}`}
          />
        </svg>
      </span>
    );
  }

  const isWavy = type === 'wavy';
  const isDouble = type === 'double-underline';
  const pathList = isWavy
    ? WAVY_PATHS
    : isDouble
    ? DOUBLE_UNDERLINE_PATHS
    : UNDERLINE_PATHS;
  const path = pathList[Math.abs(seed) % pathList.length];

  return (
    <span
      ref={ref}
      className={`relative inline-block ${drawOnHover ? 'group/pen' : ''} ${className}`}
    >
      {children}
      <svg
        viewBox="0 0 320 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`absolute -bottom-1.5 left-0 w-full h-3.5 text-examiner-red pointer-events-none select-none overflow-visible ${svgClassName}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={path}
          stroke="currentColor"
          strokeWidth={isWavy ? '2.1' : isDouble ? '2.0' : '2.4'}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className={
            drawOnHover
              ? 'red-pen-hover-stroke'
              : `red-pen-stroke ${isDrawn ? 'is-drawn' : ''}`
          }
        />
      </svg>
    </span>
  );
}
