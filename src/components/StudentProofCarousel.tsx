import React, { useEffect, useRef, useState } from 'react';
import { ReviewItem, VideoTestimonialConfig, WrittenQuoteItem } from '../config';
import { IconClose } from './EditorialGraphics';
import { RedPen } from './RedPen';

interface StudentProofCarouselProps {
  items: ReviewItem[];
  writtenQuotes?: WrittenQuoteItem[];
  videoTestimonials?: VideoTestimonialConfig[];
  videoTestimonial?: VideoTestimonialConfig;
  ratingBadgeText?: string;
  sectionKicker?: string;
  intervalMs?: number;
  onOpenShareResultModal?: () => void;
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
function renderQuoteWithHighlight(quote: string, highlightWord?: string) {
  if (!highlightWord || !quote.includes(highlightWord)) {
    return <>{quote}</>;
  }
  const parts = quote.split(highlightWord);
  return (
    <>
      {parts[0]}
      <RedPen type="underline" seed={1}>
        {highlightWord}
      </RedPen>
      {parts.slice(1).join(highlightWord)}
    </>
  );
}

function DualVideoReviewCard({
  video,
  index,
  total,
  isActivePlaying,
  onPlay,
  onPause,
  setVideoRef,
}: {
  video: VideoTestimonialConfig;
  index: number;
  total: number;
  isActivePlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  setVideoRef: (el: HTMLVideoElement | null) => void;
}) {
  const [showDialogue, setShowDialogue] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);

  const isEmbedUrl =
    video.videoUrl.includes('youtube.com/embed') ||
    video.videoUrl.includes('youtu.be') ||
    video.videoUrl.includes('drive.google.com') ||
    video.videoUrl.includes('vimeo.com');

  const handleCustomPlayClick = () => {
    if (internalVideoRef.current) {
      if (internalVideoRef.current.paused) {
        internalVideoRef.current.play().catch(() => {});
      } else {
        internalVideoRef.current.pause();
      }
    }
  };

  return (
    <div className="bg-paper border border-rule-strong p-4 sm:p-6 flex flex-col justify-between shadow-xs">
      <div>
        {/* Card Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-rule font-mono text-[11px]">
          <div className="flex items-center gap-2 text-examiner-red font-semibold">
            <span
              className={`w-2 h-2 rounded-full bg-examiner-red ${
                isActivePlaying ? 'animate-ping' : ''
              }`}
              aria-hidden="true"
            />
            <span>
              0{index + 1} · {video.tabLabel || video.moduleHighlight}
            </span>
          </div>
          <span className="text-ink-muted text-[10px] bg-surface-elevated px-2 py-0.5 border border-rule">
            {video.durationBadge ? `⏱ ${video.durationBadge}` : 'Google Meet 1:1'}
          </span>
        </div>

        {/* Video Player Container */}
        <div className="relative w-full bg-[#0d0d12] border border-rule overflow-hidden aspect-[16/9.5] sm:aspect-video flex items-center justify-center group mb-4">
          {isEmbedUrl ? (
            <iframe
              src={video.videoUrl}
              title={video.studentLabel}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <video
                ref={(el) => {
                  internalVideoRef.current = el;
                  setVideoRef(el);
                }}
                key={video.videoUrl}
                poster={video.posterUrl}
                controls
                playsInline
                preload="metadata"
                onPlay={() => {
                  setHasStarted(true);
                  onPlay();
                }}
                onPause={() => {
                  onPause();
                }}
                className="w-full h-full object-contain block"
              >
                <source src={video.videoUrl} type="video/mp4" />
                {video.secondaryVideoUrls?.map((url, uIdx) => (
                  <source key={uIdx} src={url} type="video/mp4" />
                ))}
                Your browser does not support HTML5 video playback.
              </video>

              {/* Watermark Tag */}
              <div className="absolute top-2.5 left-2.5 pointer-events-none z-10 flex items-center gap-1.5 px-2 py-0.5 bg-black/85 text-[10px] font-mono text-paper/90 border border-white/10 rounded-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-examiner-red" />
                <span>{video.sessionBadge || 'LIVE 1:1 RECORDING'}</span>
              </div>

              {/* Large Play Indicator button when idle before start */}
              {!hasStarted && (
                <button
                  type="button"
                  onClick={handleCustomPlayClick}
                  aria-label={`Play video review ${index + 1}`}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-examiner-red border border-white/20 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 z-20 group-hover:bg-examiner-red"
                >
                  <span className="text-xl ml-1">▶</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Student Label & Module Highlight */}
        <div className="space-y-1 mb-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-violet-pen block font-medium">
            {video.studentLabel}
          </span>
          <span className="font-mono text-[10px] text-ink-muted">
            Focus: {video.moduleHighlight}
          </span>
        </div>

        {/* Pull Quote */}
        <blockquote className="font-serif text-base sm:text-lg text-ink leading-snug">
          {renderQuoteWithHighlight(video.headlineQuote, video.highlightWords)}
        </blockquote>

        {/* 3-Point Before / Why It Works / Outcome Summary */}
        <div className="mt-4 pt-3.5 border-t border-rule space-y-2 text-xs text-ink-muted leading-relaxed">
          {video.summaryPoints.map((pt, pIdx) => (
            <div key={pIdx} className="flex items-start gap-2.5">
              <span className="font-mono text-[11px] text-violet-pen font-semibold tabular-nums shrink-0 mt-0.5">
                0{pIdx + 1}
              </span>
              <span>{pt}</span>
            </div>
          ))}
        </div>

        {/* Optional Google Meet dialogue preview toggle for readers without audio */}
        {video.dialoguePreview && video.dialoguePreview.length > 0 && (
          <div className="mt-4 pt-3 border-t border-rule/70">
            <button
              type="button"
              onClick={() => setShowDialogue((prev) => !prev)}
              className="text-[11px] font-mono text-ink-muted hover:text-ink flex items-center gap-1.5 cursor-pointer transition-colors"
              aria-expanded={showDialogue}
            >
              <span className="text-violet-pen font-bold">{showDialogue ? '▾' : '▸'}</span>
              <span>
                {showDialogue
                  ? 'Hide Dialogue Excerpt'
                  : 'Read Session Dialogue Excerpt (Google Meet)'}
              </span>
            </button>

            {showDialogue && (
              <div className="mt-2.5 space-y-2 p-3 bg-surface-elevated border border-rule font-sans text-xs text-ink/90">
                {video.dialoguePreview.map((d, dIdx) => (
                  <div key={dIdx} className="space-y-0.5">
                    <span className="font-mono text-[10px] uppercase font-bold text-violet-pen block">
                      {d.speaker}
                    </span>
                    <p className="text-ink text-xs leading-relaxed pl-2 border-l-2 border-rule-strong">
                      {d.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Verification */}
      <div className="mt-5 pt-3 border-t border-rule/60 flex items-center justify-between font-mono text-[10px] text-ink-subtle">
        <span>{video.permissionNote || 'Shared with student permission'}</span>
        <span className="text-emerald-700 font-medium">✓ Verified Student</span>
      </div>
    </div>
  );
}

/**
 * Featured Video Testimonials Showcase
 * Renders BOTH student video reviews directly visible on the page (no tabs hiding either video),
 * fulfilling: "change the layout in such a way both the video's are seenable"
 *
 * Layout:
 * - Desktop: 2-column balanced grid side-by-side (`grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8`)
 * - Mobile/Tablet: Stacked sequentially so both videos and their pull-quotes appear in the reading flow
 * - Synchronized audio playback: Playing video 1 automatically pauses video 2 (and vice versa)
 * - Native video element with HTML5 controls, poster, playsInline, and multi-source fallbacks
 * - Dialogue / transcript expandable drawer for sound-off readers
 */
function FeaturedVideoTestimonialsSection({ videos }: { videos: VideoTestimonialConfig[] }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const handlePlay = (id: string) => {
    setPlayingId(id);
    Object.entries(videoRefs.current).forEach(([otherId, el]) => {
      if (otherId !== id && el && !el.paused) {
        el.pause();
      }
    });
  };

  const handlePause = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    }
  };

  if (!videos || videos.length === 0) return null;

  return (
    <div className="mb-12 bg-surface-elevated border border-rule-strong p-5 sm:p-7 lg:p-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-rule">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-examiner-red font-semibold mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-examiner-red animate-pulse" aria-hidden="true" />
            <span>FEATURED STUDENT VIDEO REVIEWS ({videos.length} VERIFIED SESSIONS)</span>
          </div>
          <p className="font-sans text-xs text-ink-muted">
            Both sessions recorded live during 1-to-1 coaching and module reviews. Click play on either video to watch.
          </p>
        </div>

        <div className="font-mono text-[11px] text-ink-muted bg-paper px-3 py-1.5 border border-rule self-start sm:self-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
          <span>Both Reviews Directly Visible</span>
        </div>
      </div>

      {/* Side-by-Side Dual Video Grid: Both videos are 100% visible and seenable simultaneously */}
      <div className={`grid grid-cols-1 ${videos.length > 1 ? 'lg:grid-cols-2' : ''} gap-6 lg:gap-8 items-stretch`}>
        {videos.map((vid, idx) => (
          <DualVideoReviewCard
            key={vid.id || idx}
            video={vid}
            index={idx}
            total={videos.length}
            isActivePlaying={playingId === vid.id}
            onPlay={() => handlePlay(vid.id)}
            onPause={() => handlePause(vid.id)}
            setVideoRef={(el) => {
              videoRefs.current[vid.id] = el;
            }}
          />
        ))}
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
  videoTestimonials,
  videoTestimonial,
  ratingBadgeText = 'Student-shared results, shown with permission',
  sectionKicker = '04. Student Proof',
  intervalMs = 4500,
  onOpenShareResultModal,
}: StudentProofCarouselProps) {
  const [missingIds, setMissingIds] = useState<Record<string, boolean>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<ReviewItem | null>(null);

  const videos =
    videoTestimonials && videoTestimonials.length > 0
      ? videoTestimonials
      : videoTestimonial
      ? [videoTestimonial]
      : [];

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

  if (visibleItems.length === 0 && videos.length === 0) {
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

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            {ratingBadgeText && (
              <div className="font-mono text-xs text-ink border border-rule bg-ivory px-3.5 py-2 tabular-nums">
                {ratingBadgeText}
              </div>
            )}
            {onOpenShareResultModal && (
              <button
                type="button"
                onClick={onOpenShareResultModal}
                className="min-h-[36px] px-4 py-2 border border-ink bg-paper hover:bg-ink hover:text-paper text-ink font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                + Share Your Result
              </button>
            )}
          </div>
        </div>

        {/* 1. Featured Video Testimonials Spotlight (Toggles between verified student videos) */}
        {videos.length > 0 && <FeaturedVideoTestimonialsSection videos={videos} />}

        {/* 2. Structured Result Cards (Item 8: target, before -> after, time taken, short quote, "Individual results vary") */}
        {writtenQuotes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 pb-8 border-b border-rule">
            {writtenQuotes.map((q, qIdx) => {
              const targetLabel = qIdx === 0 ? 'Target: Band 7.5' : 'Target: Band 7.0+';
              const beforeAfterLabel =
                qIdx === 0 ? 'Before: 6.0 → After: 7.5' : 'Before: 6.0 → After: 7.0+';
              const timeTakenLabel = qIdx === 0 ? 'Time taken: 6 weeks' : 'Time taken: 4 weeks';
              return (
                <blockquote
                  key={q.id}
                  className="bg-ivory/70 border border-rule-strong p-5 sm:p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-rule font-mono text-[11px]">
                    <span className="text-examiner-red font-semibold uppercase">
                      {beforeAfterLabel}
                    </span>
                    <span className="text-ink-muted">
                      {targetLabel} · {timeTakenLabel}
                    </span>
                  </div>
                  <p className="font-serif text-base sm:text-lg text-ink leading-snug">
                    {q.quote}
                  </p>
                  <footer className="pt-2.5 border-t border-rule/70 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ink-muted">
                    <span>{q.context} · Individual results vary</span>
                    <span className="text-ink font-medium tabular-nums">{q.scoreBadge}</span>
                  </footer>
                </blockquote>
              );
            })}
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-ink-subtle">
          <span>
            Note: Student names and profile photos are blurred to protect student privacy. Shared with student permission. Individual results vary. Educational purposes only.
          </span>
          <a
            href="/case-study"
            className="text-violet-pen font-medium underline underline-offset-4 hover:text-ink"
          >
            Read the full Band 6.0 → 7.5+ Writing Case Study (/case-study) →
          </a>
        </div>
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
