import React, { useEffect, useState } from 'react';
import { ReviewItem, VideoTestimonialConfig, WrittenQuoteItem } from '../config';
import { IconClose } from './EditorialGraphics';
import { RedPen } from './RedPen';

interface StudentProofCarouselProps {
  items: ReviewItem[];
  writtenQuotes?: WrittenQuoteItem[];
  videoTestimonial?: VideoTestimonialConfig;
  ratingBadgeText?: string;
  sectionKicker?: string;
  intervalMs?: number;
}

/**
 * Image component that renders the exact unaltered original screenshot file (`<img>`)
 * and applies non-destructive CSS privacy blur overlays over names/photos/IDs if configured.
 */
function ProofScreenshotWithPrivacy({
  review,
  onMissing,
  imgClassName = '',
}: {
  review: ReviewItem;
  onMissing?: (id: string) => void;
  imgClassName?: string;
}) {
  const [src, setSrc] = useState(review.imageUrl);
  const [triedAltExt, setTriedAltExt] = useState(false);

  return (
    <div className="relative inline-block max-w-full max-h-full">
      <img
        src={src}
        alt={review.altText}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (!triedAltExt) {
            setTriedAltExt(true);
            if (src.endsWith('.jpg')) {
              setSrc(src.replace(/\.jpg$/, '.png'));
            } else if (src.endsWith('.png')) {
              setSrc(src.replace(/\.png$/, '.jpg'));
            } else {
              onMissing?.(review.id);
            }
          } else {
            onMissing?.(review.id);
          }
        }}
        className={imgClassName}
      />

      {/* Non-destructive CSS privacy masks over student names/photos/IDs */}
      {review.privacyMasks?.map((mask, idx) => (
        <span
          key={idx}
          aria-hidden="true"
          title="Redacted to protect student privacy"
          style={{
            top: mask.top,
            left: mask.left,
            width: mask.width,
            height: mask.height,
          }}
          className="absolute z-10 bg-[#18181f]/95 border border-white/10 rounded-2xs pointer-events-none"
        />
      ))}
    </div>
  );
}

/**
 * Featured Video Testimonial Spotlight Card
 * Placed at the top of Section 04 (Student Proof) for maximum conversion impact:
 * - Left: 9:16 or 16:9 adaptive native video player (or YouTube/Vimeo iframe)
 * - Right: Skimmable pull-quote + Before -> Fix -> After breakdown for silent mobile scrollers
 */
function FeaturedVideoTestimonial({ video }: { video: VideoTestimonialConfig }) {
  const [videoSrc, setVideoSrc] = useState<string>(video.videoUrl || '/testimonial.mp4');
  const [videoAvailable, setVideoAvailable] = useState<boolean>(true);
  const [triedFallback, setTriedFallback] = useState<number>(0);

  const isEmbedUrl =
    videoSrc.includes('youtube.com/embed') ||
    videoSrc.includes('youtu.be') ||
    videoSrc.includes('drive.google.com') ||
    videoSrc.includes('vimeo.com');

  const fallbackCandidates = [
    '/testimonial.mp4',
    '/testimonial.mov',
    '/testimonial.webm',
    '/review.mp4',
    '/student-video.mp4',
  ];

  return (
    <div className="mb-10 bg-surface-elevated border border-rule-strong p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-rule font-mono text-[11px]">
        <div className="flex items-center gap-2 text-examiner-red font-medium">
          <span className="w-2 h-2 rounded-full bg-examiner-red inline-block" aria-hidden="true" />
          <span>FEATURED STUDENT VIDEO REVIEW</span>
        </div>
        <span className="text-ink-muted">{video.moduleHighlight}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Video Player Column (5 cols on desktop) */}
        <div className="lg:col-span-5">
          <div className="w-full bg-[#121216] border border-rule overflow-hidden relative flex items-center justify-center min-h-[260px] sm:min-h-[320px] max-h-[440px]">
            {isEmbedUrl ? (
              <iframe
                src={videoSrc}
                title={video.studentLabel}
                className="w-full aspect-video border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : videoAvailable ? (
              <video
                key={videoSrc}
                src={videoSrc}
                poster={video.posterUrl}
                controls
                playsInline
                preload="none"
                onError={() => {
                  if (triedFallback < fallbackCandidates.length) {
                    const next = fallbackCandidates[triedFallback];
                    setTriedFallback((prev) => prev + 1);
                    setVideoSrc(next);
                  } else {
                    setVideoAvailable(false);
                  }
                }}
                className="w-full max-h-[420px] h-auto object-contain block"
              />
            ) : (
              /* Clean Editorial Slot shown until public/testimonial.mp4 is dropped into /public */
              <div className="p-6 text-center font-mono text-xs text-paper/80 space-y-2">
                <div className="w-11 h-11 mx-auto rounded-full border border-paper/30 flex items-center justify-center text-paper">
                  ▶
                </div>
                <p className="text-paper font-medium">Student Video Testimonial Slot</p>
                <p className="text-[11px] text-paper/60 max-w-xs mx-auto leading-relaxed">
                  Upload your video file to <code className="text-paper underline">public/testimonial.mp4</code> (or paste a YouTube/Drive link in <code className="text-paper">src/config.ts</code>) and it will play right here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pull-Quote & Skimmable Story Column (7 cols on desktop — converts visitors who scroll with sound off) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-violet-pen block mb-2">
              {video.studentLabel}
            </span>

            <blockquote className="font-serif text-xl sm:text-2xl text-ink leading-snug">
              I felt really stuck before joining.{' '}
              <RedPen type="underline" seed={1}>
                Reading List of Headings
              </RedPen>{' '}
              used to be really hard—after Jubayer’s guidance, I got my confidence back, started improving, and recommend him to others.
            </blockquote>

            {/* 3-Point Before / Fix / After Summary */}
            <div className="mt-6 pt-5 border-t border-rule space-y-2.5 text-sm text-ink-muted">
              {video.summaryPoints.map((pt, idx) => (
                <div key={idx} className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-violet-pen font-medium tabular-nums shrink-0">
                    0{idx + 1}
                  </span>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-rule/70 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ink-subtle">
            <span>Shared with student permission</span>
            <span className="text-ink font-medium">Module: Academic Reading (Matching Headings)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Student Proof Carousel Component
 * Positioned before About & Programs so trust comes before price.
 * Includes Featured Video Testimonial, skimmable written quotes, privacy-protected unaltered screenshots,
 * uniform card sizing, and click-to-enlarge lightbox.
 */
export function StudentProofCarousel({
  items,
  writtenQuotes = [],
  videoTestimonial,
  ratingBadgeText = 'Student-shared results, shown with permission',
  sectionKicker = '04. Student Proof',
  intervalMs = 4500,
}: StudentProofCarouselProps) {
  const [missingIds, setMissingIds] = useState<Record<string, boolean>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<ReviewItem | null>(null);

  const visibleItems = items.filter((item) => !missingIds[item.id]);

  useEffect(() => {
    if (visibleItems.length <= 1 || isPaused || lightboxItem) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % visibleItems.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [visibleItems.length, intervalMs, isPaused, lightboxItem]);

  useEffect(() => {
    if (!lightboxItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxItem]);

  if (visibleItems.length === 0 && !videoTestimonial) {
    return null;
  }

  const safeIndex = visibleItems.length > 0 ? activeIndex % visibleItems.length : 0;

  const handleMissing = (id: string) => {
    setMissingIds((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % visibleItems.length);
  };

  return (
    <section
      id="reviews"
      className="py-20 sm:py-28 border-b border-rule scroll-mt-16"
      aria-label="Student Proof"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
              {sectionKicker}
            </span>
            <h2 className="font-serif text-display-section font-normal text-ink">
              Messages &amp; results from students.
            </h2>
          </div>

          {ratingBadgeText && (
            <div className="font-mono text-xs text-ink border border-rule bg-ivory px-3.5 py-2 tabular-nums self-start sm:self-auto">
              {ratingBadgeText}
            </div>
          )}
        </div>

        {/* 1. Featured Video Testimonial Spotlight (Best placement: top of Student Proof, right after the Matching Headings Problem/Method) */}
        {videoTestimonial && <FeaturedVideoTestimonial video={videoTestimonial} />}

        {/* 2. Short Written Quotes so visitors can skim without opening images */}
        {writtenQuotes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 pb-8 border-b border-rule">
            {writtenQuotes.map((q) => (
              <blockquote
                key={q.id}
                className="bg-ivory/70 border border-rule p-4 sm:p-5 flex flex-col justify-between"
              >
                <p className="font-serif text-base sm:text-lg text-ink leading-snug">
                  {q.quote}
                </p>
                <footer className="mt-3 pt-2.5 border-t border-rule/70 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ink-muted">
                  <span>{q.context}</span>
                  <span className="text-ink font-medium tabular-nums">{q.scoreBadge}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        )}

        {/* Smaller Screens: Compact, uniform-size auto-cycling fade carousel */}
        <div
          className="md:hidden max-w-sm mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          role="region"
          aria-roledescription="carousel"
          aria-label="Student review messages carousel"
        >
          <div className="grid grid-cols-1 grid-rows-1 relative">
            {visibleItems.map((review, idx) => {
              const isActive = idx === safeIndex;
              return (
                <figure
                  key={review.id}
                  aria-hidden={!isActive}
                  onClick={() => setLightboxItem(review)}
                  className={`col-start-1 row-start-1 bg-surface-elevated border border-rule p-2.5 flex flex-col justify-between cursor-zoom-in transition-opacity duration-700 ease-out ${
                    isActive
                      ? 'opacity-100 z-10 pointer-events-auto'
                      : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  {/* Uniform fixed-height viewport so all 4 images match the exact same size */}
                  <div className="w-full h-[320px] bg-[#141418] border border-rule/60 overflow-hidden flex items-center justify-center p-1.5 relative group">
                    <ProofScreenshotWithPrivacy
                      review={review}
                      onMissing={handleMissing}
                      imgClassName="max-w-full max-h-[304px] w-auto h-auto object-contain block transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="absolute bottom-2 right-2 z-20 bg-paper/90 text-ink font-mono text-[10px] px-2 py-0.5 border border-rule">
                      Tap to enlarge
                    </span>
                  </div>

                  {(review.studentName || review.scoreSummary) && (
                    <figcaption className="mt-2.5 pt-2 border-t border-rule font-mono text-[11px] text-ink-muted flex flex-col gap-0.5">
                      <span className="truncate">{review.studentName}</span>
                      <span className="text-ink font-medium tabular-nums truncate">
                        {review.scoreSummary}
                      </span>
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>

          {/* Carousel Controls & Pagination Indicator */}
          <div className="mt-3.5 flex items-center justify-between gap-3 pt-3 border-t border-rule/70">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose review card">
              {visibleItems.map((review, idx) => {
                const isActive = idx === safeIndex;
                return (
                  <button
                    key={review.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Show student review ${idx + 1} of ${visibleItems.length}`}
                    onClick={() => setActiveIndex(idx)}
                    className={`h-1.5 transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'w-6 bg-violet-pen'
                        : 'w-2 bg-rule-strong hover:bg-ink-muted'
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-ink-muted tabular-nums">
              <span>
                {String(safeIndex + 1).padStart(2, '0')} / {String(visibleItems.length).padStart(2, '0')}
              </span>
              <div className="flex items-center border border-rule bg-surface-elevated">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous student review"
                  className="px-2.5 py-1 text-ink hover:bg-ivory transition-colors cursor-pointer border-r border-rule"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next student review"
                  className="px-2.5 py-1 text-ink hover:bg-ivory transition-colors cursor-pointer"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tablet & Desktop: Clean 4-column equal-size row (all cards exact same width & height) */}
        <div
          className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 items-stretch"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {visibleItems.map((review, idx) => {
            const isSpotlight = idx === safeIndex;
            return (
              <figure
                key={review.id}
                onClick={() => setLightboxItem(review)}
                className={`group bg-surface-elevated border p-2.5 flex flex-col justify-between cursor-zoom-in transition-all duration-300 hover:-translate-y-0.5 ${
                  isSpotlight
                    ? 'border-violet-pen shadow-xs'
                    : 'border-rule hover:border-rule-strong'
                }`}
              >
                {/* Uniform fixed-height frame (300px) so every screenshot has the exact same card size */}
                <div className="w-full h-[300px] bg-[#141418] border border-rule/60 overflow-hidden flex items-center justify-center p-1.5 relative">
                  <ProofScreenshotWithPrivacy
                    review={review}
                    onMissing={handleMissing}
                    imgClassName="max-w-full max-h-[284px] w-auto h-auto object-contain block transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2 z-20 bg-paper/95 text-ink font-mono text-[10px] px-2 py-0.5 border border-rule">
                    Click to view full size
                  </span>
                </div>

                {(review.studentName || review.scoreSummary) && (
                  <figcaption className="mt-2.5 pt-2 border-t border-rule font-mono text-[11px] text-ink-muted flex flex-col gap-0.5">
                    <span className="truncate" title={review.studentName}>
                      {review.studentName}
                    </span>
                    <span className="text-ink font-medium tabular-nums truncate" title={review.scoreSummary}>
                      {review.scoreSummary}
                    </span>
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>

        <p className="mt-4 font-mono text-[11px] text-ink-subtle">
          Note: Student names and profile photos are blurred to protect student privacy. Shared with student permission.
        </p>
      </div>

      {/* Full-Resolution Lightbox Modal when a student clicks any card */}
      {lightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.studentName || 'Student result screenshot'}
          className="fixed inset-0 z-50 bg-ink/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-paper border border-rule-strong p-3 sm:p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-2.5 mb-3 border-b border-rule">
              <div className="min-w-0 font-mono text-xs">
                <p className="text-ink font-medium truncate">{lightboxItem.studentName}</p>
                <p className="text-ink-muted text-[11px] truncate">{lightboxItem.scoreSummary}</p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                aria-label="Close full-size screenshot"
                className="p-1.5 border border-rule bg-surface-elevated hover:border-ink text-ink cursor-pointer shrink-0"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[78vh] overflow-auto bg-[#141418] flex items-center justify-center p-2">
              <ProofScreenshotWithPrivacy
                review={lightboxItem}
                imgClassName="max-h-[74vh] w-auto h-auto object-contain block"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
