import React, { useState } from 'react';
import { GuideModuleId } from '../guidesConfig';
import { IconArrowUpRight } from './EditorialGraphics';
import { RedPen } from './RedPen';

export type EvaluatorTaskType = 'task2_essay' | 'task2_intro' | 'task1_report';

interface AnnotationItem {
  number: string;
  criterion: string;
  bandShift: string;
  flawText: string;
  redPenType: 'strike' | 'wavy';
  diagnosisTitle: string;
  examinerNote: string;
  upgradedText: string;
  upgradeReason: string;
}

interface WritingComparisonSample {
  id: EvaluatorTaskType;
  tabLabel: string;
  taskTitle: string;
  promptQuestion: string;
  beforeScoreSummary: string;
  afterScoreSummary: string;
  criteriaProgression: string[];
  beforeBridgeText: string;
  afterBridgeText: string;
  annotations: [AnnotationItem, AnnotationItem, AnnotationItem];
}

const WRITING_SAMPLES: WritingComparisonSample[] = [
  {
    id: 'task2_essay',
    tabLabel: '01 · Task 2 Body Paragraph',
    taskTitle: 'Academic Writing Task 2 · Opinion Essay Body Paragraph',
    promptQuestion:
      'Some people believe university education should be free for all students, regardless of financial background. To what extent do you agree or disagree?',
    beforeScoreSummary: 'Band 6.0 Student Draft',
    afterScoreSummary: 'Band 7.5+ Examiner Upgrade',
    criteriaProgression: [
      'Task Response: 6.0 → 7.5',
      'Coherence: 6.0 → 8.0',
      'Lexical: 6.0 → 7.5',
      'Grammar: 6.0 → 7.5',
    ],
    beforeBridgeText:
      ' When students do not pay any money, many non-serious learners enter classes and waste university seats. ',
    afterBridgeText:
      ' Without some personal financial stake, unmotivated applicants can crowd lecture halls and dilute resources meant for committed scholars. ',
    annotations: [
      {
        number: '01',
        criterion: 'Coherence & Task Response',
        bandShift: '6.0 → 8.0',
        flawText:
          'Nowadays in this modern era, education is a very burning issue and firstly I will discuss financial problems.',
        redPenType: 'strike',
        diagnosisTitle: 'Memorised cliché opener + mechanical linker',
        examinerNote:
          'Examiners immediately spot memorised openings ("burning issue", "modern era") and personal announcements ("firstly I will discuss"). Neither states a clear causal argument.',
        upgradedText:
          'Fully subsidising tuition for every applicant places an unsustainable fiscal burden on public budgets.',
        upgradeReason:
          'Opens directly with a clear, specific topic sentence that tells the examiner the exact economic argument of the paragraph.',
      },
      {
        number: '02',
        criterion: 'Lexical Resource',
        bandShift: '6.0 → 7.5',
        flawText:
          'For example, government has to spend a lot of money on rich students who can easily pay.',
        redPenType: 'wavy',
        diagnosisTitle: 'Informal spoken vocabulary + missing article',
        examinerNote:
          'Phrases like "a lot of money" and "rich students" sound conversational rather than academic, and "government" is missing the definite article ("the government").',
        upgradedText:
          'Specifically, funding affluent households diverts limited state revenue away from primary schools and need-based scholarships.',
        upgradeReason:
          'Replaces vague phrasing with natural academic collocations ("affluent households", "diverts limited state revenue", "need-based scholarships").',
      },
      {
        number: '03',
        criterion: 'Grammatical Range & Accuracy',
        bandShift: '6.0 → 7.5',
        flawText:
          'Which is why making university free for everyone is not a good idea for country economy.',
        redPenType: 'wavy',
        diagnosisTitle: 'Sentence fragment + noun-adjunct slip',
        examinerNote:
          'Starting a standalone sentence with "Which is why..." creates a grammatical fragment, and "country economy" lacks a possessive or adjective form.',
        upgradedText:
          'Targeted grants for low-income students are therefore far more equitable than universal fee waivers.',
        upgradeReason:
          'Closes with a complete, error-free comparative clause that reinforces the writer’s nuanced position.',
      },
    ],
  },
  {
    id: 'task2_intro',
    tabLabel: '02 · Task 2 Introduction',
    taskTitle: 'Academic Writing Task 2 · Discussion + Opinion Introduction',
    promptQuestion:
      'Some people believe that university education should be free for everyone, while others think students should pay for their own higher education. Discuss both views and give your own opinion.',
    beforeScoreSummary: 'Band 6.0 Student Draft',
    afterScoreSummary: 'Band 7.5+ Examiner Upgrade',
    criteriaProgression: [
      'Task Response: 6.0 → 8.0',
      'Coherence: 6.0 → 7.5',
      'Lexical: 6.0 → 7.5',
      'Grammar: 6.0 → 7.5',
    ],
    beforeBridgeText: ' ',
    afterBridgeText: ' ',
    annotations: [
      {
        number: '01',
        criterion: 'Lexical Resource (Opening Hook)',
        bandShift: '6.0 → 7.5',
        flawText:
          'In this modern era of globalization, university education plays a vital role in every person life.',
        redPenType: 'strike',
        diagnosisTitle: 'Empty memorised hook + missing possessive apostrophe',
        examinerNote:
          '"In this modern era of globalization" is the #1 overused template phrase in Bangladesh IELTS centres. It adds zero task relevance and contains a grammar error ("every person life").',
        upgradedText:
          'Whether higher education should be fully funded by the state or financed by students themselves remains a widely debated policy question.',
        upgradeReason:
          'Paraphrases the core tension of the prompt immediately in clean, natural academic English.',
      },
      {
        number: '02',
        criterion: 'Grammatical Range & Paraphrasing',
        bandShift: '6.0 → 7.5',
        flawText:
          'Some people think that government should pay all tuition fees, while other people believe students must pay by themselves.',
        redPenType: 'wavy',
        diagnosisTitle: 'Word-for-word prompt copying ("Some people / other people")',
        examinerNote:
          'Repeating "Some people think... while other people believe" mirrors the prompt structure too closely and misses an opportunity to show lexical range.',
        upgradedText:
          'Although universal tuition waivers can widen access to degree programmes,',
        upgradeReason:
          'Uses a subordinate concessive clause ("Although...") to acknowledge the first view concisely.',
      },
      {
        number: '03',
        criterion: 'Task Response (Clear Position)',
        bandShift: '6.0 → 8.0',
        flawText:
          'In this essay, I will discuss both sides of this burning issue and give my opinion at the end.',
        redPenType: 'strike',
        diagnosisTitle: 'Delayed thesis ("give my opinion at the end")',
        examinerNote:
          'Band 7+ Task Response requires a clear position throughout the essay. Telling the examiner to wait until the conclusion for your opinion holds Task Response down to Band 6.0.',
        upgradedText:
          'I believe that means-tested scholarships are a more sustainable solution than making university free for wealthy and low-income families alike.',
        upgradeReason:
          'States a specific, unmistakable position right in the introduction so the examiner sees a Band 7.5+ thesis immediately.',
      },
    ],
  },
  {
    id: 'task1_report',
    tabLabel: '03 · Task 1 Graph Overview',
    taskTitle: 'Academic Writing Task 1 · Line Graph Overview Paragraph',
    promptQuestion:
      'The line graph below shows the percentage of households with internet access in three countries between 2000 and 2020. Summarise the information by selecting and reporting the main features.',
    beforeScoreSummary: 'Band 6.0 Student Draft',
    afterScoreSummary: 'Band 7.5+ Examiner Upgrade',
    criteriaProgression: [
      'Task Achievement: 6.0 → 8.0',
      'Coherence: 6.0 → 7.5',
      'Lexical: 6.0 → 7.5',
      'Grammar: 6.0 → 7.5',
    ],
    beforeBridgeText: ' Both the UK and South Korea went up every year during the period. ',
    afterBridgeText:
      ' While South Korea consistently recorded the highest connectivity throughout the twenty-year period, ',
    annotations: [
      {
        number: '01',
        criterion: 'Task Achievement (Overview)',
        bandShift: '6.0 → 8.0',
        flawText:
          'Looking at the graph, we can see that internet users increased from 18% in 2000 to 94% in 2020.',
        redPenType: 'strike',
        diagnosisTitle: 'Data figures inside the Overview + personal pronoun',
        examinerNote:
          'An IELTS Task 1 Overview must summarise macro trends without quoting specific percentages ("18% to 94%"). Quoting raw numbers blurs the line between Overview and Body paragraphs.',
        upgradedText:
          'Overall, household internet adoption rose substantially across all three nations between 2000 and 2020.',
        upgradeReason:
          'Signals the overview clearly with "Overall," and captures the primary upward trajectory across all categories without dumping raw figures.',
      },
      {
        number: '02',
        criterion: 'Lexical Precision',
        bandShift: '6.0 → 7.5',
        flawText:
          'Also, Brazil had a very big jump in the last ten years of the chart.',
        redPenType: 'wavy',
        diagnosisTitle: 'Informal phrasal verbs ("went up", "very big jump")',
        examinerNote:
          'Describing statistical trends as a "very big jump" or "went up" restricts Lexical Resource to Band 6.0.',
        upgradedText:
          'Brazil experienced the most pronounced surge in the final decade,',
        upgradeReason:
          'Uses accurate statistical trend language ("experienced the most pronounced surge") appropriate for academic reporting.',
      },
      {
        number: '03',
        criterion: 'Grammatical Range (Comparison)',
        bandShift: '6.0 → 7.5',
        flawText:
          'And the difference between the three countries became much smaller at the end.',
        redPenType: 'wavy',
        diagnosisTitle: 'Loose "And..." sentence starter + basic comparison',
        examinerNote:
          'Chaining simple clauses with "Also..." and "And..." misses the opportunity to join contrasting trends into a single subordinate structure.',
        upgradedText:
          'narrowing the initial digital gap with the other two countries by 2020.',
        upgradeReason:
          'Attaches a non-finite participial clause ("narrowing the initial digital gap...") to synthesise two trends in one cohesive sentence.',
      },
    ],
  },
];

interface RedPenWritingShowcaseProps {
  onOpenRescueModal: (source: string) => void;
  onNavigateToGuides: (module?: GuideModuleId) => void;
  onNavigateHome: (sectionHash?: string) => void;
  onLoadSampleIntoEvaluator?: (
    taskType: EvaluatorTaskType,
    prompt: string,
    draftResponse: string
  ) => void;
}

export function RedPenWritingShowcase({
  onOpenRescueModal,
  onNavigateToGuides,
  onNavigateHome,
  onLoadSampleIntoEvaluator,
}: RedPenWritingShowcaseProps) {
  const [selectedSampleId, setSelectedSampleId] = useState<EvaluatorTaskType>('task2_essay');
  const [activeAnnotationIdx, setActiveAnnotationIdx] = useState<number>(0);

  const sample =
    WRITING_SAMPLES.find((item) => item.id === selectedSampleId) || WRITING_SAMPLES[0];
  const activeNote = sample.annotations[activeAnnotationIdx] || sample.annotations[0];

  const handleSelectSample = (id: EvaluatorTaskType) => {
    setSelectedSampleId(id);
    setActiveAnnotationIdx(0);
  };

  const fullBeforeParagraph = `${sample.annotations[0].flawText}${sample.beforeBridgeText}${sample.annotations[1].flawText} ${sample.annotations[2].flawText}`;

  return (
    <div
      id="red-pen-sample-comparison"
      className="mt-12 pt-12 border-t border-rule scroll-mt-20"
    >
      <div className="bg-surface-elevated border border-rule-strong p-5 sm:p-8">
        {/* 1. Header & 3-Task Interactive Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-rule">
          <div>
            <div className="font-mono text-[11px] text-ink-muted flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-examiner-red font-medium">
                INTERACTIVE RED-PEN CALIBRATION BENCHMARK
              </span>
              <span aria-hidden="true">·</span>
              <span>How Jubayer Marks Your Script</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Compare a real{' '}
              <RedPen type="wavy" seed={0}>
                Band 6.0 draft
              </RedPen>{' '}
              against its <span className="font-medium">Band 7.5+ upgrade</span>.
            </h3>
          </div>

          {/* Interactive Sample Switcher (Single-Line Segmented Control) */}
          <div
            role="tablist"
            aria-label="Writing Sample Type"
            className="flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 bg-paper border border-rule self-start lg:self-auto shrink-0"
          >
            {WRITING_SAMPLES.map((item) => {
              const isSelected = item.id === selectedSampleId;
              return (
                <button
                  key={item.id}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => handleSelectSample(item.id)}
                  className={`min-h-[38px] px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-ink text-paper font-medium'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-elevated'
                  }`}
                >
                  {item.tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Prompt & Unboxed Tabular Criterion Shift Bar */}
        <div className="py-3.5 border-b border-rule flex flex-col xl:flex-row xl:items-center justify-between gap-2 text-xs">
          <p className="text-ink-muted font-sans truncate" title={sample.promptQuestion}>
            <strong className="font-mono text-[11px] text-ink font-medium mr-2">PROMPT:</strong>
            <span className="italic">“{sample.promptQuestion}”</span>
          </p>

          <div className="font-mono text-[11px] text-ink tabular-nums flex flex-wrap items-center gap-x-2.5 gap-y-1 shrink-0">
            {sample.criteriaProgression.map((crit, idx) => (
              <React.Fragment key={crit}>
                {idx > 0 && (
                  <span className="text-ink-subtle select-none" aria-hidden="true">
                    ·
                  </span>
                )}
                <span>{crit}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 3. Side-by-Side Comparison Grid: Band 6.0 Draft vs Band 7.5+ Rewrite */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-5 items-stretch">
          {/* LEFT COLUMN: Band 6.0 Student Draft with clickable [01] [02] [03] RedPen marks */}
          <div className="bg-paper border border-rule p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-rule font-mono text-xs">
                <span className="text-examiner-red font-medium">
                  BEFORE · {sample.beforeScoreSummary}
                </span>
                <span className="text-ink-muted text-[11px]">
                  Click [01], [02], or [03] to inspect
                </span>
              </div>

              <p className="font-serif text-base sm:text-[17px] text-ink leading-relaxed">
                <button
                  type="button"
                  onClick={() => setActiveAnnotationIdx(0)}
                  className={`inline text-left cursor-pointer transition-colors px-1 py-0.5 -mx-0.5 ${
                    activeAnnotationIdx === 0
                      ? 'bg-examiner-red/12 text-ink'
                      : 'hover:bg-examiner-red/5 text-ink/90'
                  }`}
                >
                  <span className="font-mono text-[11px] text-examiner-red font-semibold mr-1 tabular-nums">
                    [01]
                  </span>
                  <RedPen type={sample.annotations[0].redPenType} seed={0}>
                    {sample.annotations[0].flawText}
                  </RedPen>
                </button>

                <span>{sample.beforeBridgeText}</span>

                <button
                  type="button"
                  onClick={() => setActiveAnnotationIdx(1)}
                  className={`inline text-left cursor-pointer transition-colors px-1 py-0.5 -mx-0.5 ${
                    activeAnnotationIdx === 1
                      ? 'bg-examiner-red/12 text-ink'
                      : 'hover:bg-examiner-red/5 text-ink/90'
                  }`}
                >
                  <span className="font-mono text-[11px] text-examiner-red font-semibold mr-1 tabular-nums">
                    [02]
                  </span>
                  <RedPen type={sample.annotations[1].redPenType} seed={1}>
                    {sample.annotations[1].flawText}
                  </RedPen>
                </button>{' '}

                <button
                  type="button"
                  onClick={() => setActiveAnnotationIdx(2)}
                  className={`inline text-left cursor-pointer transition-colors px-1 py-0.5 -mx-0.5 ${
                    activeAnnotationIdx === 2
                      ? 'bg-examiner-red/12 text-ink'
                      : 'hover:bg-examiner-red/5 text-ink/90'
                  }`}
                >
                  <span className="font-mono text-[11px] text-examiner-red font-semibold mr-1 tabular-nums">
                    [03]
                  </span>
                  <RedPen type={sample.annotations[2].redPenType} seed={2}>
                    {sample.annotations[2].flawText}
                  </RedPen>
                </button>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-rule/70 font-mono text-[11px] text-ink-muted flex flex-wrap items-center justify-between gap-2">
              <span>Verdict: Capped at Band 6.0 (3 preventable penalties)</span>
              {onLoadSampleIntoEvaluator && (
                <button
                  type="button"
                  onClick={() =>
                    onLoadSampleIntoEvaluator(
                      sample.id,
                      sample.promptQuestion,
                      fullBeforeParagraph
                    )
                  }
                  className="text-violet-pen hover:text-ink underline underline-offset-4 cursor-pointer whitespace-nowrap"
                >
                  Load this draft into evaluator ↑
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Band 7.5+ Upgraded Paragraph */}
          <div className="bg-paper border border-rule-strong p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-rule font-mono text-xs">
                <span className="text-ink font-medium">
                  AFTER ·{' '}
                  <RedPen type="underline" seed={1}>
                    {sample.afterScoreSummary}
                  </RedPen>
                </span>
                <span className="text-ink-muted text-[11px]">
                  Practical sentence-level fix
                </span>
              </div>

              <p className="font-serif text-base sm:text-[17px] text-ink leading-relaxed">
                <button
                  type="button"
                  onClick={() => setActiveAnnotationIdx(0)}
                  className={`inline text-left cursor-pointer transition-colors px-1 py-0.5 -mx-0.5 ${
                    activeAnnotationIdx === 0
                      ? 'bg-violet-pen/12 text-ink font-medium'
                      : 'hover:bg-violet-pen/5 text-ink'
                  }`}
                >
                  <span className="font-mono text-[11px] text-violet-pen font-semibold mr-1 tabular-nums">
                    [01]
                  </span>
                  {sample.annotations[0].upgradedText}
                </button>

                <span>{sample.afterBridgeText}</span>

                <button
                  type="button"
                  onClick={() => setActiveAnnotationIdx(1)}
                  className={`inline text-left cursor-pointer transition-colors px-1 py-0.5 -mx-0.5 ${
                    activeAnnotationIdx === 1
                      ? 'bg-violet-pen/12 text-ink font-medium'
                      : 'hover:bg-violet-pen/5 text-ink'
                  }`}
                >
                  <span className="font-mono text-[11px] text-violet-pen font-semibold mr-1 tabular-nums">
                    [02]
                  </span>
                  {sample.annotations[1].upgradedText}
                </button>{' '}

                <button
                  type="button"
                  onClick={() => setActiveAnnotationIdx(2)}
                  className={`inline text-left cursor-pointer transition-colors px-1 py-0.5 -mx-0.5 ${
                    activeAnnotationIdx === 2
                      ? 'bg-violet-pen/12 text-ink font-medium'
                      : 'hover:bg-violet-pen/5 text-ink'
                  }`}
                >
                  <span className="font-mono text-[11px] text-violet-pen font-semibold mr-1 tabular-nums">
                    [03]
                  </span>
                  {sample.annotations[2].upgradedText}
                </button>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-rule/70 font-mono text-[11px] text-ink flex items-center justify-between">
              <span>Verdict: Clear Band 7.5+ logic &amp; academic lexis</span>
              <span className="text-ink-muted">Zero memorised fluff</span>
            </div>
          </div>
        </div>

        {/* 4. Interactive Examiner Red-Pen Diagnosis Strip (01 · 02 · 03) */}
        <div className="mt-5 bg-ivory border border-rule p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3.5 border-b border-rule">
            <div className="font-mono text-xs text-ink flex flex-wrap items-center gap-2">
              <span className="text-examiner-red font-medium">EXAMINER MARGIN NOTE</span>
              <span aria-hidden="true">·</span>
              <span>{activeNote.criterion}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums font-medium">{activeNote.bandShift}</span>
            </div>

            <div className="flex items-center gap-1.5" role="tablist" aria-label="Select Red-Pen Note">
              {sample.annotations.map((ann, idx) => {
                const isSelected = idx === activeAnnotationIdx;
                return (
                  <button
                    key={ann.number}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveAnnotationIdx(idx)}
                    className={`min-h-[34px] px-3 py-1 font-mono text-xs tabular-nums transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                      isSelected
                        ? 'bg-ink text-paper border-ink font-medium'
                        : 'bg-paper text-ink-muted border-rule hover:text-ink'
                    }`}
                  >
                    Annotation {ann.number}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm leading-relaxed">
            <div>
              <p className="font-mono text-[11px] text-examiner-red mb-1">
                WHY [{activeNote.number}] LOST MARKS ({activeNote.diagnosisTitle}):
              </p>
              <p className="text-ink-muted">{activeNote.examinerNote}</p>
            </div>

            <div className="md:border-l md:border-rule md:pl-6">
              <p className="font-mono text-[11px] text-ink font-medium mb-1">
                HOW [{activeNote.number}] SCORES BAND 7.5+:
              </p>
              <p className="text-ink">{activeNote.upgradeReason}</p>
            </div>
          </div>
        </div>

        {/* 5. Dual-Conversion Action Bar (Course Enrollments + PDFs Both) */}
        <div className="mt-5 pt-4 border-t border-rule flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-ink-muted">
            <strong className="text-ink font-medium">Want this exact correction on every essay you write?</strong>{' '}
            Join live 1-to-1 or cohort coaching with Jubayer, or study our complete Writing PDF framework.
          </p>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateHome('#programs')}
              className="min-h-[42px] px-4 py-2 inline-flex items-center gap-2 bg-violet-pen hover:bg-violet-pen-hover text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>See Live Coaching Programs</span>
              <IconArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateToGuides('writing')}
              className="min-h-[42px] px-4 py-2 inline-flex items-center gap-1.5 bg-paper hover:bg-ink text-ink hover:text-paper border border-ink font-mono text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Writing PDF Guide (BDT 499)</span>
              <IconArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenRescueModal('Writing Evaluator Red-Pen Sample - Free Score Rescue PDF')
              }
              className="min-h-[42px] px-3 py-2 inline-flex items-center gap-1.5 text-xs font-mono text-ink hover:text-violet-pen underline underline-offset-4 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Free 38-Page Rescue PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
