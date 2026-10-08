import React, { useState } from 'react';
import {
  GuideData,
  GuideModuleId,
  SELF_PREP_GUIDES,
} from '../guidesConfig';
import {
  buildGuidesBundleWaMessage,
  wa,
} from '../config';
import { IconArrowUpRight } from './EditorialGraphics';
import { RedPen } from './RedPen';
import {
  GuideFannedStack,
  GuideLightboxModal,
  GuideSamplePageCard,
  ResolvedGuideImage,
  useResolvedGuideImages,
} from './GuidePreviewSystem';

/**
 * Reusable Bundle Builder Bar
 * - Checkboxes for the four guides
 * - Selecting them updates the WhatsApp message and shows "BDT 500 × n"
 * - With 3+ selected, shows "bundle discount, confirmed on WhatsApp" (never an invented discounted number)
 */
export function GuidesBundleBar({
  selectedIds,
  onToggleId,
  onWaAction,
  stickyMobile = false,
}: {
  selectedIds: GuideModuleId[];
  onToggleId: (id: GuideModuleId) => void;
  onWaAction: (messageText: string) => void;
  stickyMobile?: boolean;
}) {
  const selectedNames = SELF_PREP_GUIDES.filter((g) =>
    selectedIds.includes(g.id)
  ).map((g) => g.moduleName);

  const count = selectedNames.length;
  const hasBundleDiscount = count >= 3;
  const waMessage = buildGuidesBundleWaMessage(selectedNames);

  return (
    <div
      className={`border border-rule-strong bg-ivory/90 p-5 sm:p-6 ${
        stickyMobile ? 'pb-6' : ''
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            <span className="text-ink font-semibold uppercase tracking-wider">
              Bundle Builder
            </span>
            <span className="text-ink-subtle" aria-hidden="true">
              ·
            </span>
            <RedPen type="underline" seed={2} className="text-examiner-red font-medium">
              Buy 3 or more: bundle discount (confirmed on WhatsApp)
            </RedPen>
          </div>

          {/* 4 Checkboxes for Listening, Reading, Writing, Speaking */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
            {SELF_PREP_GUIDES.map((guide) => {
              const checked = selectedIds.includes(guide.id);
              return (
                <label
                  key={guide.id}
                  className={`inline-flex items-center gap-2.5 px-3.5 py-2 border text-xs sm:text-sm font-mono cursor-pointer transition-colors select-none min-h-[42px] ${
                    checked
                      ? 'bg-ink text-paper border-ink font-medium'
                      : 'bg-paper text-ink border-rule hover:border-ink'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleId(guide.id)}
                    className="sr-only"
                  />
                  <span
                    className={`w-3.5 h-3.5 border inline-flex items-center justify-center text-[10px] ${
                      checked
                        ? 'border-paper bg-paper text-ink'
                        : 'border-ink-muted'
                    }`}
                    aria-hidden="true"
                  >
                    {checked ? '✓' : ''}
                  </span>
                  <span>
                    {guide.num} · {guide.moduleName}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Dynamic Price Formula + WhatsApp CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-rule">
          <div className="font-mono text-left sm:text-right">
            {count === 0 ? (
              <>
                <span className="block text-sm text-ink font-medium tabular-nums">
                  BDT 499 per guide
                </span>
                <span className="block text-[11px] text-ink-muted">
                  Select guides to build your bundle
                </span>
              </>
            ) : (
              <>
                <span className="block text-base sm:text-lg text-ink font-semibold tabular-nums">
                  BDT 499 × {count}
                </span>
                <span className="block text-[11px] text-examiner-red font-medium">
                  {hasBundleDiscount
                    ? 'bundle discount, confirmed on WhatsApp'
                    : 'Select 3+ guides for bundle discount'}
                </span>
              </>
            )}
          </div>

          <a
            href={wa(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onWaAction(waMessage)}
            className="group/btn min-h-[46px] px-5 py-3 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
          >
            <RedPen type="underline" seed={0} drawOnHover>
              {count === 0
                ? 'Ask about Self-Prep Guides'
                : count >= 3
                ? `Get ${count} guides on WhatsApp (bundle)`
                : `Get ${count} ${count === 1 ? 'guide' : 'guides'} on WhatsApp`}
            </RedPen>
            <IconArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Single Hairline Row for the Landing Page Summary Section
 */
function LandingGuideHairlineRow({
  guide,
  isActive,
  eagerImages,
  onSelect,
  onWaAction,
  onNavigateToGuides,
  onResolvedImagesChange,
}: {
  guide: GuideData;
  isActive: boolean;
  eagerImages: boolean;
  onSelect: () => void;
  onWaAction: (messageText: string) => void;
  onNavigateToGuides: (moduleId?: GuideModuleId) => void;
  onResolvedImagesChange: (moduleId: GuideModuleId, imgs: ResolvedGuideImage[]) => void;
}) {
  const { images } = useResolvedGuideImages(guide);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  React.useEffect(() => {
    onResolvedImagesChange(guide.id, images);
  }, [guide.id, images, onResolvedImagesChange]);

  return (
    <div
      onMouseEnter={onSelect}
      onFocus={onSelect}
      className={`py-6 border-b border-rule transition-colors ${
        isActive ? 'bg-ivory/60' : 'hover:bg-ivory/35'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3.5 min-w-0">
          <span
            className={`font-mono text-xs tabular-nums shrink-0 ${
              isActive ? 'text-examiner-red font-semibold' : 'text-ink-subtle'
            }`}
          >
            {guide.num}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-serif text-2xl text-ink font-normal">
                {guide.moduleName}
              </h3>
              <span className="font-mono text-[11px] text-ink-muted tabular-nums">
                {guide.rowStatsMono}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-ink-muted leading-relaxed max-w-[60ch]">
              {guide.oneLine}
            </p>
          </div>
        </div>

        {/* Right: Price BDT 500 + Get on WhatsApp + Look inside */}
        <div className="flex flex-wrap items-center gap-3 sm:shrink-0 pl-7 sm:pl-0">
          <span className="font-mono text-sm font-semibold text-ink tabular-nums mr-1">
            BDT {guide.priceBdt}
          </span>

          <a
            href={wa(guide.whatsAppSingleText)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onWaAction(guide.whatsAppSingleText)}
            className="group/btn min-h-[40px] px-4 py-2 inline-flex items-center gap-1.5 bg-ink hover:bg-violet-pen text-paper hover:text-white font-mono text-xs transition-colors whitespace-nowrap"
          >
            <RedPen type="underline" seed={Number(guide.num)} drawOnHover>
              Get on WhatsApp
            </RedPen>
            <IconArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => {
              if (images.length > 0) {
                setLightboxIdx(0);
              } else {
                onNavigateToGuides(guide.id);
              }
            }}
            className="min-h-[40px] px-2.5 py-2 font-mono text-xs text-ink hover:text-violet-pen underline underline-offset-4 cursor-pointer whitespace-nowrap"
          >
            Look inside →
          </button>
        </div>
      </div>

      {/* Mobile Swipeable Strip under each row (hidden if no images uploaded yet) */}
      {images.length > 0 && (
        <div className="lg:hidden mt-4 pl-7">
          <div className="flex items-stretch gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
            {images.slice(0, 4).map((img, idx) => (
              <button
                key={img.fileSlug}
                type="button"
                onClick={() => setLightboxIdx(idx)}
                className="snap-start shrink-0 w-[210px] text-left"
              >
                <GuideSamplePageCard
                  image={img}
                  eager={eagerImages && idx === 0}
                  showCaptionBar
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {lightboxIdx !== null && images.length > 0 && (
        <GuideLightboxModal
          guide={guide}
          images={images}
          initialIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}

/**
 * Section 5: Landing-Page Self-Prep Guides Section (Summary Version)
 * - Placed after Free Guide and before Student Proof / Programs
 * - Heading: "Study on your own, with a system." with red-pen underline on "a system"
 * - Sub: "Four all-in-one PDF guides, one for each module. BDT 500 each."
 * - Four hairline rows (not cards)
 * - Desktop hover shows that guide's first 4 pages as a fanned stack on the right (when images exist)
 * - Bundle bar + Link to /guides
 */
export function LandingSelfPrepSection({
  onWaAction,
  onNavigateToGuides,
}: {
  onWaAction: (messageText: string) => void;
  onNavigateToGuides: (moduleId?: GuideModuleId) => void;
}) {
  const [activeGuideId, setActiveGuideId] = useState<GuideModuleId>('reading');
  const [selectedBundleIds, setSelectedBundleIds] = useState<GuideModuleId[]>([
    'reading',
    'writing',
    'speaking',
  ]);
  const [resolvedMap, setResolvedMap] = useState<
    Record<GuideModuleId, ResolvedGuideImage[]>
  >({
    listening: [],
    reading: [],
    writing: [],
    speaking: [],
  });
  const [desktopLightboxIdx, setDesktopLightboxIdx] = useState<number | null>(null);

  const handleResolvedChange = React.useCallback(
    (moduleId: GuideModuleId, imgs: ResolvedGuideImage[]) => {
      setResolvedMap((prev) => {
        if (prev[moduleId]?.length === imgs.length) return prev;
        return { ...prev, [moduleId]: imgs };
      });
    },
    []
  );

  const toggleBundleId = (id: GuideModuleId) => {
    setSelectedBundleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const activeGuide =
    SELF_PREP_GUIDES.find((g) => g.id === activeGuideId) || SELF_PREP_GUIDES[1];
  const activeImages = resolvedMap[activeGuide.id] || [];
  const anyDesktopImagesExist = Object.values(resolvedMap).some(
    (arr) => arr.length > 0
  );

  return (
    <section
      id="self-prep-guides"
      className="py-20 sm:py-28 border-b border-rule scroll-mt-16"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div className="max-w-2xl">
            <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
              03. Self-Prep Guides · BDT 499 Each
            </span>
            <h2 className="font-serif text-display-section font-normal text-ink">
              Study on your own, with{' '}
              <RedPen type="underline" seed={1}>
                a system
              </RedPen>
              .
            </h2>
            <p className="mt-3 text-base sm:text-lg text-ink-muted">
              Four all-in-one PDF guides, one for each module. BDT 499 each.
            </p>
          </div>

          <a
            href="/guides"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToGuides();
            }}
            className="font-mono text-xs text-ink hover:text-violet-pen underline underline-offset-4 self-start sm:self-auto whitespace-nowrap"
          >
            See everything inside every guide →
          </a>
        </div>

        {/* Main Layout: 4 Hairline Rows + Desktop Right Fanned Stack (when screenshots are uploaded) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div
            className={`${
              anyDesktopImagesExist ? 'lg:col-span-7' : 'lg:col-span-12'
            } border-t border-rule`}
          >
            {SELF_PREP_GUIDES.map((guide, idx) => (
              <LandingGuideHairlineRow
                key={guide.id}
                guide={guide}
                isActive={activeGuideId === guide.id}
                eagerImages={idx === 0}
                onSelect={() => setActiveGuideId(guide.id)}
                onWaAction={onWaAction}
                onNavigateToGuides={onNavigateToGuides}
                onResolvedImagesChange={handleResolvedChange}
              />
            ))}
          </div>

          {/* Desktop Right Column: Fanned Stack of the Hovered Guide's First 4 Pages (Renders only when images exist) */}
          {anyDesktopImagesExist && (
            <div className="hidden lg:block lg:col-span-5 sticky top-24 pt-2">
              {activeImages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-ink-muted mb-2">
                    <span>
                      {activeGuide.num} · {activeGuide.moduleName} ({activeGuide.pages} pp)
                    </span>
                    <span>First {Math.min(4, activeImages.length)} sample pages</span>
                  </div>
                  <GuideFannedStack
                    guide={activeGuide}
                    images={activeImages}
                    maxPages={4}
                    eagerFirst
                    onOpenLightbox={(idx) => setDesktopLightboxIdx(idx)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Honest Fact Line */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ink-muted">
          <span>
            222 pages total across 4 guides · Academic IELTS · Original exam-style practice
          </span>
          <span>
            PDF only · Listening has full scripts (no audio recordings) · Personal study licence
          </span>
        </div>

        {/* Bundle Builder Bar */}
        <div className="mt-8">
          <GuidesBundleBar
            selectedIds={selectedBundleIds}
            onToggleId={toggleBundleId}
            onWaAction={onWaAction}
          />
        </div>

        {/* Bottom Link to /guides */}
        <div className="mt-6 flex items-center justify-between">
          <a
            href="/guides"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToGuides();
            }}
            className="inline-flex items-center gap-2 font-serif text-lg text-ink hover:text-violet-pen underline underline-offset-4"
          >
            <span>See everything inside every guide →</span>
          </a>
        </div>
      </div>

      {desktopLightboxIdx !== null && activeImages.length > 0 && (
        <GuideLightboxModal
          guide={activeGuide}
          images={activeImages}
          initialIndex={desktopLightboxIdx}
          onClose={() => setDesktopLightboxIdx(null)}
        />
      )}
    </section>
  );
}
