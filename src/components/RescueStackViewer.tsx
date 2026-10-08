import React, { useEffect, useRef, useState } from 'react';
import { RESCUE_PAGES, PdfPageArtwork } from './RescuePages';
import { RedPen } from './RedPen';

export function RescueStackViewer() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [zoomed, setZoomed] = useState<boolean>(false);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const currentPage = RESCUE_PAGES[activeIndex] || RESCUE_PAGES[0];

  const openViewerAt = (index: number) => {
    setActiveIndex(index);
    setZoomed(false);
    setLightboxOpen(true);
  };

  const closeViewer = () => {
    setLightboxOpen(false);
    setZoomed(false);
  };

  const goPrev = () => {
    setZoomed(false);
    setActiveIndex((prev) => (prev - 1 + RESCUE_PAGES.length) % RESCUE_PAGES.length);
  };

  const goNext = () => {
    setZoomed(false);
    setActiveIndex((prev) => (prev + 1) % RESCUE_PAGES.length);
  };

  // Keyboard navigation in full-screen viewer (Left/Right arrows, Esc to close)
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeViewer();
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // Subtle pointer-tilt on desktop via direct DOM transform (zero React re-renders on mousemove)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const node = stackRef.current;
    if (!node) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const rect = node.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rx = (-y * 2.8).toFixed(2);
    const ry = (x * 3.2).toFixed(2);
    node.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  const handleMouseLeave = () => {
    if (stackRef.current) {
      stackRef.current.style.transform = '';
    }
    setHoveredIndex(null);
  };

  // Fan geometries for the 4 overlapping pages
  const cardTransforms = [
    { rotate: -3.2, tx: -6, ty: -4 },
    { rotate: 2.1, tx: 6, ty: 8 },
    { rotate: -1.8, tx: -4, ty: 4 },
    { rotate: 2.8, tx: 5, ty: 10 },
  ];

  return (
    <div className="mt-8">
      {/* Top Annotation Bar with Red-Pen "start here" callout */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center gap-2 font-mono text-[11px] text-ink-muted">
          <span>PDF SPECIMEN · 38 PAGES</span>
          <span aria-hidden="true">·</span>
          <span>Click any page to inspect full-screen</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs text-examiner-red">
          <RedPen type="circle" seed={1} className="px-1.5 py-0.5 font-medium">
            start here → Page 6
          </RedPen>
        </div>
      </div>

      {/* Interactive Fanned Stack Container with subtle pointer tilt */}
      <div
        ref={stackRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative bg-ivory/75 border border-rule p-4 sm:p-6 transition-transform duration-200 ease-out"
      >
        {/* Red-pen margin annotation pointing to the Diagnostic page */}
        <div className="hidden sm:flex items-center gap-1.5 absolute -top-3.5 left-6 z-30 bg-paper px-2.5 py-0.5 border border-rule font-mono text-[11px] text-examiner-red">
          <span>Examiner note: start with the 10-min diagnostic</span>
          <RedPen type="arrow" seed={0} svgClassName="w-6 h-4" />
        </div>

        {/* 2x2 Fanned Overlapping Stack */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4 pt-2">
          {RESCUE_PAGES.map((page, idx) => {
            const isLifted = hoveredIndex === idx;
            const geo = cardTransforms[idx % cardTransforms.length];

            return (
              <div
                key={page.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onFocus={() => setHoveredIndex(idx)}
                style={{
                  transform: isLifted
                    ? 'translateY(-8px) rotate(0deg) scale(1.02)'
                    : `translate(${geo.tx}px, ${geo.ty}px) rotate(${geo.rotate}deg)`,
                  zIndex: isLifted ? 30 : 10 + idx,
                }}
                className="group relative bg-surface-elevated border border-rule-strong shadow-xs transition-all duration-200 ease-out"
              >
                {/* Red-pen circle annotation on Page 6 Diagnostic */}
                {page.pageNumber === 6 && (
                  <div className="absolute -top-2.5 right-3 z-30 bg-paper px-2 py-0.5 border border-examiner-red/50 font-mono text-[10px] text-examiner-red">
                    <RedPen type="underline" seed={2}>
                      Page 6 · Start here
                    </RedPen>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => openViewerAt(idx)}
                  aria-label={`Open ${page.caption} (Page ${page.pageNumber} of ${page.totalPages}) in full-screen viewer`}
                  className="w-full text-left block cursor-pointer focus-visible:outline-2 focus-visible:outline-violet-pen"
                >
                  <PdfPageArtwork pageIndex={idx} />

                  {/* Mono Caption Footer for Each Page */}
                  <div className="px-3 py-2 bg-surface-elevated border-t border-rule flex items-center justify-between gap-2 font-mono text-[11px]">
                    <span className="text-ink font-medium truncate">{page.caption}</span>
                    <span className="text-ink-subtle tabular-nums shrink-0">
                      P. {page.pageNumber}/38 ↗
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-Screen Modal Viewer with Zoom, Left/Right Arrows, Mobile Swipe, Keyboard Esc/Arrows, and "Page X of 38" Counter */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Score Rescue PDF preview — Page ${currentPage.pageNumber} of ${currentPage.totalPages}`}
          className="fixed inset-0 z-50 bg-ink/90 flex flex-col justify-between p-3 sm:p-6"
          onClick={closeViewer}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const deltaX = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
            if (deltaX > 45) goPrev();
            if (deltaX < -45) goNext();
            touchStartX.current = null;
          }}
        >
          {/* Top Bar */}
          <div
            className="max-w-4xl w-full mx-auto flex items-center justify-between gap-3 bg-paper text-ink px-4 py-2.5 border border-rule"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 font-mono text-xs tabular-nums">
              <span className="font-medium">
                Page {currentPage.pageNumber} of {currentPage.totalPages}
              </span>
              <span className="text-ink-subtle" aria-hidden="true">·</span>
              <span className="text-ink-muted truncate">{currentPage.caption}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                className="min-h-[38px] px-3 py-1 border border-rule text-xs font-mono text-ink hover:bg-ivory cursor-pointer"
              >
                {zoomed ? 'Zoom 100%' : 'Zoom 135%'}
              </button>
              <button
                type="button"
                onClick={closeViewer}
                aria-label="Close full-screen preview (Esc)"
                className="min-h-[38px] px-3 py-1 bg-ink text-paper text-xs font-mono hover:bg-violet-pen hover:text-white cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
          </div>

          {/* Center Artwork Stage */}
          <div
            className="flex-1 flex items-center justify-center overflow-auto my-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 sm:gap-6 max-w-4xl w-full justify-center">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous preview page"
                className="min-h-[44px] min-w-[44px] px-3 py-2 bg-paper text-ink border border-rule font-mono text-sm hover:bg-ivory cursor-pointer shrink-0"
              >
                ←
              </button>

              <div
                className={`w-full max-w-xl border border-rule shadow-lg transition-transform duration-200 ${
                  zoomed ? 'scale-125 sm:scale-135 my-12' : 'scale-100'
                }`}
              >
                <PdfPageArtwork pageIndex={activeIndex} />
              </div>

              <button
                type="button"
                onClick={goNext}
                aria-label="Next preview page"
                className="min-h-[44px] min-w-[44px] px-3 py-2 bg-paper text-ink border border-rule font-mono text-sm hover:bg-ivory cursor-pointer shrink-0"
              >
                →
              </button>
            </div>
          </div>

          {/* Bottom Page Selector Strip */}
          <div
            className="max-w-4xl w-full mx-auto flex flex-wrap items-center justify-between gap-2 bg-paper text-ink px-4 py-2.5 border border-rule font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {RESCUE_PAGES.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setZoomed(false);
                    setActiveIndex(i);
                  }}
                  className={`px-2.5 py-1 border cursor-pointer transition-colors ${
                    activeIndex === i
                      ? 'bg-ink text-paper border-ink font-medium'
                      : 'bg-ivory text-ink-muted border-rule hover:text-ink'
                  }`}
                >
                  P.{p.pageNumber} · {p.caption}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-ink-subtle hidden sm:inline">
              Use ← / → keys or swipe
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
