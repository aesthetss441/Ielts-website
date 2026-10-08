import React, { useEffect, useRef, useState } from 'react';
import {
  GuideData,
  GuideModuleId,
  GuidePageImage,
  getCandidateImageUrls,
} from '../guidesConfig';
import { RedPen } from './RedPen';

export interface ResolvedGuideImage extends GuidePageImage {
  resolvedUrl: string;
}

const resolvedCache: Record<string, ResolvedGuideImage[]> = {};

/**
 * Resolves guide screenshot images synchronously for all uploaded /public/*.webp files
 * so there are zero background network probes or state cascades during page load and scroll.
 */
export function useResolvedGuideImages(guide: GuideData): {
  images: ResolvedGuideImage[];
  checked: boolean;
} {
  const resolved = React.useMemo(() => {
    if (resolvedCache[guide.id]) {
      return resolvedCache[guide.id];
    }
    const list: ResolvedGuideImage[] = guide.images.map((img) => ({
      ...img,
      resolvedUrl: `/${img.fileSlug}`,
    }));
    resolvedCache[guide.id] = list;
    return list;
  }, [guide]);

  return { images: resolved, checked: true };
}

/**
 * Single A4-portrait Page Frame with:
 * - Natural A4 portrait aspect ratio (never cropped or stretched)
 * - 1px hairline border + soft paper-edge shadow + max 2px corner radius
 * - Small mono chip "SAMPLE · p.21" in corner
 * - draggable={false}, context menu disabled, no download/open links
 */
export function GuideSamplePageCard({
  image,
  eager = false,
  onClick,
  className = '',
  showCaptionBar = false,
}: {
  image: ResolvedGuideImage;
  eager?: boolean;
  onClick?: () => void;
  className?: string;
  showCaptionBar?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => e.preventDefault()}
      className={`group/page relative bg-white border border-rule-strong rounded-[2px] shadow-xs select-none overflow-hidden ${
        onClick ? 'cursor-zoom-in' : ''
      } ${className}`}
    >
      <div className="aspect-[210/297] w-full bg-white flex items-center justify-center relative overflow-hidden">
        <img
          src={image.resolvedUrl}
          srcSet={`${image.resolvedUrl} 400w, ${image.resolvedUrl} 1200w`}
          sizes="(max-width: 640px) 220px, 400px"
          alt={image.alt}
          width={840}
          height={1188}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full object-contain block pointer-events-none select-none"
        />

        {/* Small mono chip in top-right corner */}
        <span className="absolute top-2 right-2 z-10 bg-paper/95 text-ink font-mono text-[9px] tracking-tight px-1.5 py-0.5 border border-rule rounded-[2px] pointer-events-none">
          SAMPLE · p.{image.page}
        </span>
      </div>

      {showCaptionBar && (
        <div className="px-2.5 py-1.5 bg-paper border-t border-rule flex items-center justify-between gap-2 font-mono text-[10px] text-ink-muted">
          <span className="truncate">{image.caption}</span>
          <span className="text-ink-subtle shrink-0 tabular-nums">p.{image.page}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Fanned Stack for a Guide's Pages (up to 4 on landing page, up to 7 on /guides page)
 * - Respects prefers-reduced-motion (renders a plain horizontal strip when reduced motion is enabled)
 * - Hovering lifts a page above the others
 * - Includes optional red-pen annotation on the first page
 */
export function GuideFannedStack({
  guide,
  images,
  maxPages = 7,
  eagerFirst = false,
  onOpenLightbox,
}: {
  guide: GuideData;
  images: ResolvedGuideImage[];
  maxPages?: number;
  eagerFirst?: boolean;
  onOpenLightbox: (index: number) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number>(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const displayImages = images.slice(0, maxPages);
  if (displayImages.length === 0) return null;

  if (reducedMotion) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {displayImages.map((img, idx) => (
          <button
            key={img.fileSlug}
            type="button"
            onClick={() => onOpenLightbox(idx)}
            className="text-left focus-visible:outline-2 focus-visible:outline-violet-pen"
          >
            <GuideSamplePageCard
              image={img}
              eager={eagerFirst && idx === 0}
              showCaptionBar
            />
          </button>
        ))}
      </div>
    );
  }

  // Fan geometry for up to 7 pages
  const count = displayImages.length;

  return (
    <div className="relative w-full pt-6 pb-4">
      {/* Optional Red-Pen note on the first page of the stack */}
      {guide.redPenNote && (
        <div className="flex items-center gap-1.5 mb-3 font-mono text-[11px] text-examiner-red">
          <RedPen type="circle" seed={Number(guide.num)} className="px-2 py-0.5">
            {guide.redPenNote}
          </RedPen>
          <span className="text-ink-subtle">· Click any page to inspect full size</span>
        </div>
      )}

      {/* Desktop / Tablet Fanned Stack */}
      <div className="hidden sm:block relative h-[320px] w-full max-w-[540px] mx-auto">
        {displayImages.map((img, idx) => {
          const isHovered = hoveredIdx === idx;
          const spreadRatio = count > 1 ? idx / (count - 1) - 0.5 : 0; // -0.5 to +0.5
          const translateX = spreadRatio * (count <= 4 ? 190 : 250);
          const translateY = Math.abs(spreadRatio) * 18 - (isHovered ? 14 : 0);
          const rotate = spreadRatio * (count <= 4 ? 10 : 14);
          const zIndex = isHovered ? 40 : 20 - idx;

          return (
            <button
              key={img.fileSlug}
              type="button"
              onMouseEnter={() => setHoveredIdx(idx)}
              onFocus={() => setHoveredIdx(idx)}
              onClick={() => onOpenLightbox(idx)}
              aria-label={`Look inside ${guide.moduleName} Guide, page ${img.page}: ${img.caption}`}
              style={{
                transform: `translate3d(calc(-50% + ${translateX}px), ${translateY}px, 0) rotate(${rotate}deg) scale(${
                  isHovered ? 1.04 : 1
                })`,
                zIndex,
              }}
              className="absolute left-1/2 top-2 w-[185px] transition-all duration-300 ease-out cursor-zoom-in focus-visible:outline-2 focus-visible:outline-violet-pen text-left"
            >
              <GuideSamplePageCard
                image={img}
                eager={eagerFirst && idx === 0}
                showCaptionBar
              />
            </button>
          );
        })}
      </div>

      {/* Mobile Horizontally Swipeable Strip with Scroll-Snap (~220px per page, next page peeking) */}
      <div className="sm:hidden flex items-stretch gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4">
        {displayImages.map((img, idx) => (
          <button
            key={img.fileSlug}
            type="button"
            onClick={() => onOpenLightbox(idx)}
            className="snap-start shrink-0 w-[220px] text-left focus-visible:outline-2 focus-visible:outline-violet-pen"
          >
            <GuideSamplePageCard
              image={img}
              eager={eagerFirst && idx === 0}
              showCaptionBar
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Full-Screen Lightbox Viewer for Guide Pages
 * - Counter: "Page 21 of 65 · Writing"
 * - Zoom: + / − buttons, double-tap/double-click toggle, pinch-zoom friendly
 * - Navigation: Left/Right buttons, keyboard ArrowLeft/ArrowRight, Esc to close, mobile swipe
 * - Thumbnail strip at the bottom
 * - Focus trap + focus restoration on close + preloads neighbouring images
 * - Zero download/save links, draggable=false
 */
export function GuideLightboxModal({
  guide,
  images,
  initialIndex,
  onClose,
}: {
  guide: GuideData;
  images: ResolvedGuideImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState<number>(1);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const safeIndex = images.length > 0 ? currentIndex % images.length : 0;
  const activeImg = images[safeIndex];

  // Save & restore focus, trap focus inside modal
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setZoom(1);
        setCurrentIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setZoom(1);
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((z) => Math.min(2.25, Number((z + 0.25).toFixed(2))));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))));
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [images.length, onClose]);

  // Preload neighbouring images
  useEffect(() => {
    if (images.length <= 1) return;
    const nextIdx = (safeIndex + 1) % images.length;
    const prevIdx = (safeIndex - 1 + images.length) % images.length;
    [images[nextIdx], images[prevIdx]].forEach((item) => {
      if (item) {
        const preload = new Image();
        preload.src = item.resolvedUrl;
      }
    });
  }, [safeIndex, images]);

  if (!activeImg) return null;

  const goPrev = () => {
    setZoom(1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNext = () => {
    setZoom(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Page ${activeImg.page} of ${guide.pages} · ${guide.moduleName}`}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 bg-ink/92 backdrop-blur-xs flex flex-col justify-between p-3 sm:p-5 select-none"
      onClick={onClose}
    >
      {/* Top Bar: Counter + Caption + Zoom + Close */}
      <div
        className="max-w-5xl w-full mx-auto bg-paper border border-rule-strong px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <span className="font-mono text-xs font-semibold text-ink tabular-nums block">
            Page {activeImg.page} of {guide.pages} · {guide.moduleName}
          </span>
          <span className="font-mono text-[11px] text-ink-muted truncate block">
            {activeImg.caption} · SAMPLE · p.{activeImg.page}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
            disabled={zoom <= 1}
            aria-label="Zoom out"
            className="w-8 h-8 border border-rule bg-surface-elevated hover:border-ink text-ink disabled:opacity-40 cursor-pointer"
          >
            −
          </button>
          <span className="px-2 tabular-nums text-[11px] text-ink-muted">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.25, Number((z + 0.25).toFixed(2))))}
            disabled={zoom >= 2.25}
            aria-label="Zoom in"
            className="w-8 h-8 border border-rule bg-surface-elevated hover:border-ink text-ink disabled:opacity-40 cursor-pointer"
          >
            +
          </button>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close sample viewer (Esc)"
            className="ml-2 px-3 h-8 border border-rule-strong bg-ink text-paper hover:bg-violet-pen font-mono text-xs cursor-pointer"
          >
            Esc · Close
          </button>
        </div>
      </div>

      {/* Center Stage: Natural A4 Page Image with Swipe & Double-Tap Zoom */}
      <div
        className="flex-1 max-w-5xl w-full mx-auto my-2 relative flex items-center justify-center overflow-auto bg-[#141418] border border-paper/15"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 1.75))}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            touchStartX.current = e.touches[0].clientX;
          }
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || e.changedTouches.length === 0) return;
          const deltaX = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(deltaX) > 48 && zoom === 1) {
            if (deltaX < 0) goNext();
            else goPrev();
          }
          touchStartX.current = null;
        }}
      >
        {images.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous sample page"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-paper/95 border border-rule-strong text-ink hover:bg-violet-pen hover:text-white font-mono text-sm cursor-pointer"
          >
            ←
          </button>
        )}

        <div
          className="relative transition-transform duration-200 ease-out p-3"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
        >
          <img
            src={activeImg.resolvedUrl}
            srcSet={`${activeImg.resolvedUrl} 400w, ${activeImg.resolvedUrl} 1200w`}
            sizes="90vw"
            alt={activeImg.alt}
            width={840}
            height={1188}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="max-h-[68vh] w-auto h-auto object-contain bg-white border border-rule rounded-[2px] shadow-md select-none pointer-events-none"
          />
          <span className="absolute top-5 right-5 bg-paper/95 text-ink font-mono text-[10px] px-2 py-0.5 border border-rule rounded-[2px]">
            SAMPLE · p.{activeImg.page}
          </span>
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next sample page"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-paper/95 border border-rule-strong text-ink hover:bg-violet-pen hover:text-white font-mono text-sm cursor-pointer"
          >
            →
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      <div
        className="max-w-5xl w-full mx-auto bg-paper border border-rule-strong px-3 py-2 flex items-center justify-between gap-3 overflow-x-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {images.map((thumb, idx) => {
            const isCurrent = idx === safeIndex;
            return (
              <button
                key={thumb.fileSlug}
                type="button"
                onClick={() => {
                  setZoom(1);
                  setCurrentIndex(idx);
                }}
                className={`px-2.5 py-1 font-mono text-[11px] border transition-colors cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? 'bg-ink text-paper border-ink font-medium'
                    : 'bg-surface-elevated text-ink-muted border-rule hover:text-ink'
                }`}
              >
                p.{thumb.page} · {thumb.caption}
              </button>
            );
          })}
        </div>

        <span className="hidden sm:inline font-mono text-[10px] text-ink-subtle shrink-0">
          Sample pages only · Personal study licence
        </span>
      </div>
    </div>
  );
}
