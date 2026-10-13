import React, { useRef, useState } from 'react';
import { SITE_CONFIG, wa, WaKeyword } from '../config';
import { GuideModuleId } from '../guidesConfig';
import { IconArrowUpRight } from './EditorialGraphics';
import {
  getLatestSavedStudentLead,
  saveStoredLocalLead,
  validateWhatsappPhone,
} from './FreeRescueModal';
import { MistakeDnaCardGenerator } from './MistakeDnaCard';
import { RedPen } from './RedPen';
import { EvaluatorTaskType, RedPenWritingShowcase } from './RedPenWritingShowcase';
import { HumanWritingCheckSection } from './HumanWritingCheckSection';

interface WritingCriterionResult {
  name: string;
  band: string;
  descriptorMatch: string;
  specificFeedback: string;
}

interface RedPenUpgradeItem {
  originalSentence: string;
  whyItLosesMarks: string;
  band75Upgrade: string;
}

interface WritingEvaluationResult {
  overallBand: string;
  examinerVerdictHeadline: string;
  examinerSummaryNote: string;
  criteria: WritingCriterionResult[];
  redPenUpgrades: RedPenUpgradeItem[];
  priorityActionSteps: string[];
  recommendedNextStep: {
    offerTitle: string;
    reason: string;
    waKeyword: string;
  };
}

interface ScoreAdvisorResult {
  currentOverall: string;
  gapSummaryHeadline: string;
  primaryBottleneckModule: string;
  fastestGainModule: string;
  honestAssessment: string;
  fourteenDayFocus: string[];
  primaryRecommendation: {
    title: string;
    whyItFits: string;
    whatsappMessage: string;
  };
}

const SAMPLE_WRITING_DRAFTS: Record<
  'task2_intro' | 'task2_essay' | 'task1_report',
  { prompt: string; response: string }
> = {
  task2_intro: {
    prompt:
      'Some people believe that university education should be free for everyone, while others think students should pay for their own higher education. Discuss both views and give your own opinion.',
    response:
      'In this modern era of globalization, university education plays a vital role in every person life. Some people think that government should pay all tuition fees for university students, while other people believe that students must pay by themselves. In this essay, I will discuss both sides of this burning issue and give my opinion at the end.',
  },
  task2_essay: {
    prompt:
      'Some people think that governments should spend money on faster public transport, while others believe that there are more important priorities for public money. Discuss both views and give your own opinion.',
    response:
      'Nowadays, public transport is a very important topic in many countries. Some people argue that the government should invest a lot of money in high-speed trains and metro systems, while others think that money should go to healthcare and education first. In my opinion, I believe basic public services are more important than faster transport.\n\nFirstly, faster public transport has many benefits for the economy. When people can travel quickly between cities, they can find better jobs and businesses can grow faster. Moreover, if trains and buses are fast and comfortable, less people will drive their private cars, which reduces traffic jam and air pollution in big cities like Dhaka.\n\nOn the other hand, there are more urgent sectors that need government funding. In many developing countries, hospitals do not have enough beds or modern equipment, and many schools lack trained teachers. If citizens are sick or uneducated, they cannot benefit from a fast train. Therefore, spending millions of dollars on high-speed railways is a luxury when basic needs are not met.\n\nIn conclusion, although faster public transport is useful for commuters and the environment, I strongly believe that governments should prioritise healthcare and education first before building expensive transport networks.',
  },
  task1_report: {
    prompt:
      'The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    response:
      'The given bar chart illustrates how many households owned and rented their houses in England and Wales from 1918 to 2011.\n\nIn 1918, around 77% of families lived in rented accommodation, while only 23% owned their homes. Over the next decades, the percentage of rented houses went down steadily, and home ownership increased. By 1971, both figures became equal at 50% each.\n\nAfter 1971, the number of households in owned accommodation continued to rise and reached a peak of 69% in 2001, while rented accommodation dropped to 31%. However, in 2011, home ownership fell slightly to 64% and renting rose to 36%.',
  },
};

export function ExaminerDeskPage({
  onWaAction,
  onNavigateHome,
  onNavigateToGuides,
  onOpenRescueModal,
}: {
  onWaAction: (keywordOrMessage: WaKeyword | string) => void;
  onNavigateHome: (sectionHash?: string) => void;
  onNavigateToGuides: (moduleId?: GuideModuleId) => void;
  onOpenRescueModal: (source: string) => void;
}) {
  const [activeTool, setActiveTool] = useState<'writing' | 'advisor'>('writing');

  // Writing Evaluator State
  const [taskType, setTaskType] = useState<'task2_intro' | 'task2_essay' | 'task1_report'>('task2_essay');
  const [targetBand, setTargetBand] = useState<string>('7.0');
  const [promptQuestion, setPromptQuestion] = useState<string>('');
  const [studentResponse, setStudentResponse] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const isEvaluatingRef = useRef(false);
  const [writingError, setWritingError] = useState<string | null>(null);
  const [writingResult, setWritingResult] = useState<WritingEvaluationResult | null>(null);

  // Student Details for Writing Evaluation (Required & Saved to Google Sheet)
  const [fullName, setFullName] = useState<string>(() => {
    const saved = getLatestSavedStudentLead();
    return saved ? saved.fullName : '';
  });
  const [whatsappNumber, setWhatsappNumber] = useState<string>(() => {
    const saved = getLatestSavedStudentLead();
    return saved ? saved.normalizedWhatsapp : '';
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // 4-Module Score Advisor State
  const [listeningBand, setListeningBand] = useState('6.5');
  const [readingBand, setReadingBand] = useState('6.0');
  const [writingBand, setWritingBand] = useState('5.5');
  const [speakingBand, setSpeakingBand] = useState('6.0');
  const [advisorTargetBand, setAdvisorTargetBand] = useState('7.0');
  const [examTimeline, setExamTimeline] = useState('1–2 months');
  const [biggestStruggle, setBiggestStruggle] = useState('');
  const [isAdvising, setIsAdvising] = useState(false);
  const [advisorError, setAdvisorError] = useState<string | null>(null);
  const [advisorResult, setAdvisorResult] = useState<ScoreAdvisorResult | null>(null);

  const wordCount = studentResponse.trim()
    ? studentResponse.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const handleLoadSample = () => {
    const sample = SAMPLE_WRITING_DRAFTS[taskType];
    setPromptQuestion(sample.prompt);
    setStudentResponse(sample.response);
    setWritingError(null);
  };

  const handleRunWritingEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEvaluatingRef.current || isEvaluating) return;

    setNameError(null);
    setPhoneError(null);
    setWritingError(null);

    const trimmedName = fullName.trim();
    let hasValidationError = false;

    if (!trimmedName || trimmedName.length < 2) {
      setNameError('Please enter your full name.');
      hasValidationError = true;
    }

    const phoneValidation = validateWhatsappPhone(whatsappNumber);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || 'Please enter a valid WhatsApp number (e.g. 017XXXXXXXX).');
      hasValidationError = true;
    }

    if (wordCount < 15) {
      setWritingError('Please write or paste at least 15 words so the examiner can evaluate your sentences.');
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    isEvaluatingRef.current = true;
    setIsEvaluating(true);

    try {
      // Save lead locally for instant pre-fill on subsequent actions or PDF downloads
      saveStoredLocalLead({
        normalizedWhatsapp: phoneValidation.normalized,
        fullName: trimmedName,
        submittedAt: new Date().toISOString(),
      });

      const res = await fetch('/api/ai/writing-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: trimmedName,
          whatsappNumber: phoneValidation.display,
          taskType,
          promptQuestion,
          studentResponse,
          targetBand,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Could not evaluate your writing right now.');
      }
      setWritingResult(data.evaluation);
      setTimeout(() => {
        document.getElementById('examiner-report-card')?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } catch (err) {
      setWritingError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      isEvaluatingRef.current = false;
      setIsEvaluating(false);
    }
  };

  const handleRunScoreAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdvising(true);
    setAdvisorError(null);

    try {
      const res = await fetch('/api/ai/score-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listening: listeningBand,
          reading: readingBand,
          writing: writingBand,
          speaking: speakingBand,
          targetBand: advisorTargetBand,
          timeline: examTimeline,
          biggestStruggle,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Could not generate your study roadmap right now.');
      }
      setAdvisorResult(data.diagnosis);
      setTimeout(() => {
        document.getElementById('advisor-report-card')?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } catch (err) {
      setAdvisorError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsAdvising(false);
    }
  };

  return (
    <div className="bg-paper text-ink">
      {/* =====================================================================
          1. PAGE HEADER (Clean, calm editorial header matching /guides)
         ===================================================================== */}
      <section className="pt-10 sm:pt-14 pb-12 border-b border-rule">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="inline-flex items-center gap-2 font-mono text-xs text-ink-muted hover:text-ink transition-colors"
            >
              <span>←</span>
              <span>Back to main page</span>
            </a>

            <span className="font-mono text-[11px] uppercase tracking-widest text-examiner-red">
              Official IELTS Band Descriptors · Examiner Red-Pen Desk
            </span>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-serif text-display-hero font-normal text-ink">
              Find out why your score is stuck—with{' '}
              <RedPen type="underline" seed={0}>
                examiner-level precision.
              </RedPen>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-ink-muted leading-relaxed max-w-[62ch]">
              Check your Academic Writing against the four official IELTS marking criteria, or diagnose which module is holding your overall band score back.
            </p>
          </div>

          {/* Clean 2-Tool Switcher */}
          <div className="mt-9 pt-6 border-t border-rule flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTool('writing')}
              className={`min-h-[44px] px-5 py-2.5 font-mono text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap border ${
                activeTool === 'writing'
                  ? 'bg-ink text-paper border-ink font-medium'
                  : 'bg-surface-elevated text-ink-muted border-rule hover:border-ink hover:text-ink'
              }`}
            >
              01. Official IELTS Writing Evaluator
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('advisor')}
              className={`min-h-[44px] px-5 py-2.5 font-mono text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap border ${
                activeTool === 'advisor'
                  ? 'bg-ink text-paper border-ink font-medium'
                  : 'bg-surface-elevated text-ink-muted border-rule hover:border-ink hover:text-ink'
              }`}
            >
              02. 4-Module Score &amp; Roadmap Advisor
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          TOOL 01: OFFICIAL IELTS WRITING EVALUATOR
         ===================================================================== */}
      {activeTool === 'writing' && (
        <section className="py-14 sm:py-20 border-b border-rule">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* Left 4 Columns: Official Criteria Note */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 bg-ivory border border-rule">
                  <span className="block font-mono text-[11px] uppercase tracking-widest text-examiner-red mb-2">
                    How Your Draft Is Marked
                  </span>
                  <h2 className="font-serif text-2xl text-ink font-normal">
                    The 4 Official IELTS Writing Descriptors
                  </h2>
                  <p className="mt-2.5 text-sm text-ink-muted leading-relaxed">
                    Every IELTS examiner scores your writing equally across four criteria (25% each). A weak score in just one criterion pulls your entire Writing band down.
                  </p>

                  <div className="mt-5 pt-4 border-t border-rule divide-y divide-rule/70 text-xs">
                    <div className="py-3">
                      <div className="flex items-center justify-between font-mono text-ink font-medium">
                        <span>01. {taskType === 'task1_report' ? 'Task Achievement' : 'Task Response'}</span>
                        <span>25%</span>
                      </div>
                      <p className="mt-1 text-ink-muted leading-relaxed">
                        {taskType === 'task1_report'
                          ? 'Checks whether you included a clear Overview of main trends and supported key features with accurate data.'
                          : 'Checks whether you answered every part of the prompt with a clear, consistent position and extended support.'}
                      </p>
                    </div>

                    <div className="py-3">
                      <div className="flex items-center justify-between font-mono text-ink font-medium">
                        <span>02. Coherence &amp; Cohesion</span>
                        <span>25%</span>
                      </div>
                      <p className="mt-1 text-ink-muted leading-relaxed">
                        Checks paragraph unity, logical progression of ideas, and natural linking without mechanical "Firstly / Moreover" overuse.
                      </p>
                    </div>

                    <div className="py-3">
                      <div className="flex items-center justify-between font-mono text-ink font-medium">
                        <span>03. Lexical Resource</span>
                        <span>25%</span>
                      </div>
                      <p className="mt-1 text-ink-muted leading-relaxed">
                        Checks topic-specific vocabulary, natural collocations, and penalises memorised template clichés.
                      </p>
                    </div>

                    <div className="py-3">
                      <div className="flex items-center justify-between font-mono text-ink font-medium">
                        <span>04. Grammatical Range &amp; Accuracy</span>
                        <span>25%</span>
                      </div>
                      <p className="mt-1 text-ink-muted leading-relaxed">
                        Checks your mix of complex sentence structures and how many sentences are completely error-free.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-rule bg-surface-elevated">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                    Want to test it first?
                  </p>
                  <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
                    Load a realistic Band 6.0 student draft into the sheet, or inspect our interactive Red-Pen Before &amp; After example below.
                  </p>
                  <div className="mt-3 flex flex-col items-start gap-2">
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="font-mono text-xs text-violet-pen hover:text-ink underline underline-offset-4 cursor-pointer"
                    >
                      Load Band 6.0 sample draft →
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById('red-pen-sample-comparison')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                      className="font-mono text-xs text-ink-muted hover:text-ink underline underline-offset-4 cursor-pointer"
                    >
                      See interactive Band 6.0 → 7.5+ comparison ↓
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 8 Columns: Clean Submission Sheet */}
              <div id="writing-submission-sheet" className="lg:col-span-8 scroll-mt-20">
                <form
                  onSubmit={handleRunWritingEvaluation}
                  className="bg-surface-elevated border border-rule-strong p-6 sm:p-8"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-rule">
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted block">
                        Submission Sheet
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl text-ink font-normal mt-0.5">
                        Paste your IELTS Writing draft
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <label htmlFor="target-band-select" className="text-ink-muted">
                        Target Band:
                      </label>
                      <select
                        id="target-band-select"
                        value={targetBand}
                        onChange={(e) => setTargetBand(e.target.value)}
                        className="px-3 py-1.5 bg-paper border border-rule text-ink font-mono text-xs focus:outline-none focus:border-ink"
                      >
                        <option value="6.0">Band 6.0</option>
                        <option value="6.5">Band 6.5</option>
                        <option value="7.0">Band 7.0</option>
                        <option value="7.5">Band 7.5+</option>
                      </select>
                    </div>
                  </div>

                  {/* Task Type Selector */}
                  <div className="mt-6">
                    <label className="block font-mono text-xs text-ink-muted mb-2.5">
                      01. What are you submitting?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        {
                          id: 'task2_essay' as const,
                          title: 'Task 2 Full Essay',
                          sub: '250+ words recommended',
                        },
                        {
                          id: 'task2_intro' as const,
                          title: 'Task 2 Introduction',
                          sub: 'Paraphrase + Thesis (40–70 words)',
                        },
                        {
                          id: 'task1_report' as const,
                          title: 'Academic Task 1',
                          sub: 'Chart, graph, process or map',
                        },
                      ].map((option) => {
                        const selected = taskType === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setTaskType(option.id)}
                            className={`p-3.5 text-left border transition-colors cursor-pointer ${
                              selected
                                ? 'border-ink bg-ivory'
                                : 'border-rule bg-paper hover:border-rule-strong'
                            }`}
                          >
                            <span className="block font-mono text-xs font-medium text-ink">
                              {option.title}
                            </span>
                            <span className="block font-mono text-[11px] text-ink-muted mt-0.5">
                              {option.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prompt Question Input */}
                  <div className="mt-6">
                    <label
                      htmlFor="writing-prompt-input"
                      className="block font-mono text-xs text-ink-muted mb-2"
                    >
                      02. Essay / Task Question Prompt <span className="text-ink-subtle">(recommended for accurate Task Response grading)</span>
                    </label>
                    <textarea
                      id="writing-prompt-input"
                      rows={2}
                      value={promptQuestion}
                      onChange={(e) => setPromptQuestion(e.target.value)}
                      placeholder="Paste the IELTS Writing question here (e.g. Some people believe that university education should be free...)"
                      className="w-full p-3.5 bg-paper border border-rule text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink leading-relaxed"
                    />
                  </div>

                  {/* Student Response Input */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label
                        htmlFor="writing-response-input"
                        className="font-mono text-xs text-ink-muted"
                      >
                        03. Your Writing Draft
                      </label>
                      <span className="font-mono text-xs text-ink-muted tabular-nums">
                        {wordCount} {wordCount === 1 ? 'word' : 'words'}
                      </span>
                    </div>
                    <textarea
                      id="writing-response-input"
                      rows={taskType === 'task2_intro' ? 5 : 10}
                      value={studentResponse}
                      onChange={(e) => setStudentResponse(e.target.value)}
                      placeholder={
                        taskType === 'task2_intro'
                          ? 'Paste your Task 2 introduction paragraph here...'
                          : 'Paste your full essay or report here...'
                      }
                      className="w-full p-4 bg-paper border border-rule text-sm sm:text-base text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink leading-relaxed"
                    />
                  </div>

                  {/* 04. Student Details: Name & WhatsApp Number (Required & Stored to Google Sheet) */}
                  <div className="mt-6 pt-5 border-t border-rule">
                    <div className="mb-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="font-mono text-xs text-ink font-medium">
                          04. Your Name &amp; WhatsApp Number <span className="text-examiner-red">*</span>
                        </label>
                        <span className="font-mono text-[11px] text-ink-muted">
                          Official Evaluation Desk
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-ink-muted mt-1 leading-relaxed">
                        Enter your name and WhatsApp number below to generate your examiner report card and band breakdown.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <label
                          htmlFor="writing-student-name"
                          className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5"
                        >
                          Full Name <span className="text-examiner-red">*</span>
                        </label>
                        <input
                          id="writing-student-name"
                          type="text"
                          autoComplete="off"
                          required
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (nameError) setNameError(null);
                          }}
                          placeholder="Your Full Name"
                          className={`w-full min-h-[44px] px-3.5 py-2.5 bg-paper border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen transition-colors ${
                            nameError ? 'border-examiner-red' : 'border-rule'
                          }`}
                        />
                        {nameError && (
                          <p className="mt-1.5 font-mono text-xs text-examiner-red">
                            {nameError}
                          </p>
                        )}
                      </div>

                      {/* WhatsApp Number */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="writing-student-whatsapp"
                            className="block font-mono text-xs uppercase tracking-wider text-ink"
                          >
                            WhatsApp Number <span className="text-examiner-red">*</span>
                          </label>
                          <span className="font-mono text-[11px] text-ink-muted">
                            Bangladesh (+880) only
                          </span>
                        </div>
                        <div className="flex items-stretch">
                          <span className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-ivory border-y border-l border-rule text-ink font-mono text-xs select-none shrink-0 min-h-[44px]">
                            <span className="text-base leading-none" role="img" aria-label="Bangladesh flag">🇧🇩</span>
                            <span className="font-medium text-ink-muted">+880</span>
                          </span>
                          <input
                            id="writing-student-whatsapp"
                            type="tel"
                            inputMode="tel"
                            autoComplete="off"
                            required
                            value={whatsappNumber}
                            onChange={(e) => {
                              setWhatsappNumber(e.target.value);
                              if (phoneError) setPhoneError(null);
                            }}
                            placeholder="01XXXXXXXXX"
                            className={`w-full min-h-[44px] px-3.5 py-2.5 bg-paper border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen transition-colors tabular-nums font-mono ${
                              phoneError ? 'border-examiner-red' : 'border-rule'
                            }`}
                          />
                        </div>
                        {phoneError ? (
                          <p className="mt-1.5 font-mono text-xs text-examiner-red">
                            {phoneError}
                          </p>
                        ) : (
                          <p className="mt-1 font-mono text-[11px] text-ink-muted">
                            Active BD numbers only (013–019). No dummy/test numbers.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {writingError && (
                    <div className="mt-4 p-3.5 bg-ivory border border-examiner-red text-xs font-mono text-examiner-red">
                      {writingError}
                    </div>
                  )}

                  <div className="mt-6 pt-5 border-t border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="font-mono text-[11px] text-ink-muted">
                      Graded strictly on TR/TA · CC · LR · GRA descriptors.
                    </p>

                    <button
                      type="submit"
                      disabled={isEvaluating}
                      className="group/btn min-h-[48px] px-7 py-3.5 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover disabled:opacity-60 text-white text-sm sm:text-base font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <RedPen type="underline" seed={1} drawOnHover>
                        {isEvaluating
                          ? 'Examiner is marking your script…'
                          : 'Evaluate My Writing'}
                      </RedPen>
                      <IconArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* =================================================================
                EXAMINER EVALUATION REPORT CARD (Renders cleanly below when done)
               ================================================================= */}
            {writingResult && (
              <div
                id="examiner-report-card"
                className="mt-14 pt-12 border-t border-rule-strong scroll-mt-20"
              >
                <div className="bg-surface-elevated border border-rule-strong p-6 sm:p-10">
                  {/* Top Assessment Header */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b border-rule items-center">
                    <div className="lg:col-span-4 lg:border-r lg:border-rule lg:pr-8">
                      <span className="block font-mono text-[11px] uppercase tracking-widest text-examiner-red">
                        Official Descriptor Estimate
                      </span>
                      <div className="mt-2 flex items-baseline gap-3">
                        <span className="font-serif text-5xl sm:text-6xl text-ink font-medium tabular-nums">
                          Band {writingResult.overallBand}
                        </span>
                        <span className="font-mono text-xs text-ink-muted">
                          / Target {targetBand}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-[11px] text-ink-muted">
                        Calculated across all 4 official criteria
                      </p>
                    </div>

                    <div className="lg:col-span-8">
                      <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-1.5">
                        Examiner’s Overall Verdict
                      </span>
                      <h3 className="font-serif text-2xl sm:text-3xl text-ink font-normal">
                        {writingResult.examinerVerdictHeadline}
                      </h3>
                      <p className="mt-3 text-sm sm:text-base text-ink-muted leading-relaxed">
                        {writingResult.examinerSummaryNote}
                      </p>
                    </div>
                  </div>

                  {/* 4 Official Criteria Breakdown (2x2 Clean Hairline Grid) */}
                  <div className="py-8 border-b border-rule">
                    <h4 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-6">
                      01. Criterion-by-Criterion Band Breakdown
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {writingResult.criteria.map((crit, index) => (
                        <div
                          key={crit.name}
                          className="p-5 bg-paper border border-rule flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-rule">
                              <span className="font-mono text-xs font-medium text-ink">
                                0{index + 1}. {crit.name}
                              </span>
                              <RedPen
                                type="circle"
                                seed={index}
                                className="font-serif text-xl font-medium text-examiner-red px-2 py-0.5 tabular-nums"
                              >
                                Band {crit.band}
                              </RedPen>
                            </div>

                            <p className="mt-3 font-mono text-xs text-ink font-medium">
                              Descriptor match: {crit.descriptorMatch}
                            </p>
                            <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                              {crit.specificFeedback}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Examiner Red-Pen Sentence Upgrades */}
                  {writingResult.redPenUpgrades && writingResult.redPenUpgrades.length > 0 && (
                    <div className="py-8 border-b border-rule">
                      <h4 className="font-mono text-[11px] uppercase tracking-widest text-examiner-red mb-2">
                        02. Examiner Sentence-Level Review
                      </h4>
                      <p className="text-sm text-ink-muted mb-6">
                        {parseFloat(writingResult.overallBand) >= 8.0
                          ? 'Your sentences already satisfy high-band IELTS descriptors. Below are specific sentences from your script alongside alternative Band 9 stylistic variations:'
                          : 'Here is how a higher-band writer expresses your exact ideas without template clichés or grammar slips:'}
                      </p>

                      <div className="space-y-6">
                        {writingResult.redPenUpgrades.map((item, idx) => {
                          const isAlreadyHighBand = parseFloat(writingResult.overallBand) >= 8.0;
                          return (
                            <div
                              key={idx}
                              className="p-5 sm:p-6 bg-ivory border border-rule grid grid-cols-1 lg:grid-cols-12 gap-6"
                            >
                              <div className="lg:col-span-6">
                                <span className="font-mono text-[11px] uppercase tracking-wider text-examiner-red block mb-1.5">
                                  Your Sentence
                                </span>
                                <p
                                  className={`text-sm sm:text-base text-ink leading-relaxed ${
                                    isAlreadyHighBand
                                      ? ''
                                      : 'line-through decoration-examiner-red/70'
                                  }`}
                                >
                                  "{item.originalSentence}"
                                </p>
                                <p className="mt-2.5 font-mono text-xs text-ink-muted">
                                  <strong className="text-ink">
                                    {isAlreadyHighBand ? 'Examiner note:' : 'Why it loses marks:'}
                                  </strong>{' '}
                                  {item.whyItLosesMarks}
                                </p>
                              </div>

                              <div className="lg:col-span-6 lg:border-l lg:border-rule lg:pl-6">
                                <span className="font-mono text-[11px] uppercase tracking-wider text-violet-pen block mb-1.5">
                                  {isAlreadyHighBand
                                    ? 'Band 9 Stylistic Alternative'
                                    : 'Band 8.0+ Rewrite'}
                                </span>
                                <p className="font-serif text-base sm:text-lg text-ink leading-relaxed">
                                  "{item.band75Upgrade}"
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Top 3 Priority Action Steps */}
                  <div className="py-8 border-b border-rule">
                    <h4 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-4">
                      03. Three Priority Fixes Before Your Next Essay
                    </h4>
                    <ul className="divide-y divide-rule border-t border-rule text-sm sm:text-base text-ink">
                      {writingResult.priorityActionSteps.map((step, idx) => (
                        <li key={idx} className="py-3.5 flex items-baseline gap-3.5">
                          <span className="font-mono text-xs text-examiner-red tabular-nums shrink-0">
                            0{idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next Step Conversion Bridge — Dynamic Score-to-Sale Funnel */}
                  {(() => {
                    const lowestCriterion =
                      writingResult.criteria.length > 0
                        ? [...writingResult.criteria].sort(
                            (a, b) => ( parseFloat(a.band) || 6 ) - ( parseFloat(b.band) || 6 )
                          )[0]
                        : null;
                    const customScoreWaMessage = `Hi Jubayer, I just checked my ${
                      taskType === 'task1_report' ? 'Writing Task 1' : 'Writing Task 2'
                    } in the IELTS DECODED Evaluator. My estimated score is Band ${
                      writingResult.overallBand
                    } (Target: Band ${targetBand})${
                      lowestCriterion
                        ? `, and my lowest criterion is ${lowestCriterion.name} (Band ${lowestCriterion.band})`
                        : ''
                    }. I'd like to know how to fix this before my exam.`;

                    return (
                      <div className="pt-8 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                          <div className="lg:col-span-7">
                            <span className="block font-mono text-[11px] uppercase tracking-widest text-examiner-red mb-1.5">
                              Why Theory Alone Cannot Fix Writing · Action Step for Band {writingResult.overallBand} → {targetBand}
                            </span>
                            <h4 className="font-serif text-2xl text-ink font-normal">
                              {writingResult.recommendedNextStep.offerTitle}
                            </h4>
                            <p className="mt-2 text-sm sm:text-base text-ink-muted leading-relaxed">
                              {writingResult.recommendedNextStep.reason}
                            </p>
                            <div className="mt-4 p-3.5 bg-ivory border border-rule font-mono text-xs text-ink leading-relaxed">
                              <strong className="text-examiner-red uppercase">
                                50% PDF Fee Credit Guarantee:
                              </strong>{' '}
                              Start with the 65-page Writing Self-Prep Guide (BDT 499) or All-4 Bundle (BDT 1,499) today—if you join the 12-Week Batch (BDT 7,999) or 1-to-1 Crash Course (BDT 9,999) within 14 days,{' '}
                              <strong>50% of your PDF payment is deducted from your live course fee.</strong>
                            </div>
                          </div>

                          <div className="lg:col-span-5 flex flex-col gap-3 lg:items-end">
                            <a
                              href="#human-writing-check"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('human-writing-check')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="group/btn w-full min-h-[48px] px-6 py-3.5 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <RedPen type="underline" seed={0} drawOnHover>
                                Get My Essay Human-Checked by Jubayer — BDT 299
                              </RedPen>
                              <IconArrowUpRight className="w-4 h-4" />
                            </a>

                            <a
                              href={wa(customScoreWaMessage)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => onWaAction(customScoreWaMessage)}
                              className="w-full min-h-[44px] px-5 py-2.5 inline-flex items-center justify-center gap-2 border border-ink bg-paper hover:bg-ink hover:text-paper text-ink font-mono text-xs transition-colors whitespace-nowrap"
                            >
                              <span>Send Band {writingResult.overallBand} Result to WhatsApp</span>
                              <IconArrowUpRight className="w-3.5 h-3.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => onNavigateToGuides('writing')}
                              className="w-full min-h-[40px] px-4 py-2 inline-flex items-center justify-center gap-2 border border-rule bg-ivory hover:border-ink text-ink font-mono text-xs transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <span>Get Writing Self-Prep Guide (BDT 499)</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>

                        {/* Item 13, 14, 17: Mistake DNA Card + Send to Jubayer + Referral Share */}
                        <MistakeDnaCardGenerator
                          toolName="IELTS Writing Evaluator"
                          targetBand={targetBand}
                          currentBand={writingResult.overallBand}
                          bottleneckSkill={`Writing — ${
                            lowestCriterion ? lowestCriterion.name : 'Task Response & Cohesion'
                          }`}
                          topErrorType={
                            lowestCriterion
                              ? `${lowestCriterion.name} (Band ${lowestCriterion.band}): ${lowestCriterion.specificFeedback}`
                              : writingResult.recommendedNextStep.reason
                          }
                          kscTag="[K/S] Descriptor & Structure"
                          actionFix={
                            writingResult.priorityActionSteps[0] ||
                            'Fix your lowest-scoring criterion with targeted paragraph drills.'
                          }
                          referralPath="/writing-checker"
                        />

                        <p className="font-mono text-[11px] text-ink-muted">
                          AI estimate based on the public band descriptors. Individual results vary. Educational purposes only.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* =================================================================
                PAID SERVICE UPGRADE: HUMAN WRITING CHECK — BDT 299
                Placed immediately below the free AI Writing Examiner on /diagnostic
               ================================================================= */}
            <HumanWritingCheckSection
              initialPrompt={promptQuestion}
              initialResponse={studentResponse}
              initialTaskType={taskType}
              onNavigateHome={onNavigateHome}
            />

            {/* =================================================================
                INTERACTIVE RED-PEN BEFORE & AFTER WRITING SAMPLE SHOWCASE
               ================================================================= */}
            <RedPenWritingShowcase
              onOpenRescueModal={onOpenRescueModal}
              onNavigateToGuides={onNavigateToGuides}
              onNavigateHome={onNavigateHome}
              onLoadSampleIntoEvaluator={(
                selectedType: EvaluatorTaskType,
                samplePrompt: string,
                sampleDraft: string
              ) => {
                setTaskType(selectedType);
                setPromptQuestion(samplePrompt);
                setStudentResponse(sampleDraft);
                setWritingError(null);
                document
                  .getElementById('writing-submission-sheet')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
          </div>
        </section>
      )}

      {/* =====================================================================
          TOOL 02: 4-MODULE SCORE BOTTLENECK & STUDY ROADMAP ADVISOR
         ===================================================================== */}
      {activeTool === 'advisor' && (
        <section className="py-14 sm:py-20 border-b border-rule">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* Left 5 Columns: Explanation */}
              <div className="lg:col-span-5">
                <span className="block font-mono text-[11px] uppercase tracking-widest text-examiner-red mb-2">
                  4-Module Score Calculator &amp; Diagnostic
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-ink font-normal">
                  Find the fastest way to reach your{' '}
                  <RedPen type="underline" seed={2}>
                    target band.
                  </RedPen>
                </h2>
                <p className="mt-4 text-sm sm:text-base text-ink-muted leading-relaxed">
                  Students often waste months practising the wrong module. Reading and Listening can be raised quickly with question-type systems, while Writing and Speaking need sentence-level correction.
                </p>
                <p className="mt-3 text-sm sm:text-base text-ink-muted leading-relaxed">
                  Enter your current (or mock test) scores across all 4 modules to get a realistic 14-day focus plan and find out whether self-prep guides, the 12-Week Batch, or the 1-to-1 Crash Course fits your timeline.
                </p>
              </div>

              {/* Right 7 Columns: Clean Advisor Form */}
              <div className="lg:col-span-7">
                <form
                  onSubmit={handleRunScoreAdvisor}
                  className="bg-surface-elevated border border-rule-strong p-6 sm:p-8"
                >
                  <h3 className="font-serif text-2xl text-ink font-normal pb-4 border-b border-rule">
                    Your Current or Recent Mock Scores
                  </h3>

                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Listening', val: listeningBand, set: setListeningBand },
                      { label: 'Reading', val: readingBand, set: setReadingBand },
                      { label: 'Writing', val: writingBand, set: setWritingBand },
                      { label: 'Speaking', val: speakingBand, set: setSpeakingBand },
                    ].map((mod) => (
                      <div key={mod.label}>
                        <label className="block font-mono text-xs text-ink-muted mb-1.5">
                          {mod.label}
                        </label>
                        <select
                          value={mod.val}
                          onChange={(e) => mod.set(e.target.value)}
                          className="w-full p-2.5 bg-paper border border-rule font-mono text-sm text-ink tabular-nums focus:outline-none focus:border-ink"
                        >
                          {['4.5', '5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5'].map(
                            (b) => (
                              <option key={b} value={b}>
                                Band {b}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs text-ink-muted mb-1.5">
                        Target Overall Band
                      </label>
                      <select
                        value={advisorTargetBand}
                        onChange={(e) => setAdvisorTargetBand(e.target.value)}
                        className="w-full p-2.5 bg-paper border border-rule font-mono text-sm text-ink tabular-nums focus:outline-none focus:border-ink"
                      >
                        <option value="6.0">Band 6.0</option>
                        <option value="6.5">Band 6.5</option>
                        <option value="7.0">Band 7.0</option>
                        <option value="7.5">Band 7.5+</option>
                        <option value="8.0">Band 8.0+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-xs text-ink-muted mb-1.5">
                        Time Until Your Exam
                      </label>
                      <select
                        value={examTimeline}
                        onChange={(e) => setExamTimeline(e.target.value)}
                        className="w-full p-2.5 bg-paper border border-rule font-mono text-sm text-ink focus:outline-none focus:border-ink"
                      >
                        <option value="Under 3 weeks (Urgent)">Under 3 weeks (Urgent)</option>
                        <option value="1 month">Around 1 month</option>
                        <option value="2–3 months">2–3 months</option>
                        <option value="3+ months / Not booked yet">3+ months / Not booked yet</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block font-mono text-xs text-ink-muted mb-1.5">
                      Where do you feel most stuck right now? <span className="text-ink-subtle">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={biggestStruggle}
                      onChange={(e) => setBiggestStruggle(e.target.value)}
                      placeholder="e.g. Running out of time in Reading Passage 3, stuck at 6.0 in Writing Task 2..."
                      className="w-full p-3 bg-paper border border-rule text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink"
                    />
                  </div>

                  {advisorError && (
                    <div className="mt-4 p-3.5 bg-ivory border border-examiner-red text-xs font-mono text-examiner-red">
                      {advisorError}
                    </div>
                  )}

                  <div className="mt-6 pt-5 border-t border-rule flex justify-end">
                    <button
                      type="submit"
                      disabled={isAdvising}
                      className="group/btn min-h-[48px] px-7 py-3.5 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover disabled:opacity-60 text-white text-sm sm:text-base font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <RedPen type="underline" seed={2} drawOnHover>
                        {isAdvising
                          ? 'Building your study diagnosis…'
                          : 'Diagnose My Score Gap'}
                      </RedPen>
                      <IconArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Advisor Result Card */}
            {advisorResult && (
              <div
                id="advisor-report-card"
                className="mt-14 pt-12 border-t border-rule-strong scroll-mt-20"
              >
                <div className="bg-surface-elevated border border-rule-strong p-6 sm:p-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b border-rule items-center">
                    <div className="lg:col-span-4 lg:border-r lg:border-rule lg:pr-8">
                      <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                        Current Overall Band
                      </span>
                      <div className="mt-2 flex items-baseline gap-3">
                        <span className="font-serif text-5xl text-ink font-medium tabular-nums">
                          Band {advisorResult.currentOverall}
                        </span>
                        <span className="font-mono text-xs text-examiner-red">
                          → Target {advisorTargetBand}
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-8">
                      <h3 className="font-serif text-2xl sm:text-3xl text-ink font-normal">
                        {advisorResult.gapSummaryHeadline}
                      </h3>
                      <p className="mt-3 text-sm sm:text-base text-ink-muted leading-relaxed">
                        {advisorResult.honestAssessment}
                      </p>
                    </div>
                  </div>

                  <div className="py-8 border-b border-rule grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-ivory border border-rule">
                      <span className="block font-mono text-[11px] uppercase tracking-widest text-examiner-red">
                        Primary Score Bottleneck
                      </span>
                      <p className="mt-2 font-serif text-2xl text-ink">
                        {advisorResult.primaryBottleneckModule}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        This module is holding your overall band or sub-score requirement at risk.
                      </p>
                    </div>

                    <div className="p-5 bg-paper border border-rule">
                      <span className="block font-mono text-[11px] uppercase tracking-widest text-violet-pen">
                        Fastest Band Booster
                      </span>
                      <p className="mt-2 font-serif text-2xl text-ink">
                        {advisorResult.fastestGainModule}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        Fixing repeated question-type errors here gives you the quickest score jump.
                      </p>
                    </div>
                  </div>

                  <div className="py-8 border-b border-rule">
                    <h4 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-4">
                      Your Next 14 Days Priority Focus
                    </h4>
                    <ul className="divide-y divide-rule border-t border-rule text-sm sm:text-base text-ink">
                      {advisorResult.fourteenDayFocus.map((item, idx) => (
                        <li key={idx} className="py-3.5 flex items-baseline gap-3.5">
                          <span className="font-mono text-xs text-examiner-red tabular-nums shrink-0">
                            0{idx + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7">
                      <span className="block font-mono text-[11px] uppercase tracking-widest text-violet-pen mb-1.5">
                        Best-Fit IELTS DECODED Path
                      </span>
                      <h4 className="font-serif text-2xl text-ink font-normal">
                        {advisorResult.primaryRecommendation.title}
                      </h4>
                      <p className="mt-2 text-sm sm:text-base text-ink-muted leading-relaxed">
                        {advisorResult.primaryRecommendation.whyItFits}
                      </p>
                    </div>

                    <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
                      <a
                        href={wa(advisorResult.primaryRecommendation.whatsappMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          onWaAction(advisorResult.primaryRecommendation.whatsappMessage)
                        }
                        className="group/btn w-full sm:w-auto min-h-[48px] px-6 py-3.5 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover text-white text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        <RedPen type="underline" seed={1} drawOnHover>
                          Message Jubayer with My Score Plan
                        </RedPen>
                        <IconArrowUpRight className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          onOpenRescueModal('Diagnostic Desk - Download the Free Rescue Guide')
                        }
                        className="font-mono text-xs text-ink-muted hover:text-ink underline underline-offset-4 cursor-pointer py-1"
                      >
                        Or download the free 38-page Rescue Guide first →
                      </button>
                    </div>
                  </div>

                  {/* Item 13, 14, 17: Mistake DNA Card + Send to Jubayer + Referral Share */}
                  <MistakeDnaCardGenerator
                    toolName="IELTS Band Calculator & Bottleneck Advisor"
                    targetBand={advisorTargetBand}
                    currentBand={advisorResult.currentOverall}
                    bottleneckSkill={advisorResult.primaryBottleneckModule}
                    topErrorType={advisorResult.gapSummaryHeadline}
                    kscTag="[S] Score Gap Bottleneck"
                    actionFix={
                      advisorResult.fourteenDayFocus[0] ||
                      'Target your lowest sub-score first to unlock your overall band.'
                    }
                    examDate={examTimeline}
                    referralPath="/band-calculator"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =====================================================================
          BOTTOM STRIP: CLEAN LINKS TO SELF-PREP GUIDES & LIVE PROGRAMS
         ===================================================================== */}
      <section className="py-16 bg-ivory/60 border-b border-rule">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-rule">
            <div className="pt-4 md:pt-0 md:pr-6">
              <span className="font-mono text-[11px] uppercase tracking-widest text-examiner-red">
                Free PDF Diagnostic
              </span>
              <h3 className="mt-1.5 font-serif text-xl text-ink font-normal">
                38-Page Score Rescue Guide
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
                Includes the 10-minute diagnostic, before → after writing upgrades, and a 14-day study plan.
              </p>
              <button
                type="button"
                onClick={() => onOpenRescueModal('Diagnostic Desk Footer - Free Rescue Guide')}
                className="mt-3 font-mono text-xs text-ink font-medium underline underline-offset-4 hover:text-violet-pen cursor-pointer"
              >
                Download the Free Rescue Guide →
              </button>
            </div>

            <div className="pt-6 md:pt-0 md:px-6">
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                Self-Study System · BDT 499 / BDT 1,499 Bundle
              </span>
              <h3 className="mt-1.5 font-serif text-xl text-ink font-normal">
                Module Self-Prep Guides
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
                Step-by-step frameworks for Reading, Writing, Listening, and Speaking (BDT 499 each or BDT 1,499 for all 4 — Save BDT 500, plus 50% credit toward live courses).
              </p>
              <button
                type="button"
                onClick={() => onNavigateToGuides()}
                className="mt-3 font-mono text-xs text-ink font-medium underline underline-offset-4 hover:text-violet-pen cursor-pointer"
              >
                Explore the 4 Self-Prep Guides →
              </button>
            </div>

            <div className="pt-6 md:pt-0 md:pl-6">
              <span className="font-mono text-[11px] uppercase tracking-widest text-violet-pen">
                Live Coaching with Jubayer
              </span>
              <h3 className="mt-1.5 font-serif text-xl text-ink font-normal">
                12-Week Batch or 1-to-1 Crash Course
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
                Personal writing correction, weekly speaking sessions, and direct mentorship from Band 5.5/6.0 to 6.5 &amp; 7.0+.
              </p>
              <a
                href={wa('GENERAL')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onWaAction('GENERAL')}
                className="mt-3 inline-block font-mono text-xs text-ink font-medium underline underline-offset-4 hover:text-violet-pen"
              >
                Chat on WhatsApp ({SITE_CONFIG.whatsapp.displayNumber}) →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
