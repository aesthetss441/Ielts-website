import React, { useEffect, useRef, useState } from 'react';
import { INSTRUCTOR_PORTRAIT_DATA_URI } from '../portraitData';
import { RedPen } from './RedPen';

// Pre-decode portrait in memory at module evaluation time so first paint is 0ms
if (typeof window !== 'undefined') {
  const preloadImg = new Image();
  preloadImg.decoding = 'sync';
  preloadImg.src = INSTRUCTOR_PORTRAIT_DATA_URI;
}

/**
 * Custom thin-stroke (1.5px) icon set for IELTS DECODED
 */
export function IconArrowUpRight({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function IconArrowDown({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M18 13l-6 6-6-6" />
    </svg>
  );
}

export function IconPlusMinus({ open, className = 'w-4 h-4' }: { open: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14" />
      <path
        d="M12 5v14"
        className={`origin-center transition-transform duration-200 ${open ? 'scale-y-0 opacity-0' : 'scale-y-100 opacity-100'}`}
      />
    </svg>
  );
}

export function IconMenu({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 8h16" />
      <path d="M4 16h16" />
    </svg>
  );
}

export function IconClose({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function IconSunMoon({ isDark, className = 'w-4 h-4' }: { isDark: boolean; className?: string }) {
  return isDark ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function IconWhatsApp({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

export function IconFacebook({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

/**
 * Count-up 27/40 hook component that counts from 0 to 27 on scroll into view,
 * and signals completion so the red circle draws around 13 right after.
 */
export function ScoreCountUp({ onComplete }: { onComplete?: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [count, setCount] = useState(27);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(27);
      onComplete?.();
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            setCount(0);
            const duration = 680;
            const startTime = performance.now();

            const step = (now: number) => {
              const progress = Math.min(1, (now - startTime) / duration);
              const eased = 1 - Math.pow(1 - progress, 3);
              setCount(Math.round(eased * 27));
              if (progress < 1) {
                requestAnimationFrame(step);
              } else {
                setCount(27);
                onComplete?.();
              }
            };

            requestAnimationFrame(step);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onComplete]);

  return (
    <div ref={ref} className="font-serif text-display-numeral text-ink tabular-nums">
      {count}
      <span className="text-ink-subtle font-light">/40</span>
    </div>
  );
}

/**
 * Mistake DNA Strip: 40 tiny question marks colour-coded K / S / C (plus Correct)
 * Hovering or tapping a question shows a small tooltip (K, S or C), labelled "Illustrative sample".
 */
type MarkStatus = 'OK' | 'K' | 'S' | 'C';

interface QuestionSlot {
  q: number;
  status: MarkStatus;
  section: string;
  note: string;
}

const SAMPLE_40_QUESTIONS: QuestionSlot[] = [
  { q: 1, status: 'OK', section: 'Passage 1 · Gap Fill', note: 'Correct' },
  { q: 2, status: 'OK', section: 'Passage 1 · Gap Fill', note: 'Correct' },
  { q: 3, status: 'OK', section: 'Passage 1 · Gap Fill', note: 'Correct' },
  { q: 4, status: 'C', section: 'Passage 1 · Gap Fill', note: 'Careless: wrote plural instead of singular noun' },
  { q: 5, status: 'OK', section: 'Passage 1 · Gap Fill', note: 'Correct' },
  { q: 6, status: 'OK', section: 'Passage 1 · True/False/NG', note: 'Correct' },
  { q: 7, status: 'S', section: 'Passage 1 · True/False/NG', note: 'Strategy: confused FALSE with NOT GIVEN' },
  { q: 8, status: 'OK', section: 'Passage 1 · True/False/NG', note: 'Correct' },
  { q: 9, status: 'OK', section: 'Passage 1 · True/False/NG', note: 'Correct' },
  { q: 10, status: 'C', section: 'Passage 1 · True/False/NG', note: 'Careless: misread qualifying adverb "rarely"' },
  { q: 11, status: 'OK', section: 'Passage 1 · Short Answer', note: 'Correct' },
  { q: 12, status: 'OK', section: 'Passage 1 · Short Answer', note: 'Correct' },
  { q: 13, status: 'OK', section: 'Passage 1 · Short Answer', note: 'Correct' },
  { q: 14, status: 'S', section: 'Passage 2 · Matching Headings', note: 'Strategy: matched keyword in first sentence instead of paragraph main idea' },
  { q: 15, status: 'S', section: 'Passage 2 · Matching Headings', note: 'Strategy: fell for distractor example in middle of paragraph' },
  { q: 16, status: 'OK', section: 'Passage 2 · Matching Headings', note: 'Correct' },
  { q: 17, status: 'S', section: 'Passage 2 · Matching Headings', note: 'Strategy: read whole passage linearly before checking heading differences' },
  { q: 18, status: 'OK', section: 'Passage 2 · Matching Headings', note: 'Correct' },
  { q: 19, status: 'K', section: 'Passage 2 · Matching Headings', note: 'Knowledge: missed C1 synonym pair ("oscillation" / "fluctuation")' },
  { q: 20, status: 'OK', section: 'Passage 2 · Matching Claims', note: 'Correct' },
  { q: 21, status: 'OK', section: 'Passage 2 · Matching Claims', note: 'Correct' },
  { q: 22, status: 'C', section: 'Passage 2 · Matching Claims', note: 'Careless: copied wrong letter onto answer sheet' },
  { q: 23, status: 'OK', section: 'Passage 2 · Summary', note: 'Correct' },
  { q: 24, status: 'OK', section: 'Passage 2 · Summary', note: 'Correct' },
  { q: 25, status: 'K', section: 'Passage 2 · Summary', note: 'Knowledge: unfamiliar with academic collocation' },
  { q: 26, status: 'OK', section: 'Passage 2 · Summary', note: 'Correct' },
  { q: 27, status: 'OK', section: 'Passage 3 · Multiple Choice', note: 'Correct' },
  { q: 28, status: 'S', section: 'Passage 3 · Multiple Choice', note: 'Strategy: did not eliminate two opposite options first' },
  { q: 29, status: 'OK', section: 'Passage 3 · Multiple Choice', note: 'Correct' },
  { q: 30, status: 'K', section: 'Passage 3 · Multiple Choice', note: 'Knowledge: complex concessive clause ("albeit") misunderstood' },
  { q: 31, status: 'OK', section: 'Passage 3 · Yes/No/NG', note: 'Correct' },
  { q: 32, status: 'S', section: 'Passage 3 · Yes/No/NG', note: 'Strategy: over-inferred author opinion beyond stated text' },
  { q: 33, status: 'OK', section: 'Passage 3 · Yes/No/NG', note: 'Correct' },
  { q: 34, status: 'OK', section: 'Passage 3 · Yes/No/NG', note: 'Correct' },
  { q: 35, status: 'K', section: 'Passage 3 · Summary Box', note: 'Knowledge: grammatical word class mismatch in summary bank' },
  { q: 36, status: 'OK', section: 'Passage 3 · Summary Box', note: 'Correct' },
  { q: 37, status: 'OK', section: 'Passage 3 · Summary Box', note: 'Correct' },
  { q: 38, status: 'S', section: 'Passage 3 · Summary Box', note: 'Strategy: ran out of time in final 4 minutes' },
  { q: 39, status: 'C', section: 'Passage 3 · Summary Box', note: 'Careless: rushed final question without checking paragraph G' },
  { q: 40, status: 'OK', section: 'Passage 3 · Summary Box', note: 'Correct' },
];

export function MistakeDNAStrip({ darkSurface = false }: { darkSurface?: boolean }) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'K' | 'S' | 'C'>('ALL');
  const [selectedQ, setSelectedQ] = useState<QuestionSlot>(SAMPLE_40_QUESTIONS[13]);
  const [tooltipQ, setTooltipQ] = useState<number | null>(14);

  return (
    <div className={`py-6 border-t ${darkSurface ? 'border-paper/15' : 'border-rule'}`}>
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`font-mono text-[11px] uppercase tracking-wider ${darkSurface ? 'text-paper/70' : 'text-ink-muted'}`}>
              Mistake DNA Strip (Q1–Q40)
            </span>
            <span className={darkSurface ? 'text-paper/40' : 'text-ink-subtle'} aria-hidden="true">·</span>
            <span className={`font-mono text-[11px] ${darkSurface ? 'text-paper/60' : 'text-ink-subtle'}`}>
              Illustrative sample
            </span>
          </div>
          <p className={`text-sm mt-1 ${darkSurface ? 'text-paper/80' : 'text-ink-muted'}`}>
            27/40 raw score broken down into 13 specific missed marks: <strong>Knowledge (K)</strong>, <strong>Strategy (S)</strong>, and{' '}
            <RedPen type="underline" seed={3}>
              <strong>Careless (C)</strong>
            </RedPen>
            .
          </p>
        </div>

        {/* Interactive Filter Controls */}
        <div className={`flex items-center gap-1 p-1 rounded-xs self-start border ${darkSurface ? 'bg-paper/5 border-paper/15' : 'bg-ivory border-rule'}`}>
          {(
            [
              { id: 'ALL', label: 'All 40' },
              { id: 'S', label: 'S · Strategy (6)' },
              { id: 'K', label: 'K · Knowledge (4)' },
              { id: 'C', label: 'C · Careless (3)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1.5 text-[11px] font-mono transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? darkSurface
                    ? 'bg-paper text-ink font-medium'
                    : 'bg-surface-elevated text-ink font-medium border border-rule'
                  : darkSurface
                  ? 'text-paper/70 hover:text-paper'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 40 Tiny Question Marks Strip with Hover/Tap Tooltips */}
      <div
        className="grid grid-cols-10 sm:grid-cols-20 lg:grid-cols-40 gap-1.5 relative"
        role="list"
        aria-label="40 question diagnostic breakdown (Illustrative sample)"
      >
        {SAMPLE_40_QUESTIONS.map((item) => {
          const isDimmed = activeFilter !== 'ALL' && item.status !== activeFilter;
          const isSelected = selectedQ.q === item.q;
          const showTooltip = tooltipQ === item.q;

          let cellStyle = darkSurface
            ? 'border-paper/15 bg-paper/5 text-paper/45'
            : 'border-rule bg-ivory/60 text-ink-subtle';

          if (item.status === 'S') {
            cellStyle = 'border-examiner-red/70 bg-examiner-red/15 text-examiner-red font-medium';
          } else if (item.status === 'K') {
            cellStyle = 'border-violet-pen/70 bg-violet-pen/20 text-violet-pen font-medium';
          } else if (item.status === 'C') {
            cellStyle = darkSurface
              ? 'border-paper/60 bg-paper/20 text-paper font-medium'
              : 'border-ink/40 bg-ink/8 text-ink font-medium';
          }

          return (
            <div key={item.q} className="relative" role="listitem">
              <button
                type="button"
                onClick={() => {
                  setSelectedQ(item);
                  setTooltipQ(item.q);
                }}
                onMouseEnter={() => {
                  setSelectedQ(item);
                  setTooltipQ(item.q);
                }}
                onMouseLeave={() => setTooltipQ(null)}
                onFocus={() => {
                  setSelectedQ(item);
                  setTooltipQ(item.q);
                }}
                onBlur={() => setTooltipQ(null)}
                aria-label={`Question ${item.q}: ${item.status === 'OK' ? 'Correct' : `Missed (${item.status})`} - ${item.note}`}
                className={`w-full flex flex-col items-center justify-center py-2 px-0.5 border rounded-xs font-mono tabular-nums transition-opacity duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-violet-pen ${cellStyle} ${
                  isDimmed ? 'opacity-25' : 'opacity-100'
                } ${isSelected ? (darkSurface ? 'ring-1 ring-paper' : 'ring-1 ring-ink') : ''}`}
              >
                <span className="text-[9px] leading-none opacity-75">{item.q}</span>
                <span className="text-[11px] leading-tight mt-1">
                  {item.status === 'OK' ? '·' : `?${item.status}`}
                </span>
              </button>

              {/* Floating Tooltip on Hover/Tap */}
              {showTooltip && (
                <div
                  role="tooltip"
                  className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-56 p-2.5 bg-paper text-ink border border-rule-strong shadow-md font-mono text-[10px] leading-snug pointer-events-none"
                >
                  <div className="flex items-center justify-between border-b border-rule pb-1 mb-1">
                    <span className="font-semibold">
                      Q{item.q} · {item.status === 'OK' ? 'Correct' : `Type ${item.status}`}
                    </span>
                    <span className="text-ink-subtle">Illustrative sample</span>
                  </div>
                  <p className="text-ink-muted">{item.note}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Question Inspector Bar */}
      <div className={`mt-4 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono ${darkSurface ? 'border-paper/15' : 'border-rule/60'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">Q{selectedQ.q}</span>
          <span className="opacity-50" aria-hidden="true">·</span>
          <span className="opacity-80">{selectedQ.section}</span>
          <span className="opacity-50" aria-hidden="true">·</span>
          <span
            className={
              selectedQ.status === 'S'
                ? 'text-examiner-red font-medium'
                : selectedQ.status === 'K'
                ? 'text-violet-pen font-medium'
                : 'font-medium'
            }
          >
            {selectedQ.note}
          </span>
        </div>
        <span className="text-[11px] opacity-60">Hover or tap any question (1–40) · Illustrative sample</span>
      </div>
    </div>
  );
}

/**
 * Interactive Draggable Horizontal Band Ruler (6.0 → 8.0)
 */
const BAND_STEPS = [
  { band: 6.5, pct: 25, rawMarksNeeded: '+0.0 Band (Current baseline)' },
  { band: 7.0, pct: 50, rawMarksNeeded: 'Gap: +0.5 Band (3–4 raw marks in Reading/Listening)' },
  { band: 7.5, pct: 75, rawMarksNeeded: 'Gap: +1.0 Band (6–7 raw marks in Reading/Listening)' },
  { band: 8.0, pct: 100, rawMarksNeeded: 'Gap: +1.5 Bands (9–10 raw marks in Reading/Listening)' },
];

export function BandRuler({ darkSurface = false }: { darkSurface?: boolean }) {
  const [targetBand, setTargetBand] = useState<number>(7.5);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef<boolean>(false);

  const ticks = [6.0, 6.5, 7.0, 7.5, 8.0];
  const currentBand = 6.5;
  const currentPct = ((currentBand - 6.0) / 2.0) * 100; // 25%
  const targetPct = ((targetBand - 6.0) / 2.0) * 100;
  const gapBands = (targetBand - currentBand).toFixed(1);

  const activeStepInfo =
    BAND_STEPS.find((s) => s.band === targetBand) || BAND_STEPS[2];

  const updateFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawBand = 6.0 + ratio * 2.0;
    const snapped = Math.max(6.5, Math.min(8.0, Math.round(rawBand * 2) / 2));
    setTargetBand(snapped);
  };

  return (
    <div className={`py-6 border-t ${darkSurface ? 'border-paper/15' : 'border-rule'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-[11px] uppercase tracking-wider ${darkSurface ? 'text-paper/70' : 'text-ink-muted'}`}>
            Interactive Band Ruler (6.0 → 8.0)
          </span>
          <span className={darkSurface ? 'text-paper/40' : 'text-ink-subtle'} aria-hidden="true">·</span>
          <span className={`font-mono text-[11px] ${darkSurface ? 'text-paper/60' : 'text-ink-subtle'}`}>
            Illustrative sample · Drag target marker
          </span>
        </div>
        <span className="font-mono text-xs text-examiner-red tabular-nums">
          <RedPen type="underline" seed={1}>
            {activeStepInfo.rawMarksNeeded}
          </RedPen>
        </span>
      </div>

      <div
        className={`relative pt-10 pb-6 px-4 sm:px-8 border select-none ${
          darkSurface ? 'bg-paper/5 border-paper/15' : 'bg-ivory/60 border-rule'
        }`}
      >
        {/* Top Annotations: YOU (6.5) -> GAP -> DRAGGABLE TARGET */}
        <div className="relative h-9 mb-2">
          {/* "You (6.5)" Marker at 25% */}
          <div
            style={{ left: `${currentPct}%` }}
            className="absolute -translate-x-1/2 top-0 flex flex-col items-center"
          >
            <span className="font-mono text-xs font-medium whitespace-nowrap">
              You (6.5)
            </span>
            <span className={`w-px h-3 mt-1 ${darkSurface ? 'bg-paper' : 'bg-ink'}`} />
          </div>

          {/* Dynamic "Gap" Bracket between currentPct and targetPct */}
          {targetBand > currentBand && (
            <div
              style={{
                left: `${currentPct}%`,
                width: `${targetPct - currentPct}%`,
              }}
              className="absolute top-3 flex flex-col items-center pointer-events-none"
            >
              <div className="w-full border-t border-dashed border-examiner-red relative flex justify-center">
                <span
                  className={`px-2 -mt-2.5 font-mono text-[10px] sm:text-[11px] text-examiner-red font-medium whitespace-nowrap ${
                    darkSurface ? 'bg-ink' : 'bg-ivory'
                  }`}
                >
                  Gap: +{gapBands}
                </span>
              </div>
            </div>
          )}

          {/* Draggable Target Marker */}
          <div
            style={{ left: `${targetPct}%` }}
            className="absolute -translate-x-1/2 -top-1 flex flex-col items-center z-20"
          >
            <span className="px-2 py-0.5 bg-violet-pen text-white font-mono text-xs font-medium whitespace-nowrap shadow-2xs">
              Target ({targetBand.toFixed(1)}) ↔
            </span>
            <span className="w-0.5 h-3.5 bg-violet-pen mt-0.5" />
          </div>
        </div>

        {/* Interactive Horizontal Scale Track */}
        <div
          ref={trackRef}
          onPointerDown={(e) => {
            isDragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            updateFromClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (!isDragging.current) return;
            updateFromClientX(e.clientX);
          }}
          onPointerUp={() => {
            isDragging.current = false;
          }}
          className={`relative h-3 border cursor-ew-resize touch-none ${
            darkSurface ? 'bg-ink border-paper/25' : 'bg-paper border-rule'
          }`}
          role="slider"
          aria-label="Drag target IELTS band score"
          aria-valuemin={6.5}
          aria-valuemax={8.0}
          aria-valuenow={targetBand}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              e.preventDefault();
              setTargetBand((b) => Math.min(8.0, Number((b + 0.5).toFixed(1))));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault();
              setTargetBand((b) => Math.max(6.5, Number((b - 0.5).toFixed(1))));
            }
          }}
        >
          {/* Highlighted Gap Fill */}
          <div
            style={{
              left: `${currentPct}%`,
              width: `${Math.max(0, targetPct - currentPct)}%`,
            }}
            className="absolute top-0 bottom-0 bg-violet-pen/30 border-x border-violet-pen transition-all duration-150"
            aria-hidden="true"
          />

          {/* Draggable Thumb Handle */}
          <div
            style={{ left: `${targetPct}%` }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-violet-pen border-2 border-paper rounded-full shadow-xs"
            aria-hidden="true"
          />
        </div>

        {/* Scale Ticks 6.0 -> 8.0 (Clickable) */}
        <div className="grid grid-cols-5 mt-2.5 font-mono text-xs tabular-nums">
          {ticks.map((band, idx) => {
            const alignClass =
              idx === 0
                ? 'text-left'
                : idx === ticks.length - 1
                ? 'text-right'
                : 'text-center';
            const isHighlighted = band === currentBand || band === targetBand;
            const canSelect = band >= 6.5;

            return (
              <div key={band} className={alignClass}>
                <button
                  type="button"
                  disabled={!canSelect}
                  onClick={() => canSelect && setTargetBand(band)}
                  className={`${
                    canSelect ? 'cursor-pointer hover:text-violet-pen' : 'opacity-50 cursor-default'
                  } ${
                    isHighlighted
                      ? 'font-semibold underline underline-offset-4'
                      : 'opacity-75'
                  }`}
                >
                  Band {band.toFixed(1)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Editorial Portrait Frame
 * Renders /1.png immediately on first paint with zero delay and no upload placeholder.
 */
export function FounderPortraitFrame({
  imageUrl,
  alt,
  aspectRatioClass = 'aspect-[4/5]',
  caption,
}: {
  imageUrl: string;
  alt: string;
  aspectRatioClass?: string;
  caption?: string;
}) {
  return (
    <figure className="w-full relative">
      {/* Subtle examiner red-pen annotation on top-right of frame */}
      <div className="hidden sm:flex items-center gap-1.5 absolute -top-3.5 right-4 z-30 bg-paper px-2.5 py-0.5 border border-rule font-mono text-[10px] text-examiner-red">
        <RedPen type="underline" seed={1}>
          Overall Band 8.0 · CLB 9
        </RedPen>
      </div>

      <div
        className={`relative w-full ${aspectRatioClass} bg-ivory border border-rule-strong overflow-hidden flex flex-col justify-between p-5 sm:p-6`}
      >
        {/* Top Corner Registration Marks */}
        <div className="flex items-center justify-between gap-2 text-ink-subtle font-mono text-[10px] z-20 bg-paper/90 px-2.5 py-1 border border-rule">
          <span>IELTS DECODED · INSTRUCTOR</span>
          <span>CLB 9 / BAND 8.0</span>
        </div>

        <img
          src={imageUrl || INSTRUCTOR_PORTRAIT_DATA_URI}
          alt={alt}
          width={889}
          height={1100}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />

        {/* Bottom Module Breakdown Rule inside Frame with Red-Pen Callout on 8.5s */}
        <div className="grid grid-cols-4 gap-2 pt-2.5 border-t border-rule text-left font-mono text-xs tabular-nums z-20 bg-paper/95 px-3 pb-2 border border-rule/70">
          <div>
            <span className="block text-[9px] text-ink-subtle">LISTENING</span>
            <RedPen type="underline" seed={0} className="font-semibold text-ink">
              8.5
            </RedPen>
          </div>
          <div>
            <span className="block text-[9px] text-ink-subtle">READING</span>
            <RedPen type="underline" seed={2} className="font-semibold text-ink">
              8.5
            </RedPen>
          </div>
          <div>
            <span className="block text-[9px] text-ink-subtle">WRITING</span>
            <span className="font-medium text-ink">7.0</span>
          </div>
          <div>
            <span className="block text-[9px] text-ink-subtle">SPEAKING</span>
            <span className="font-medium text-ink">7.0</span>
          </div>
        </div>
      </div>

      {caption && (
        <figcaption className="font-mono text-[11px] text-ink-muted mt-3 tabular-nums flex items-center justify-between gap-2">
          <span>{caption}</span>
          <RedPen type="bracket" seed={0} className="text-examiner-red text-[10px] px-1">
            My result
          </RedPen>
        </figcaption>
      )}
    </figure>
  );
}
