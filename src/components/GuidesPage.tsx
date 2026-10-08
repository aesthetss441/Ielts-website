import React, { useState } from 'react';
import {
  GuideData,
  GuideModuleId,
  SELF_PREP_GUIDES,
  SELF_PREP_SERIES_FACTS,
} from '../guidesConfig';
import { SITE_CONFIG, buildGuidesBundleWaMessage, wa } from '../config';
import { IconArrowUpRight, IconFacebook } from './EditorialGraphics';
import { RedPen } from './RedPen';
import {
  GuideFannedStack,
  GuideLightboxModal,
  GuideSamplePageCard,
  useResolvedGuideImages,
} from './GuidePreviewSystem';
import { GuidesBundleBar } from './LandingSelfPrepSection';

/**
 * Single Product Block for one Self-Prep Guide on `/guides`
 * - Alternating layout on desktop
 * - Large real cover image (page 1 of the PDF) when uploaded; skipped silently if not yet uploaded
 * - Title, subtitle, price, "Get on WhatsApp"
 * - "What's inside" grouped contents as a hairline table (START HERE · THE TEST · SKILLS · PRACTICE · REVIEW · NEXT STEP) with stats in mono
 * - "What makes it different": 3 relevant points
 * - "Look inside" gallery with the 7 screenshots (fanned stack + full-screen viewer with zoom, arrows, swipe, keyboard, "Page 21 of 65" counter, caption per page); hidden if no images yet
 */
function GuideProductBlock({
  guide,
  index,
  onWaAction,
}: {
  guide: GuideData;
  index: number;
  onWaAction: (messageText: string) => void;
}) {
  const { images } = useResolvedGuideImages(guide);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const coverImage = images.find((img) => img.page === 1) || images[0] || null;
  const isReversed = index % 2 === 1;

  return (
    <article
      id={`guide-${guide.id}`}
      className="py-16 sm:py-24 border-b border-rule scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header + Cover Image (Alternating Layout when cover image exists) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Cover Column (if cover screenshot is uploaded) */}
          {coverImage && (
            <div
              className={`lg:col-span-4 ${
                isReversed ? 'lg:order-2' : 'lg:order-1'
              }`}
            >
              <div className="max-w-[280px] sm:max-w-[320px] mx-auto lg:mx-0">
                <GuideSamplePageCard
                  image={coverImage}
                  eager={index === 0}
                  onClick={() => setLightboxIdx(0)}
                  showCaptionBar
                />
              </div>
            </div>
          )}

          {/* Details & "What's inside" Hairline Table Column */}
          <div
            className={`${
              coverImage ? 'lg:col-span-8' : 'lg:col-span-12'
            } ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-ink-muted pb-3 border-b border-rule">
              <span>
                {guide.num} · {guide.moduleName.toUpperCase()} SELF-PREP GUIDE · {guide.pages} PAGES
              </span>
              <span>Academic IELTS · Standalone PDF</span>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <h2 className="font-serif text-display-section font-normal text-ink">
                  {guide.num} · {guide.moduleName}{' '}
                  <span className="text-ink-subtle font-light">({guide.pages} pages)</span>
                </h2>
                <p className="mt-2 text-base sm:text-lg text-ink-muted max-w-[62ch]">
                  {guide.subtitle}
                </p>
              </div>

              <div className="flex sm:flex-col sm:items-end justify-between items-center gap-3 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-rule">
                <div className="font-mono text-left sm:text-right">
                  <span className="block text-[10px] uppercase tracking-wider text-ink-subtle">
                    Single Guide Price
                  </span>
                  <span className="font-serif text-3xl text-ink font-medium tabular-nums">
                    BDT {guide.priceBdt}
                  </span>
                </div>

                <a
                  href={wa(guide.whatsAppSingleText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onWaAction(guide.whatsAppSingleText)}
                  className="group/btn min-h-[46px] px-5 py-3 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <RedPen type="underline" seed={index} drawOnHover>
                    Get on WhatsApp
                  </RedPen>
                  <IconArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* "What's inside" Hairline Table */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                  What’s inside ({guide.pages} pages)
                </h3>
                <span className="font-mono text-[11px] text-ink-subtle tabular-nums">
                  {guide.rowStatsMono}
                </span>
              </div>

              <div className="border-t border-rule divide-y divide-rule">
                {guide.contentsTable.map((row) => (
                  <div
                    key={row.category}
                    className="py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline"
                  >
                    <div className="sm:col-span-3 font-mono text-xs font-semibold text-ink tracking-wider">
                      {row.category}
                    </div>
                    <div className="sm:col-span-6 text-sm text-ink-muted leading-relaxed">
                      {row.details}
                    </div>
                    <div className="sm:col-span-3 font-mono text-[11px] text-ink sm:text-right tabular-nums">
                      {row.monoStats}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* "What makes it different": 3 relevant points */}
            <div className="mt-10 pt-8 border-t border-rule">
              <h3 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-4">
                What makes the {guide.moduleName} guide different
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {guide.whatMakesItDifferent.map((pt, i) => (
                  <div key={pt.title} className="border-t border-rule/80 pt-3">
                    <span className="font-mono text-[10px] text-violet-pen tabular-nums block mb-1">
                      0{i + 1}
                    </span>
                    <h4 className="font-serif text-lg text-ink font-normal leading-snug">
                      {pt.title}
                    </h4>
                    <p className="mt-1.5 text-xs sm:text-sm text-ink-muted leading-relaxed">
                      {pt.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* "Look inside" Gallery (7 screenshots fanned stack + full-screen viewer; hidden if no images yet) */}
        {images.length > 0 && (
          <div className="mt-12 pt-8 border-t border-rule">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink font-semibold">
                Look inside · {guide.moduleName} Guide ({images.length} sample pages)
              </h3>
              <span className="font-mono text-[11px] text-ink-muted">
                Natural A4 pages · Click any page to open full-screen zoom viewer
              </span>
            </div>

            <GuideFannedStack
              guide={guide}
              images={images}
              maxPages={7}
              eagerFirst={index === 0}
              onOpenLightbox={(idx) => setLightboxIdx(idx)}
            />
          </div>
        )}
      </div>

      {lightboxIdx !== null && images.length > 0 && (
        <GuideLightboxModal
          guide={guide}
          images={images}
          initialIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </article>
  );
}

/**
 * Full `/guides` Product Page Component
 * Follows Section 6 structure:
 * 1. Opening statement
 * 2. "Which guide first?" chooser
 * 3. Four product blocks (Listening, Reading, Writing, Speaking)
 * 4. Bundle builder (also fixed to bottom of page on mobile as a slim bar)
 * 5. Honest comparison strip (Free Score Rescue vs Self-prep guides vs Programs)
 * 6. "Not for you if…" short list
 * 7. How to get it (3 steps)
 * 8. FAQ (section 7 questions) and final WhatsApp CTA
 */
export function GuidesPage({
  onWaAction,
  onNavigateHome,
  onOpenRescueModal,
}: {
  onWaAction: (messageText: string) => void;
  onNavigateHome: (sectionHash?: string) => void;
  onOpenRescueModal?: (source: string) => void;
}) {
  const [weakestChoice, setWeakestChoice] = useState<
    GuideModuleId | 'unknown'
  >('reading');
  const [selectedBundleIds, setSelectedBundleIds] = useState<GuideModuleId[]>([
    'reading',
    'writing',
    'speaking',
  ]);

  const toggleBundleId = (id: GuideModuleId) => {
    setSelectedBundleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedNames = SELF_PREP_GUIDES.filter((g) =>
    selectedBundleIds.includes(g.id)
  ).map((g) => g.moduleName);
  const mobileBundleMessage = buildGuidesBundleWaMessage(selectedNames);

  const recommendedGuide =
    weakestChoice === 'unknown'
      ? null
      : SELF_PREP_GUIDES.find((g) => g.id === weakestChoice) || SELF_PREP_GUIDES[1];

  return (
    <div className="pb-24 md:pb-0">
      {/* =====================================================================
          1. OPENING STATEMENT
         ===================================================================== */}
      <section className="pt-12 sm:pt-20 pb-16 border-b border-rule">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ink-muted mb-6">
            <span>
              {SELF_PREP_SERIES_FACTS.seriesTitle.toUpperCase()} · {SELF_PREP_SERIES_FACTS.edition.toUpperCase()}
            </span>
            <span>
              4 Standalone PDFs · {SELF_PREP_SERIES_FACTS.totalPages} Pages Total · BDT 499 Each
            </span>
          </div>

          <h1 className="font-serif text-display-hero font-normal text-ink max-w-4xl">
            You don’t need a course to study seriously. You need{' '}
            <RedPen type="double-underline" seed={0}>
              a method.
            </RedPen>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-ink-muted leading-relaxed max-w-[65ch]">
            The <strong className="text-ink font-medium">IELTS DECODED Self-Prep Series</strong> (First edition 2026) is a set of four standalone PDF guides for <strong className="text-ink font-medium">Academic IELTS</strong>—built for one student studying on their own, with no class or teacher needed. Every guide follows the same system: diagnose where marks are leaking, drill the specific skill, record the cause in an error log, and follow a 4-week study plan.
          </p>

          {/* Key Series Facts Rule */}
          <div className="mt-8 pt-6 border-t border-rule grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-ink">
            <div>
              <span className="block text-[10px] text-ink-subtle uppercase">PRICE &amp; BUNDLE</span>
              <span className="font-medium">
                BDT 499 per guide · Buy 3+ for bundle discount (confirmed on WhatsApp)
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-ink-subtle uppercase">100% ORIGINAL MATERIAL</span>
              <span className="text-ink-muted">
                Original exam-style practice written by Jubayer Siddiki (IELTS Overall 8).
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-ink-subtle uppercase">FORMAT &amp; LICENCE</span>
              <span className="text-ink-muted">
                PDF only (no video, no audio recordings). Licensed for personal study.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. "WHICH GUIDE FIRST?" INTERACTIVE CHOOSER
         ===================================================================== */}
      <section className="py-14 sm:py-16 border-b border-rule bg-ivory/60">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6">
              <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">
                Which guide first?
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-ink font-normal">
                My weakest skill is…
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Select a skill below to see where to start.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    { id: 'listening', label: 'Listening' },
                    { id: 'reading', label: 'Reading' },
                    { id: 'writing', label: 'Writing' },
                    { id: 'speaking', label: 'Speaking' },
                    { id: 'unknown', label: "I don't know" },
                  ] as const
                ).map((opt) => {
                  const active = weakestChoice === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setWeakestChoice(opt.id)}
                      className={`min-h-[40px] px-3.5 py-2 font-mono text-xs border transition-colors cursor-pointer ${
                        active
                          ? 'bg-ink text-paper border-ink font-medium'
                          : 'bg-paper text-ink border-rule hover:border-ink'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recommendation Output Box */}
            <div className="lg:col-span-6 bg-paper border border-rule-strong p-5 sm:p-6">
              {recommendedGuide ? (
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-examiner-red mb-1.5">
                    <span>RECOMMENDED STARTING POINT</span>
                    <span>BDT {recommendedGuide.priceBdt} · {recommendedGuide.pages} pages</span>
                  </div>
                  <h3 className="font-serif text-2xl text-ink font-normal">
                    {recommendedGuide.num} · {recommendedGuide.moduleName} Self-Prep Guide
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                    {recommendedGuide.oneLine}
                  </p>
                  <div className="mt-4 pt-4 border-t border-rule flex flex-wrap items-center gap-4">
                    <a
                      href={`#guide-${recommendedGuide.id}`}
                      className="font-mono text-xs text-ink font-medium underline underline-offset-4 hover:text-violet-pen"
                    >
                      Jump to {recommendedGuide.moduleName} details ↓
                    </a>
                    <a
                      href={wa(recommendedGuide.whatsAppSingleText)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onWaAction(recommendedGuide.whatsAppSingleText)}
                      className="font-mono text-xs text-violet-pen font-medium underline underline-offset-4"
                    >
                      Get {recommendedGuide.moduleName} on WhatsApp →
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-examiner-red mb-1.5">
                    <span>START WITH THE FREE DIAGNOSTIC</span>
                    <span>38 pages · Free instant download</span>
                  </div>
                  <h3 className="font-serif text-2xl text-ink font-normal">
                    IELTS Band 7+ Score Rescue (Free Guide)
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                    Take the 10-minute diagnostic in the free Score Rescue guide first to see which module is costing you the most marks before choosing a self-prep guide.
                  </p>
                  <div className="mt-4 pt-4 border-t border-rule flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenRescueModal) {
                          onOpenRescueModal('Guides Page - Free Score Rescue Guide');
                        } else {
                          onWaAction('RESCUE');
                        }
                      }}
                      className="font-mono text-xs text-violet-pen font-medium underline underline-offset-4 cursor-pointer"
                    >
                      Download the Free Rescue Guide →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. FOUR PRODUCT BLOCKS (One per guide, alternating layout)
         ===================================================================== */}
      {SELF_PREP_GUIDES.map((guide, idx) => (
        <GuideProductBlock
          key={guide.id}
          guide={guide}
          index={idx}
          onWaAction={onWaAction}
        />
      ))}

      {/* =====================================================================
          4. BUNDLE BUILDER SECTION
         ===================================================================== */}
      <section className="py-16 sm:py-20 border-b border-rule">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">
              Study Multiple Modules
            </span>
            <h2 className="font-serif text-display-section font-normal text-ink">
              Build your{' '}
              <RedPen type="underline" seed={2}>
                self-prep bundle
              </RedPen>
              .
            </h2>
            <p className="mt-2 text-sm sm:text-base text-ink-muted">
              BDT 499 per guide. Buy 3 or more guides and a bundle discount applies—confirmed directly on WhatsApp.
            </p>
          </div>

          <GuidesBundleBar
            selectedIds={selectedBundleIds}
            onToggleId={toggleBundleId}
            onWaAction={onWaAction}
          />
        </div>
      </section>

      {/* =====================================================================
          5. HONEST COMPARISON STRIP & 6. "NOT FOR YOU IF..."
         ===================================================================== */}
      <section className="py-16 sm:py-24 border-b border-rule">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">
              Honest Comparison
            </span>
            <h2 className="font-serif text-display-section font-normal text-ink">
              How the guides compare to our programs.
            </h2>
          </div>

          {/* 3-Column Honest Comparison Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-rule divide-y md:divide-y-0 md:divide-x divide-rule">
            <div className="py-6 md:pr-8 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-ink-muted">01 · FREE PDF</span>
                <h3 className="mt-2 font-serif text-2xl text-ink font-normal">
                  Free Score Rescue guide
                </h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                  <strong className="text-ink">Find your problem.</strong> 38-page diagnostic, mistake log, and 14-day plan to see where marks are leaking.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-rule/60">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenRescueModal) {
                      onOpenRescueModal('Guides Comparison - Free Score Rescue Guide');
                    } else {
                      onNavigateHome('#free-guide');
                    }
                  }}
                  className="font-mono text-xs text-ink hover:text-violet-pen underline underline-offset-4 cursor-pointer"
                >
                  Download the free Score Rescue guide →
                </button>
              </div>
            </div>

            <div className="py-6 md:px-8 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-violet-pen font-medium">
                  02 · BDT 499 EACH
                </span>
                <h3 className="mt-2 font-serif text-2xl text-ink font-normal">
                  Self-prep guides (BDT 499)
                </h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                  <strong className="text-ink">Study alone with a system.</strong> Standalone module workbooks (222 pages total) with drills, original practice, and self-marking rubrics.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-rule/60">
                <a
                  href="#guide-listening"
                  className="font-mono text-xs text-violet-pen font-medium underline underline-offset-4"
                >
                  Browse the 4 guides above ↑
                </a>
              </div>
            </div>

            <div className="py-6 md:pl-8 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-ink-muted">03 · LIVE MENTORSHIP</span>
                <h3 className="mt-2 font-serif text-2xl text-ink font-normal">
                  Live Programs
                </h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                  <strong className="text-ink">Personal correction and feedback.</strong> Live classes with Jubayer Siddiki, personal writing correction, and weekly speaking feedback.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-rule/60">
                <button
                  type="button"
                  onClick={() => onNavigateHome('#programs')}
                  className="font-mono text-xs text-ink hover:text-violet-pen underline underline-offset-4 cursor-pointer"
                >
                  See the live programs →
                </button>
              </div>
            </div>
          </div>

          {/* 6. "Not for you if..." Short Honest Box */}
          <div className="mt-10 p-5 sm:p-6 bg-ivory border border-rule">
            <h3 className="font-mono text-xs uppercase tracking-widest text-examiner-red font-semibold mb-3">
              These self-prep guides are NOT for you if…
            </h3>
            <ul className="space-y-2 text-sm sm:text-base text-ink-muted">
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-examiner-red shrink-0">×</span>
                <span>
                  <strong className="text-ink font-medium">You want a teacher to personally correct your essays or speaking:</strong> the guides give you self-marking rubrics and model comparisons for studying on your own, but personal feedback is only in our{' '}
                  <button
                    type="button"
                    onClick={() => onNavigateHome('#programs')}
                    className="text-ink underline underline-offset-4 hover:text-violet-pen cursor-pointer"
                  >
                    live programs
                  </button>
                  .
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-examiner-red shrink-0">×</span>
                <span>
                  <strong className="text-ink font-medium">You need audio recordings for Listening:</strong> the Listening guide is PDF-only and includes full scripts plus three ways to practise without audio, but no audio files.
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-examiner-red shrink-0">×</span>
                <span>
                  <strong className="text-ink font-medium">You are looking for past exam papers:</strong> every passage, script, prompt, and model answer is original exam-style practice written specifically for these guides.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. HOW TO GET IT (3 Steps)
         ===================================================================== */}
      <section className="py-16 sm:py-24 border-b border-rule">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">
              Instant WhatsApp Delivery
            </span>
            <h2 className="font-serif text-display-section font-normal text-ink">
              How to get your{' '}
              <RedPen type="underline" seed={1}>
                guides
              </RedPen>
              .
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-rule divide-y md:divide-y-0 md:divide-x divide-rule">
            <div className="py-6 md:pr-8">
              <span className="font-mono text-xs text-violet-pen tabular-nums">Step 01</span>
              <h3 className="mt-2 font-serif text-2xl text-ink font-normal">
                Message us on WhatsApp
              </h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                Tap any "Get on WhatsApp" button for a single guide (BDT 499) or use the bundle bar to select 3 or more guides.
              </p>
            </div>

            <div className="py-6 md:px-8">
              <span className="font-mono text-xs text-violet-pen tabular-nums">Step 02</span>
              <h3 className="mt-2 font-serif text-2xl text-ink font-normal">
                Payment details shared in chat
              </h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                We confirm your guide selection (and your bundle discount if you picked 3 or more) and share payment details directly in the WhatsApp chat.
              </p>
            </div>

            <div className="py-6 md:pl-8">
              <span className="font-mono text-xs text-violet-pen tabular-nums">Step 03</span>
              <h3 className="mt-2 font-serif text-2xl text-ink font-normal">
                Receive your PDF
              </h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                Your standalone PDF guide is sent directly to you in the chat so you can start the 10-minute diagnostic immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA on /guides */}
      <section className="py-20 sm:py-28 border-b border-rule bg-ivory/50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
                Start Studying With A System
              </span>
              <h2 className="font-serif text-display-hero font-normal text-ink">
                Ready to work through{' '}
                <RedPen type="underline" seed={3}>
                  your weakest module?
                </RedPen>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-ink-muted max-w-[58ch]">
                BDT 499 per guide, or pick 3+ for a bundle discount confirmed on WhatsApp.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col items-start lg:items-end">
              <a
                href={wa(mobileBundleMessage)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onWaAction(mobileBundleMessage)}
                className="group/btn w-full sm:w-auto min-h-[52px] px-8 py-4 inline-flex items-center justify-center gap-2.5 bg-violet-pen hover:bg-violet-pen-hover text-white text-base font-medium transition-colors whitespace-nowrap"
              >
                <RedPen type="underline" seed={0} drawOnHover>
                  Message on WhatsApp
                </RedPen>
                <IconArrowUpRight className="w-4 h-4" />
              </a>

              <p className="mt-3 font-mono text-xs text-ink-muted flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>WhatsApp: {SITE_CONFIG.whatsapp.displayNumber}</span>
                <span className="text-ink-subtle" aria-hidden="true">·</span>
                <a
                  href={SITE_CONFIG.founder.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-ink underline underline-offset-4 hover:text-violet-pen"
                >
                  <IconFacebook className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                </a>
                <span className="text-ink-subtle" aria-hidden="true">·</span>
                <span>Licensed for personal study.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Slim Fixed Bottom Bundle Bar on /guides */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper border-t border-rule-strong px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 font-mono">
            <p className="text-xs font-semibold text-ink truncate tabular-nums">
              {selectedNames.length === 0
                ? 'Self-Prep Guides · BDT 499'
                : `BDT 499 × ${selectedNames.length} (${selectedNames.join(', ')})`}
            </p>
            <p className="text-[10px] text-examiner-red truncate">
              {selectedNames.length >= 3
                ? 'Bundle discount, confirmed on WhatsApp'
                : 'Select 3+ guides for bundle discount'}
            </p>
          </div>

          <a
            href={wa(mobileBundleMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onWaAction(mobileBundleMessage)}
            className="min-h-[40px] px-4 py-2 inline-flex items-center gap-1.5 bg-violet-pen text-white font-mono text-xs font-medium whitespace-nowrap shrink-0"
          >
            <span>Get on WhatsApp</span>
            <IconArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
