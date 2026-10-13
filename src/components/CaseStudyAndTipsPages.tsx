import React, { useEffect, useState } from 'react';
import {
  buildReferralUrl,
  getWaUrl,
  trackSiteEvent,
  trackWaClick,
} from '../config';
import { BrandLogo } from './BrandLogo';
import { IconArrowUpRight } from './EditorialGraphics';
import { RedPen } from './RedPen';

export function CaseStudyPage() {
  useEffect(() => {
    document.title =
      'Band 6.0 to 7.5+ Writing Case Study (K/S/C Red-Pen Breakdown) | IELTS DECODED';
    trackSiteEvent('page_view', { page: '/case-study' });
  }, []);

  const referralUrl = buildReferralUrl('/case-study');

  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* Clean Back Link + Eyebrow Bar (No duplicate logo header) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rule">
          <a
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs text-ink-muted hover:text-ink transition-colors"
          >
            <span>←</span>
            <span>Back to main page</span>
          </a>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/writing-checker"
              className="font-mono text-xs uppercase tracking-wider text-ink hover:text-violet-pen px-3 py-1.5 border border-rule-strong"
            >
              Check My Writing Free →
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Send this Band 6.0 to 7.5+ IELTS Writing breakdown to a friend who needs Band 6.5+: ${referralUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackSiteEvent('referral_shared', {
                  page: '/case-study',
                  method: 'whatsapp_friend',
                })
              }
              className="font-mono text-xs text-violet-pen underline underline-offset-4"
            >
              Send to a friend who needs 6.5+ →
            </a>
          </div>
        </div>

        {/* Hero */}
        <div className="space-y-4 border-b border-rule pb-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-examiner-red">
              REAL TASK 2 RED-PEN CASE STUDY · [K / S / C] DIAGNOSTIC SYSTEM
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal leading-tight">
            How a Stuck{' '}
            <RedPen type="circle" seed={1}>
              Band 6.0
            </RedPen>{' '}
            Task 2 Essay Becomes{' '}
            <RedPen type="underline" seed={2}>
              Band 7.5+
            </RedPen>
          </h1>
          <p className="text-base sm:text-lg text-ink-muted max-w-3xl leading-relaxed">
            Most candidates think they need rarer vocabulary to break past Band 6.0. Below is a line-by-line breakdown showing how tagging and fixing{' '}
            <strong className="text-ink">[K] Knowledge</strong>,{' '}
            <strong className="text-ink">[S] Skill</strong>, and{' '}
            <strong className="text-ink">[C] Care</strong> mistakes transforms the exact same argument into a Band 7.5+ paragraph.
          </p>
        </div>

        {/* Prompt */}
        <div className="p-6 bg-ivory border border-rule-strong">
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted block">
            ACADEMIC WRITING TASK 2 PROMPT
          </span>
          <p className="mt-2 font-serif text-lg sm:text-xl text-ink leading-relaxed">
            “Some people believe that governments should invest more money in public transport rather than building new roads and highways. To what extent do you agree or disagree?”
          </p>
        </div>

        {/* Step 1: Before (Band 6.0) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-examiner-red font-medium">
              01 · BEFORE — THE BAND 6.0 DRAFT (WHAT THE STUDENT WROTE)
            </span>
            <span className="px-2.5 py-1 bg-examiner-red/10 border border-examiner-red text-examiner-red font-mono text-xs">
              Scored: TR 6.0 · CC 6.0 · LR 6.0 · GRA 6.0
            </span>
          </div>

          <div className="p-6 sm:p-8 bg-paper border-2 border-examiner-red/50 space-y-4 font-serif text-base sm:text-lg text-ink leading-relaxed">
            <p>
              “In this modern era of globalization, traffic congestion is a burning issue in every big city. Firstly, government should spend more money on public transport because it is very good for environment. Moreover, if more busses and trains are available, less people will use their private cars on a daily basis. Furthermore, building new highways only attracts more vehicles which does not solve the main problem at all.”
            </p>
          </div>
        </section>

        {/* Step 2: Red-Pen K/S/C Fixes */}
        <section className="space-y-4">
          <span className="font-mono text-xs uppercase tracking-widest text-ink font-medium block">
            02 · JUBAYER’S RED-PEN DIAGNOSIS — TAGGED BY [K] / [S] / [C]
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-ivory border border-rule-strong space-y-2">
              <span className="inline-block px-2 py-0.5 bg-examiner-red text-white font-mono text-[10px] uppercase tracking-wider">
                [K] KNOWLEDGE · MEMORISED CLICHÉ
              </span>
              <p className="font-mono text-xs text-examiner-red line-through">
                “In this modern era of globalization, traffic congestion is a burning issue…”
              </p>
              <p className="text-xs sm:text-sm text-ink leading-relaxed">
                <strong>Why it loses marks:</strong> Official Band 6/5 descriptors explicitly penalize memorised template openings that could be pasted into any essay. Replace with a direct topic claim tied to municipal budgets.
              </p>
            </div>

            <div className="p-5 bg-ivory border border-rule-strong space-y-2">
              <span className="inline-block px-2 py-0.5 bg-violet-pen text-white font-mono text-[10px] uppercase tracking-wider">
                [S] SKILL · MECHANICAL COHESION & UNDEVELOPED CLAIM
              </span>
              <p className="font-mono text-xs text-examiner-red line-through">
                “Firstly… very good for environment. Moreover… Furthermore…”
              </p>
              <p className="text-xs sm:text-sm text-ink leading-relaxed">
                <strong>Why it loses marks:</strong> Starting every sentence with a mechanical linker caps Coherence & Cohesion at Band 6.0, and “very good for environment” states a broad claim without explaining the causal mechanism.
              </p>
            </div>

            <div className="p-5 bg-ivory border border-rule-strong space-y-2">
              <span className="inline-block px-2 py-0.5 bg-ink text-paper font-mono text-[10px] uppercase tracking-wider">
                [C] CARE · COUNTABLE / UNCOUNTABLE DETERMINER SLIPS
              </span>
              <p className="font-mono text-xs text-examiner-red line-through">
                “government should… good for environment… busses… less people…”
              </p>
              <p className="text-xs sm:text-sm text-ink leading-relaxed">
                <strong>Why it loses marks:</strong> Missing articles (“the government”, “the environment”), spelling (“buses”), and using “less” instead of “fewer” with countable plural nouns (“fewer commuters”) drag GRA down to Band 6.0.
              </p>
            </div>

            <div className="p-5 bg-ivory border border-rule-strong space-y-2">
              <span className="inline-block px-2 py-0.5 bg-violet-pen text-white font-mono text-[10px] uppercase tracking-wider">
                [S] SKILL · MISSING CONCRETE ILLUSTRATION
              </span>
              <p className="font-mono text-xs text-examiner-red line-through">
                “…which does not solve the main problem at all.”
              </p>
              <p className="text-xs sm:text-sm text-ink leading-relaxed">
                <strong>Why it loses marks:</strong> Ends with a vague assertion instead of explaining induced demand—how wider highways fill back up within a few years unless high-capacity rail alternatives exist.
              </p>
            </div>
          </div>
        </section>

        {/* Step 3: After (Band 7.5+) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-violet-pen font-medium">
              03 · AFTER — THE DECODED BAND 7.5+ REWRITE
            </span>
            <span className="px-2.5 py-1 bg-violet-pen/10 border border-violet-pen text-violet-pen font-mono text-xs">
              Scored: TR 8.0 · CC 7.5 · LR 7.5 · GRA 8.0
            </span>
          </div>

          <div className="p-6 sm:p-8 bg-ivory border-2 border-ink space-y-4 font-serif text-base sm:text-lg text-ink leading-relaxed">
            <p>
              “Prioritising metro rail and dedicated bus corridors reduces urban congestion far more effectively than widening highways. When a single commuter train replaces hundreds of single-occupancy cars during peak hours, cities cut both tailpipe emissions and daily travel delays simultaneously. By contrast, adding extra highway lanes rarely delivers lasting relief; as driving becomes temporarily easier, more residents choose to commute by car until the new roads reach capacity again.”
            </p>
          </div>
          <p className="font-mono text-[11px] text-ink-muted">
            Notice: Zero obscure thesaurus words. Every sentence flows through cause-and-effect logic and natural referencing. Individual results vary. Educational purposes only.
          </p>
        </section>

        {/* Conversion CTA Box */}
        <div className="p-6 sm:p-8 border-2 border-ink bg-surface-elevated flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="font-mono text-[10px] uppercase tracking-widest text-examiner-red block">
              READY TO FIX YOUR OWN WRITING?
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-ink font-normal">
              Test Your Essay Free or Get the 65-Page Writing Guide (BDT 499)
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Run your own Task 2 draft through our free Writing Checker right now, or get the complete 65-page Writing Self-Prep Guide (BDT 499 — or all 4 guides for BDT 1,499) with a 50% fee credit toward our 12-Week Live Batch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href="/writing-checker"
              className="min-h-[46px] px-5 py-3 bg-ink hover:bg-ink-muted text-paper font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2"
            >
              <span>1. Check My Writing Free</span>
              <IconArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <a
              href={getWaUrl(
                'Hi Jubayer, I just read the /case-study breakdown and want the 65-Page Writing Self-Prep Guide (BDT 499) / Complete 4-Guide Bundle (BDT 1,499).'
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWaClick('CASE_STUDY_BOTTOM_CTA')}
              className="min-h-[46px] px-5 py-3 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2"
            >
              <span>2. Get Writing Guide (BDT 499)</span>
              <IconArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

interface MistakeTipItem {
  id: string;
  weekLabel: string;
  module: 'Writing' | 'Reading' | 'Speaking' | 'Listening';
  kscLabel: '[K] Knowledge' | '[S] Skill' | '[C] Care';
  title: string;
  summary: string;
  beforeText: string;
  afterText: string;
  whyItWorks: string;
  toolLink: string;
  toolLabel: string;
  guideName: string;
  guidePages: number;
}

const MISTAKE_OF_THE_WEEK_ITEMS: MistakeTipItem[] = [
  {
    id: 'task2-memorised-intro',
    weekLabel: 'Mistake #01 · Writing Task 2',
    module: 'Writing',
    kscLabel: '[K] Knowledge',
    title: 'Using "In this modern era of globalization" & Deferring Your Opinion',
    summary:
      'Why generic 4-sentence introductions cap Task Response at Band 6.0—and how a 2-sentence thesis locks in Band 7.5+ clarity.',
    beforeText:
      '“Nowadays technology is a burning issue all over the world. Some people think it is beneficial while others disagree. This essay will discuss both views and give my opinion in the conclusion.”',
    afterText:
      '“Although remote work tools allow companies to hire across borders, they often blur the boundary between office hours and personal rest. I argue that employers must enforce strict offline hours so productivity gains do not lead to staff burnout.”',
    whyItWorks:
      'Band 7+ Task Response requires a clear position throughout the essay—not hidden until the final paragraph.',
    toolLink: '/writing-checker',
    toolLabel: 'Test Your Task 2 Intro on the Free Writing Checker',
    guideName: 'Writing Self-Prep Guide',
    guidePages: 65,
  },
  {
    id: 'reading-tfng-qualifier-trap',
    weekLabel: 'Mistake #02 · Reading T/F/NG',
    module: 'Reading',
    kscLabel: '[S] Skill',
    title: 'Confusing FALSE with NOT GIVEN When Nouns Match',
    summary:
      'How examiners use frequency and comparison qualifiers ("mainly", "more than", "all") to trap students who only match keywords.',
    beforeText:
      'Passage: “The scholarship funded 120 postgraduate engineers, several of whom later joined renewable energy firms.” Statement: “Most scholarship recipients went on to work in renewable energy.” -> Student picks FALSE.',
    afterText:
      'Decoded Fix: “Several” neither proves “Most” (>50%) nor proves that fewer than 50% joined later. Because the exact proportion is absent -> NOT GIVEN.',
    whyItWorks:
      'Separating contradiction (FALSE) from missing comparison data (NOT GIVEN) saves 6–8 minutes across Passages 2 and 3.',
    toolLink: '/diagnostic',
    toolLabel: 'Diagnose Your Reading & 4-Module Score Gap',
    guideName: 'Reading Self-Prep Guide',
    guidePages: 48,
  },
  {
    id: 'speaking-part2-45s-freeze',
    weekLabel: 'Mistake #03 · Speaking Part 2 & 3',
    module: 'Speaking',
    kscLabel: '[S] Skill',
    title: 'Answering Cue-Card Bullet Points Like 4 Short Questions',
    summary:
      'Why ticking off the printed bullets makes you run out of ideas at 45 seconds—and how the Past-Turning Point-Present arc fills 2 minutes effortlessly.',
    beforeText:
      '“I want to talk about a skill I learned. It is cooking. I learned it from my mother during lockdown. It is very useful because I can make food myself.” (Stops speaking at 0:38)',
    afterText:
      '“Before university, I relied entirely on takeaway meals, which drained my budget. Everything changed during my second semester when my flatmate taught me how to batch-cook three staple Bengali dishes—a habit that still saves me five hours every week…”',
    whyItWorks:
      'Moving from Past Context -> Specific Moment -> Present Impact naturally triggers past, past-continuous, and present-perfect tenses (boosting GRA to Band 7.5+).',
    toolLink: '/study-plan',
    toolLabel: 'Build Your Custom Speaking & 4-Module Study Plan',
    guideName: 'Speaking Self-Prep Guide',
    guidePages: 59,
  },
  {
    id: 'listening-part3-first-mention-trap',
    weekLabel: 'Mistake #04 · Listening Part 3 & 4',
    module: 'Listening',
    kscLabel: '[C] Care',
    title: 'Writing Down the First Option Mentioned in Part 3 Multiple Choice',
    summary:
      'In Academic Discussions, speakers mention all 3 options A, B, and C within 15 seconds. Learn to wait for the contrast pivot.',
    beforeText:
      'Audio: “Shall we focus our presentation on coastal flooding?” “Dr. Patel said last year’s group covered that thoroughly, so we’d better examine urban drainage instead.” -> Student picks A: Coastal flooding.',
    afterText:
      'Decoded Fix: Hear the rejection signal (“covered that thoroughly, so we’d better…”) -> Lock in Option B: Urban drainage.',
    whyItWorks:
      'Eliminating premature answers in Part 3 adds 4–5 raw marks—often jumping Listening from Band 6.5 straight to Band 7.5.',
    toolLink: '/study-plan',
    toolLabel: 'Build Your Custom Listening & Reading Study Plan',
    guideName: 'Listening Self-Prep Guide',
    guidePages: 50,
  },
];

export function TipsHubPage() {
  const [selectedModule, setSelectedModule] = useState<string>('All');
  const [activeTipId, setActiveTipId] = useState<string>(
    MISTAKE_OF_THE_WEEK_ITEMS[0].id
  );

  const activeTip =
    MISTAKE_OF_THE_WEEK_ITEMS.find((t) => t.id === activeTipId) ||
    MISTAKE_OF_THE_WEEK_ITEMS[0];

  useEffect(() => {
    document.title = `${activeTip.title} — Mistake of the Week | IELTS DECODED`;
    trackSiteEvent('page_view', { page: '/tips', tipId: activeTip.id });
  }, [activeTip]);

  const filteredTips =
    selectedModule === 'All'
      ? MISTAKE_OF_THE_WEEK_ITEMS
      : MISTAKE_OF_THE_WEEK_ITEMS.filter((t) => t.module === selectedModule);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Clean Back Link + Eyebrow Bar (No duplicate logo header) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-rule">
          <a
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs text-ink-muted hover:text-ink transition-colors"
          >
            <span>←</span>
            <span>Back to main page</span>
          </a>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/case-study"
              className="font-mono text-xs uppercase tracking-wider text-ink hover:text-violet-pen px-3 py-1.5 border border-rule-strong"
            >
              Read Band 6.0 → 7.5+ Case Study →
            </a>
            <a
              href="/guides"
              className="font-mono text-xs uppercase tracking-wider text-ink hover:text-violet-pen px-3 py-1.5 border border-rule-strong"
            >
              Self-Prep Guides (BDT 499) →
            </a>
          </div>
        </div>

        <div className="border-b border-rule pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-examiner-red block">
              MISTAKE OF THE WEEK HUB · BEFORE & AFTER [K / S / C] FIXES
            </span>
            <h1 className="mt-2 font-serif text-3xl sm:text-5xl text-ink font-normal">
              Fix One Score-Killing{' '}
              <RedPen type="underline" seed={3}>
                Mistake
              </RedPen>{' '}
              in 3 Minutes
            </h1>
            <p className="mt-3 text-base text-ink-muted max-w-2xl">
              Every lesson below isolates one real Band 6.0 mistake, tags it as{' '}
              <strong className="text-ink">[K] Knowledge</strong>,{' '}
              <strong className="text-ink">[S] Skill</strong>, or{' '}
              <strong className="text-ink">[C] Care</strong>, shows the exact Band 7.5+ fix, and links straight to the matching free diagnostic tool.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Writing', 'Reading', 'Speaking', 'Listening'].map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => setSelectedModule(mod)}
                className={`px-3.5 py-2 font-mono text-xs uppercase tracking-wider border cursor-pointer transition-colors ${
                  selectedModule === mod
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-paper text-ink border-rule-strong hover:border-ink'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        {/* List + Detail Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left List View */}
          <div className="lg:col-span-5 space-y-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted block">
              SELECT A LESSON ({filteredTips.length} AVAILABLE)
            </span>
            {filteredTips.map((tip) => {
              const isSelected = tip.id === activeTip.id;
              return (
                <button
                  key={tip.id}
                  type="button"
                  onClick={() => setActiveTipId(tip.id)}
                  className={`w-full text-left p-5 border transition-colors cursor-pointer block ${
                    isSelected
                      ? 'bg-ivory border-2 border-ink'
                      : 'bg-paper border-rule hover:border-ink'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-examiner-red">
                      {tip.weekLabel}
                    </span>
                    <span className="px-2 py-0.5 bg-surface-elevated border border-rule font-mono text-[10px] text-ink">
                      {tip.kscLabel}
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-lg sm:text-xl text-ink font-normal">
                    {tip.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-ink-muted line-clamp-2">
                    {tip.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Detailed Template View */}
          <div className="lg:col-span-7">
            <article className="border-2 border-ink bg-paper p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-rule">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-examiner-red text-white font-mono text-xs uppercase">
                    {activeTip.kscLabel}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                    {activeTip.weekLabel}
                  </span>
                </div>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Send to a friend who needs 6.5+ in IELTS — ${activeTip.title}: ${buildReferralUrl('/tips')}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackSiteEvent('referral_shared', {
                      page: '/tips',
                      tipId: activeTip.id,
                    })
                  }
                  className="font-mono text-xs text-violet-pen underline underline-offset-4"
                >
                  Send to a friend who needs 6.5+ →
                </a>
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-ink font-normal">
                  {activeTip.title}
                </h2>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                  {activeTip.summary}
                </p>
              </div>

              {/* Before */}
              <div className="p-5 bg-examiner-red/5 border-l-4 border-examiner-red space-y-1.5">
                <span className="font-mono text-[11px] uppercase tracking-widest text-examiner-red block font-medium">
                  BAND 6.0 MISTAKE (BEFORE):
                </span>
                <p className="font-serif text-base text-ink leading-relaxed">
                  {activeTip.beforeText}
                </p>
              </div>

              {/* After */}
              <div className="p-5 bg-ivory border-l-4 border-violet-pen space-y-1.5">
                <span className="font-mono text-[11px] uppercase tracking-widest text-violet-pen block font-medium">
                  BAND 7.5+ DECODED FIX (AFTER):
                </span>
                <p className="font-serif text-base text-ink leading-relaxed">
                  {activeTip.afterText}
                </p>
              </div>

              {/* Why it works */}
              <div className="p-4 bg-surface-elevated border border-rule">
                <p className="text-xs sm:text-sm text-ink leading-relaxed">
                  <strong className="font-mono uppercase text-xs">Why This Fix Works: </strong>
                  {activeTip.whyItWorks}
                </p>
              </div>

              {/* Matching Tool Link + Guide Offer */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <a
                  href={activeTip.toolLink}
                  className="min-h-[44px] px-5 py-2.5 bg-ink hover:bg-ink-muted text-paper font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2"
                >
                  <span>{activeTip.toolLabel}</span>
                  <IconArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <a
                  href={getWaUrl(
                    `Hi Jubayer, I just read "${activeTip.title}" on /tips and want the ${activeTip.guidePages}-Page ${activeTip.guideName} (BDT 499).`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWaClick(`TIPS_GUIDE_${activeTip.module}`)}
                  className="min-h-[44px] px-5 py-2.5 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2"
                >
                  <span>
                    Get {activeTip.guideName} ({activeTip.guidePages}p · BDT 499)
                  </span>
                  <IconArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}
