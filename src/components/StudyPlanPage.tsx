import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SITE_CONFIG, wa, WaKeyword } from '../config';
import { GuideModuleId, SELF_PREP_GUIDES } from '../guidesConfig';
import {
  buildDeterministicStudyPlan,
  calculateDaysUntilExam,
  GeneratedStudyPlan,
  LISTENING_WEAKNESS_OPTIONS,
  ModuleId,
  PrepStatus,
  READING_WEAKNESS_OPTIONS,
  RESOURCE_OPTIONS,
  SPEAKING_WEAKNESS_OPTIONS,
  StudyFocusPreference,
  StudyPlanDayTask,
  StudyPlanProgressMap,
  StudyPlanQuestionnaireInput,
  TestType,
  WRITING_WEAKNESS_OPTIONS_ACADEMIC,
  WRITING_WEAKNESS_OPTIONS_GENERAL,
} from '../studyPlanEngine';
import {
  IconArrowDown,
  IconArrowUpRight,
  IconClose,
  IconPlusMinus,
} from './EditorialGraphics';
import {
  getLatestSavedStudentLead,
  saveStoredLocalLead,
  validateWhatsappPhone,
} from './FreeRescueModal';
import { MistakeDnaCardGenerator } from './MistakeDnaCard';
import { RedPen } from './RedPen';
import { downloadStudyPlanPdf } from '../utils/studyPlanPdfGenerator';

const STORAGE_PLAN_KEY = 'ielts_decoded_saved_study_plan_v2';
const STORAGE_PROGRESS_KEY = 'ielts_decoded_study_plan_progress_v2';

const BAND_SCORE_OPTIONS = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5'];
const TARGET_BAND_OPTIONS = ['6.0', '6.5', '7.0', '7.5', '8.0', '8.5'];
const DURATION_PRESETS = [
  { days: 20, label: '20 Days', sub: 'Intensive sprint' },
  { days: 30, label: '30 Days (1 Month)', sub: 'Focused turnaround' },
  { days: 45, label: '45 Days', sub: 'Balanced progression' },
  { days: 60, label: '60 Days (2 Months)', sub: 'Deep skill building' },
  { days: 90, label: '90 Days (3 Months)', sub: 'Complete mastery' },
];

const DEFAULT_QUESTIONNAIRE: StudyPlanQuestionnaireInput = {
  testType: 'academic',
  prepStatus: 'preparing',
  currentOverallBand: '6.0',
  targetOverallBand: '7.0',
  targetListeningBand: '7.5',
  targetReadingBand: '7.5',
  targetWritingBand: '7.0',
  targetSpeakingBand: '7.0',
  examDate: '',
  durationDays: 30,
  daysPerWeek: 6,
  focusPreference: 'weakness-priority',
  availableResources: ['cambridge_books', 'ielts_decoded_free_rescue'],
  currentListeningBand: '6.5',
  currentReadingBand: '6.0',
  currentWritingBand: '5.5',
  currentSpeakingBand: '6.0',
  notSureWeaknesses: false,
  listeningWeaknesses: ['Multiple-choice questions'],
  readingWeaknesses: ['True / False / Not Given', 'Matching headings'],
  writingWeaknesses: [
    'Task 2: understanding the prompt, planning, developing arguments, and writing relevant examples',
    'Coherence and Cohesion',
  ],
  speakingWeaknesses: ['Part 2 cue-card organization and idea development'],
  additionalNotes: '',
};

export function StudyPlanPage({
  onWaAction,
  onNavigateHome,
  onNavigateToGuides,
  onNavigateToDiagnostic,
  onOpenRescueModal,
}: {
  onWaAction: (keywordOrMessage: WaKeyword | string) => void;
  onNavigateHome: (sectionHash?: string) => void;
  onNavigateToGuides: (moduleId?: GuideModuleId) => void;
  onNavigateToDiagnostic: () => void;
  onOpenRescueModal: (source: string) => void;
}) {
  // Questionnaire vs Plan view state
  const [step, setStep] = useState<'stepA' | 'stepB' | 'stepC' | 'review'>('stepA');
  const [form, setForm] = useState<StudyPlanQuestionnaireInput>(DEFAULT_QUESTIONNAIRE);
  const [customDurationMode, setCustomDurationMode] = useState(false);
  const [customDurationInput, setCustomDurationInput] = useState('35');
  const [showSubBandTargets, setShowSubBandTargets] = useState(false);

  // Plan & Progress State
  const [plan, setPlan] = useState<GeneratedStudyPlan | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = window.localStorage.getItem(STORAGE_PLAN_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GeneratedStudyPlan;
        if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [progress, setProgress] = useState<StudyPlanProgressMap>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = window.localStorage.getItem(STORAGE_PROGRESS_KEY);
      if (saved) {
        return JSON.parse(saved) as StudyPlanProgressMap;
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [isEditingQuestionnaire, setIsEditingQuestionnaire] = useState<boolean>(() => !plan);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePhaseFilter, setActivePhaseFilter] = useState<number | 'all'>('all');
  const [activeModuleFilter, setActiveModuleFilter] = useState<ModuleId | 'all'>('all');
  const [expandedDayNumbers, setExpandedDayNumbers] = useState<number[]>([1, 2]);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Conditional Lead Capture Modal State for Study Plan PDF Download
  const [isPdfLeadModalOpen, setIsPdfLeadModalOpen] = useState(false);
  const [hasExistingLead, setHasExistingLead] = useState(false);
  const [leadFullName, setLeadFullName] = useState('');
  const [leadWhatsapp, setLeadWhatsapp] = useState('');
  const [leadNameError, setLeadNameError] = useState<string | null>(null);
  const [leadPhoneError, setLeadPhoneError] = useState<string | null>(null);

  const planTopRef = useRef<HTMLDivElement | null>(null);

  // Sync plan to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (plan) {
        window.localStorage.setItem(STORAGE_PLAN_KEY, JSON.stringify(plan));
      }
    } catch {
      // ignore storage errors
    }
  }, [plan]);

  // Sync progress to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage errors
    }
  }, [progress]);

  // Populate form from existing plan when editing
  const handleStartEditPlan = (targetStep: 'stepA' | 'stepB' | 'stepC' | 'review' = 'stepA') => {
    if (plan?.input) {
      setForm(plan.input);
      const isPreset = DURATION_PRESETS.some((p) => p.days === plan.input.durationDays);
      setCustomDurationMode(!isPreset);
      if (!isPreset) {
        setCustomDurationInput(String(plan.input.durationDays));
      }
    }
    setStep(targetStep);
    setIsEditingQuestionnaire(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle beginner pathway quick toggle
  const handleSelectPrepStatus = (status: PrepStatus) => {
    if (status === 'beginner') {
      setForm((prev) => ({
        ...prev,
        prepStatus: 'beginner',
        currentOverallBand: '',
        currentListeningBand: '',
        currentReadingBand: '',
        currentWritingBand: '',
        currentSpeakingBand: '',
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        prepStatus: status,
        currentOverallBand: prev.currentOverallBand || '6.0',
      }));
    }
  };

  const toggleArrayItem = (list: string[], item: string): string[] => {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  };

  const handleGenerateStudyPlan = async () => {
    setIsGenerating(true);
    try {
      // Build deterministic plan immediately so UI is 100% responsive and reliable,
      // and call backend /api/ai/study-plan to enrich with Gemini examiner insights
      const response = await fetch('/api/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: form }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.plan) {
          setPlan(data.plan);
          setProgress({});
          setExpandedDayNumbers([1, 2]);
          setActivePhaseFilter('all');
          setActiveModuleFilter('all');
          setIsEditingQuestionnaire(false);
          setTimeout(() => {
            planTopRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 60);
          return;
        }
      }
    } catch {
      // Fallback to client-side deterministic engine if offline
    } finally {
      setIsGenerating(false);
    }

    const fallbackPlan = buildDeterministicStudyPlan(form);
    setPlan(fallbackPlan);
    setProgress({});
    setExpandedDayNumbers([1, 2]);
    setActivePhaseFilter('all');
    setActiveModuleFilter('all');
    setIsEditingQuestionnaire(false);
    setTimeout(() => {
      planTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const toggleDayExpand = (dayNumber: number) => {
    setExpandedDayNumbers((prev) =>
      prev.includes(dayNumber) ? prev.filter((d) => d !== dayNumber) : [...prev, dayNumber]
    );
  };

  const toggleDayCompleted = (dayNumber: number, totalTasks: number) => {
    setProgress((prev) => {
      const current = prev[dayNumber] || { completed: false, completedTasks: [], userNotes: '' };
      const nextCompleted = !current.completed;
      return {
        ...prev,
        [dayNumber]: {
          ...current,
          completed: nextCompleted,
          completedTasks: nextCompleted
            ? Array.from({ length: totalTasks }, (_, idx) => idx)
            : [],
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const toggleSubTaskCompleted = (dayNumber: number, taskIdx: number, totalTasks: number) => {
    setProgress((prev) => {
      const current = prev[dayNumber] || { completed: false, completedTasks: [], userNotes: '' };
      const hasTask = current.completedTasks.includes(taskIdx);
      const nextTasks = hasTask
        ? current.completedTasks.filter((t) => t !== taskIdx)
        : [...current.completedTasks, taskIdx];
      const allDone = nextTasks.length >= totalTasks;
      return {
        ...prev,
        [dayNumber]: {
          ...current,
          completedTasks: nextTasks,
          completed: allDone,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const updateDayNotes = (dayNumber: number, notes: string) => {
    setProgress((prev) => {
      const current = prev[dayNumber] || { completed: false, completedTasks: [], userNotes: '' };
      return {
        ...prev,
        [dayNumber]: {
          ...current,
          userNotes: notes,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const completedDaysCount = useMemo(() => {
    if (!plan) return 0;
    return plan.days.filter((d) => progress[d.dayNumber]?.completed).length;
  }, [plan, progress]);

  const completionPercentage = useMemo(() => {
    if (!plan || plan.days.length === 0) return 0;
    return Math.round((completedDaysCount / plan.days.length) * 100);
  }, [plan, completedDaysCount]);

  // Next uncompleted day
  const nextUpDay = useMemo(() => {
    if (!plan) return null;
    return plan.days.find((d) => !progress[d.dayNumber]?.completed) || plan.days[plan.days.length - 1];
  }, [plan, progress]);

  const filteredDays = useMemo(() => {
    if (!plan) return [];
    return plan.days.filter((d) => {
      if (activePhaseFilter !== 'all' && d.phaseIndex !== activePhaseFilter) return false;
      if (
        activeModuleFilter !== 'all' &&
        d.primaryModule !== activeModuleFilter &&
        d.secondaryModule !== activeModuleFilter
      ) {
        return false;
      }
      return true;
    });
  }, [plan, activePhaseFilter, activeModuleFilter]);

  const handleCopyPlanSummary = () => {
    if (!plan) return;
    const lines = [
      `IELTS DECODED — ${plan.planTitle}`,
      plan.studentProfileSummary,
      '',
      `Progress: ${completedDaysCount}/${plan.days.length} days completed (${completionPercentage}%)`,
      '',
      ...plan.days.map(
        (d) =>
          `Day ${d.dayNumber} [${progress[d.dayNumber]?.completed ? 'DONE' : 'TODO'}] — ${d.title} (${d.questionTypeTag})\n  Objective: ${d.primaryObjective}\n  Material: ${d.practiceMaterial}`
      ),
    ];
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n')).then(() => {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2500);
      });
    }
  };

  const executeBrandedPdfDownload = async () => {
    if (!plan || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      await downloadStudyPlanPdf(plan, progress);
    } catch (err) {
      console.error('Failed to generate study plan PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!plan || isDownloadingPdf) return;
    const saved = getLatestSavedStudentLead();
    if (saved) {
      setHasExistingLead(true);
      setLeadFullName(saved.fullName);
      setLeadWhatsapp(saved.normalizedWhatsapp);
    } else {
      setHasExistingLead(false);
      setLeadFullName('');
      setLeadWhatsapp('');
    }
    setLeadNameError(null);
    setLeadPhoneError(null);
    setIsPdfLeadModalOpen(true);
  };

  const handleConfirmPdfLeadAndDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || isDownloadingPdf) return;

    setLeadNameError(null);
    setLeadPhoneError(null);

    const trimmedName = leadFullName.trim();
    const trimmedPhone = leadWhatsapp.trim();

    // If the student ALREADY provided their WhatsApp name & number earlier on the website,
    // filling this form is optional — if they left it blank, download immediately.
    if (hasExistingLead && !trimmedName && !trimmedPhone) {
      setIsPdfLeadModalOpen(false);
      await executeBrandedPdfDownload();
      return;
    }

    let hasError = false;
    if (!trimmedName || trimmedName.length < 2) {
      setLeadNameError('Please enter your full name.');
      hasError = true;
    }

    const phoneValidation = validateWhatsappPhone(trimmedPhone);
    if (!phoneValidation.valid) {
      setLeadPhoneError(
        phoneValidation.error || 'Please enter a valid Bangladesh WhatsApp number (e.g. 017XXXXXXXX).'
      );
      hasError = true;
    }

    if (hasError) return;

    saveStoredLocalLead({
      normalizedWhatsapp: phoneValidation.normalized,
      fullName: trimmedName,
      submittedAt: new Date().toISOString(),
    });

    setIsPdfLeadModalOpen(false);
    await executeBrandedPdfDownload();

    // Log study plan download lead to /api/leads in background
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: trimmedName,
        whatsappNumber: phoneValidation.display,
        source: `Study Plan PDF Download (${plan.input.durationDays} Days · Target Band ${plan.input.targetOverallBand})`,
      }),
    }).catch((err) => {
      console.warn('Study plan lead log warning:', err);
    });
  };

  const handleSkipOptionalPdfLead = async () => {
    setIsPdfLeadModalOpen(false);
    await executeBrandedPdfDownload();
  };

  const writingWeaknessOptions =
    form.testType === 'general'
      ? WRITING_WEAKNESS_OPTIONS_GENERAL
      : WRITING_WEAKNESS_OPTIONS_ACADEMIC;

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8" ref={planTopRef}>
        {/* Breadcrumb & Back Link */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-rule">
          <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="hover:text-ink underline underline-offset-4"
            >
              IELTS DECODED
            </a>
            <span aria-hidden="true">/</span>
            <span className="text-ink font-medium">Personalized Study Plan Builder</span>
          </div>

          {plan && !isEditingQuestionnaire && (
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="px-3.5 py-2 bg-violet-pen hover:bg-violet-pen-hover disabled:opacity-60 text-white font-medium inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span>
                  {isDownloadingPdf
                    ? 'Preparing Branded PDF…'
                    : `Download ${plan.input.durationDays}-Day Plan PDF`}
                </span>
                <IconArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleStartEditPlan('stepA')}
                className="px-3 py-1.5 border border-rule bg-surface-elevated hover:border-ink text-ink cursor-pointer transition-colors"
              >
                Adjust Goal / Rebuild Plan
              </button>
              <button
                type="button"
                onClick={handleCopyPlanSummary}
                className="px-3 py-1.5 border border-rule bg-surface-elevated hover:border-ink text-ink cursor-pointer transition-colors"
              >
                {copiedSummary ? 'Copied Full Plan ✓' : 'Copy Plan'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 border border-rule bg-surface-elevated hover:border-ink text-ink cursor-pointer transition-colors"
              >
                Print
              </button>
            </div>
          )}
        </div>

        {/* =====================================================================
            HERO HEADER FOR STUDY PLANNER
           ===================================================================== */}
        <div className="pt-8 pb-10 border-b border-rule">
          <div className="max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
              Free Curriculum Architect · IELTS Academic &amp; General Training
            </p>
            <h1 className="font-serif text-display-section font-normal text-ink">
              Build your day-by-day{' '}
              <RedPen type="underline" seed={1}>
                IELTS study plan.
              </RedPen>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-ink-muted leading-relaxed">
              Stop sitting down at your desk wondering which book to open. Tell us your starting level, target band, preparation duration, and module bottlenecks—and get a complete Day 1 to Day N curriculum telling you <strong className="text-ink font-medium">what to practise, how to approach each question type, how to log your mistakes, and how to verify improvement.</strong>
            </p>
          </div>
        </div>

        {/* =====================================================================
            MODE 1: MULTISTEP LOW-FRICTION QUESTIONNAIRE
           ===================================================================== */}
        {isEditingQuestionnaire || !plan ? (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left 4 Columns: Step Progress & Why This Works */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              <div className="p-5 sm:p-6 bg-ivory border border-rule">
                <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-4">
                  Curriculum Setup · 4 Quick Steps
                </p>

                <ol className="space-y-3 font-mono text-xs">
                  {[
                    { id: 'stepA', num: '01', label: 'IELTS Goal & Test Type' },
                    { id: 'stepB', num: '02', label: 'Duration & Study Routine' },
                    { id: 'stepC', num: '03', label: 'Current Skills & Weaknesses' },
                    { id: 'review', num: '04', label: 'Review & Generate Plan' },
                  ].map((s) => {
                    const isCurrent = step === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setStep(s.id as typeof step)}
                          className={`w-full text-left py-2 px-3 border flex items-center justify-between transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-ink text-paper border-ink font-medium'
                              : 'bg-paper text-ink-muted border-rule hover:border-ink hover:text-ink'
                          }`}
                        >
                          <span>
                            {s.num} · {s.label}
                          </span>
                          {isCurrent && <span>→</span>}
                        </button>
                      </li>
                    );
                  })}
                </ol>

                {plan && (
                  <div className="mt-5 pt-4 border-t border-rule">
                    <button
                      type="button"
                      onClick={() => setIsEditingQuestionnaire(false)}
                      className="font-mono text-xs text-violet-pen hover:text-ink underline underline-offset-4 cursor-pointer"
                    >
                      ← Return to my existing {plan.input.durationDays}-day plan
                    </button>
                  </div>
                )}
              </div>

              <div className="p-5 border border-rule bg-surface-elevated space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-examiner-red">
                  How IELTS DECODED plans work
                </p>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Unlike generic study schedules that just say <em className="text-ink">"Day 4: Practise Reading"</em>, every day in your generated plan tells you in simple English:
                </p>
                <ul className="space-y-1.5 font-mono text-xs text-ink">
                  <li>01 · What to practise and what material to use</li>
                  <li>02 · Clear, step-by-step instructions to follow</li>
                  <li>03 · How to check your work and find out why answers were wrong</li>
                  <li>04 · Simple before-and-after examples &amp; what to finish today</li>
                </ul>
              </div>
            </div>

            {/* Right 8 Columns: Active Step Form */}
            <div className="lg:col-span-8 bg-surface-elevated border border-rule-strong p-6 sm:p-8 lg:p-10">
              {/* ------------------- STEP A: IELTS GOAL ------------------- */}
              {step === 'stepA' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b border-rule">
                    <span className="font-mono text-xs text-violet-pen uppercase tracking-wider">
                      Step 01 of 04
                    </span>
                    <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-ink font-normal">
                      Your IELTS goal &amp; starting point
                    </h2>
                    <p className="mt-1 text-sm text-ink-muted">
                      Tell us which test you are taking and the score you need. Beginners can skip current scores.
                    </p>
                  </div>

                  {/* Test Type */}
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-3">
                      1. Which IELTS test are you preparing for?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          id: 'academic' as TestType,
                          title: 'IELTS Academic',
                          desc: 'University admission, postgraduate study, scholarships & professional registration',
                        },
                        {
                          id: 'general' as TestType,
                          title: 'IELTS General Training',
                          desc: 'Migration, skilled worker visas & secondary education (Letter Task 1)',
                        },
                      ].map((opt) => {
                        const active = form.testType === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, testType: opt.id }))}
                            className={`p-4 border text-left transition-colors cursor-pointer ${
                              active
                                ? 'bg-ink text-paper border-ink'
                                : 'bg-paper text-ink border-rule hover:border-ink'
                            }`}
                          >
                            <div className="font-mono text-xs font-semibold flex items-center justify-between">
                              <span>{opt.title}</span>
                              <span>{active ? '✓' : ''}</span>
                            </div>
                            <p
                              className={`mt-1.5 text-xs leading-relaxed ${
                                active ? 'text-paper/80' : 'text-ink-muted'
                              }`}
                            >
                              {opt.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preparation Status */}
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-3">
                      2. Where are you in your preparation right now?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: 'beginner' as PrepStatus,
                          title: 'Starting from scratch',
                          desc: 'Completely new to IELTS / never taken a diagnostic test',
                        },
                        {
                          id: 'preparing' as PrepStatus,
                          title: 'Currently preparing',
                          desc: 'Practising on my own or in a course and know my approximate band',
                        },
                        {
                          id: 'retaker' as PrepStatus,
                          title: 'Previously taken IELTS',
                          desc: 'Retaking IELTS to raise my overall or sub-band score',
                        },
                      ].map((opt) => {
                        const active = form.prepStatus === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectPrepStatus(opt.id)}
                            className={`p-4 border text-left transition-colors cursor-pointer ${
                              active
                                ? 'bg-ink text-paper border-ink'
                                : 'bg-paper text-ink border-rule hover:border-ink'
                            }`}
                          >
                            <div className="font-mono text-xs font-semibold flex items-center justify-between">
                              <span>{opt.title}</span>
                              <span>{active ? '✓' : ''}</span>
                            </div>
                            <p
                              className={`mt-1.5 text-xs leading-relaxed ${
                                active ? 'text-paper/80' : 'text-ink-muted'
                              }`}
                            >
                              {opt.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current Overall Band (Optional) & Target Overall Band */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-2">
                        3. Current overall band (optional)
                      </label>
                      <p className="text-xs text-ink-muted mb-3">
                        Leave on "Not sure / Beginner" if you haven’t tested yet.
                      </p>
                      <select
                        value={form.currentOverallBand}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, currentOverallBand: e.target.value }))
                        }
                        className="w-full min-h-[44px] px-3.5 py-2 bg-paper border border-rule-strong font-mono text-sm text-ink focus:outline-2 focus:outline-violet-pen"
                      >
                        <option value="">Not sure / Starting from scratch</option>
                        {BAND_SCORE_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            Band {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-2">
                        4. Target overall band score
                      </label>
                      <p className="text-xs text-ink-muted mb-3">
                        Select the overall band required for your admission or visa.
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {TARGET_BAND_OPTIONS.map((b) => {
                          const active = form.targetOverallBand === b;
                          return (
                            <button
                              key={b}
                              type="button"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  targetOverallBand: b,
                                  targetListeningBand: prev.targetListeningBand || b,
                                  targetReadingBand: prev.targetReadingBand || b,
                                  targetWritingBand: prev.targetWritingBand || b,
                                  targetSpeakingBand: prev.targetSpeakingBand || b,
                                }))
                              }
                              className={`min-h-[42px] font-mono text-xs border transition-colors cursor-pointer ${
                                active
                                  ? 'bg-violet-pen text-white border-violet-pen font-semibold'
                                  : 'bg-paper text-ink border-rule hover:border-ink'
                              }`}
                            >
                              {b}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Optional Sub-Band Targets */}
                  <div className="pt-2 border-t border-rule">
                    <button
                      type="button"
                      onClick={() => setShowSubBandTargets((prev) => !prev)}
                      className="font-mono text-xs text-violet-pen hover:text-ink underline underline-offset-4 cursor-pointer"
                    >
                      {showSubBandTargets
                        ? '− Hide individual module target bands'
                        : '+ Set specific minimum target bands for Listening, Reading, Writing & Speaking (optional)'}
                    </button>

                    {showSubBandTargets && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-ivory border border-rule">
                        {(
                          [
                            { key: 'targetListeningBand', label: 'Listening Target' },
                            { key: 'targetReadingBand', label: 'Reading Target' },
                            { key: 'targetWritingBand', label: 'Writing Target' },
                            { key: 'targetSpeakingBand', label: 'Speaking Target' },
                          ] as const
                        ).map((item) => (
                          <div key={item.key}>
                            <label className="block font-mono text-[11px] text-ink-muted mb-1.5">
                              {item.label}
                            </label>
                            <select
                              value={form[item.key]}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, [item.key]: e.target.value }))
                              }
                              className="w-full min-h-[40px] px-2.5 py-1.5 bg-paper border border-rule font-mono text-xs text-ink"
                            >
                              <option value="">Same as overall ({form.targetOverallBand})</option>
                              {TARGET_BAND_OPTIONS.map((b) => (
                                <option key={b} value={b}>
                                  Band {b}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Optional Exam Date */}
                  <div className="pt-2 border-t border-rule">
                    <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5">
                      5. Exam date (optional — leave blank if not booked yet)
                    </label>
                    <p className="text-xs text-ink-muted mb-3">
                      If you enter your exam date, your study routine will automatically be set to the exact number of days left until your exam.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="date"
                        value={form.examDate}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          const daysUntil = calculateDaysUntilExam(newDate);
                          if (daysUntil !== null) {
                            const isPreset = DURATION_PRESETS.some((p) => p.days === daysUntil);
                            setCustomDurationMode(!isPreset);
                            setCustomDurationInput(String(daysUntil));
                            setForm((prev) => ({
                              ...prev,
                              examDate: newDate,
                              durationDays: daysUntil,
                            }));
                          } else {
                            setForm((prev) => ({ ...prev, examDate: newDate }));
                          }
                        }}
                        className="min-h-[42px] px-3.5 py-2 bg-paper border border-rule font-mono text-xs text-ink"
                      />
                      {form.examDate && (
                        <span className="font-mono text-xs text-violet-pen font-medium">
                          → {form.durationDays}-day study plan until your exam
                        </span>
                      )}
                      {form.examDate && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, examDate: '' }))}
                          className="font-mono text-xs text-ink-muted hover:text-ink underline underline-offset-4 cursor-pointer"
                        >
                          Clear exam date
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-rule flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setStep('stepB')}
                      className="min-h-[48px] px-6 py-3 bg-ink hover:bg-violet-pen text-paper hover:text-white font-mono text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                    >
                      Continue to Step 02: Duration &amp; Routine →
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------- STEP B: DURATION & STUDY HABITS ------------------- */}
              {step === 'stepB' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b border-rule">
                    <span className="font-mono text-xs text-violet-pen uppercase tracking-wider">
                      Step 02 of 04
                    </span>
                    <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-ink font-normal">
                      Preparation duration &amp; weekly study rhythm
                    </h2>
                    <p className="mt-1 text-sm text-ink-muted">
                      Choose a preset duration or enter your exact number of days (7 to 120 days). Every single day from Day 1 to Day N will be generated.
                    </p>
                  </div>

                  {/* Duration Presets + Custom */}
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-3">
                      1. How many days should your study plan cover?
                    </label>
                    {form.examDate && (
                      <div className="mb-3 p-3 bg-ivory border border-rule font-mono text-xs text-ink flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Your exam date (<strong>{form.examDate}</strong>) automatically set your study routine to <strong>{form.durationDays} days</strong>.
                        </span>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, examDate: '' }))}
                          className="text-violet-pen hover:text-ink underline underline-offset-4 cursor-pointer"
                        >
                          Clear exam date to choose another length
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {DURATION_PRESETS.map((preset) => {
                        const active = !customDurationMode && form.durationDays === preset.days;
                        return (
                          <button
                            key={preset.days}
                            type="button"
                            onClick={() => {
                              setCustomDurationMode(false);
                              setForm((prev) => ({
                                ...prev,
                                examDate: '',
                                durationDays: preset.days,
                              }));
                            }}
                            className={`p-3.5 border text-left transition-colors cursor-pointer ${
                              active
                                ? 'bg-ink text-paper border-ink'
                                : 'bg-paper text-ink border-rule hover:border-ink'
                            }`}
                          >
                            <div className="font-mono text-xs sm:text-sm font-semibold">
                              {preset.label}
                            </div>
                            <div
                              className={`text-[11px] mt-0.5 ${
                                active ? 'text-paper/80' : 'text-ink-muted'
                              }`}
                            >
                              {preset.sub}
                            </div>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          setCustomDurationMode(true);
                          const parsed = Math.max(1, Math.min(120, parseInt(customDurationInput, 10) || 35));
                          setForm((prev) => ({ ...prev, durationDays: parsed }));
                        }}
                        className={`p-3.5 border text-left transition-colors cursor-pointer ${
                          customDurationMode
                            ? 'bg-ink text-paper border-ink'
                            : 'bg-paper text-ink border-rule hover:border-ink'
                        }`}
                      >
                        <div className="font-mono text-xs sm:text-sm font-semibold">
                          Custom Duration
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            customDurationMode ? 'text-paper/80' : 'text-ink-muted'
                          }`}
                        >
                          {form.examDate
                            ? `${form.durationDays} days until exam`
                            : 'Any exact length (up to 120 days)'}
                        </div>
                      </button>
                    </div>

                    {customDurationMode && (
                      <div className="mt-4 p-4 bg-ivory border border-rule flex flex-wrap items-center gap-4">
                        <label className="font-mono text-xs text-ink">
                          Enter exact number of days (1 to 120):
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={customDurationInput}
                          onChange={(e) => {
                            setCustomDurationInput(e.target.value);
                            const val = parseInt(e.target.value, 10);
                            if (!Number.isNaN(val)) {
                              setForm((prev) => ({
                                ...prev,
                                examDate: '',
                                durationDays: Math.max(1, Math.min(120, val)),
                              }));
                            }
                          }}
                          className="w-28 min-h-[40px] px-3 py-1.5 bg-paper border border-rule-strong font-mono text-sm text-ink"
                        />
                        <span className="font-mono text-xs text-ink-muted">
                          → Generating Day 1 through Day {form.durationDays}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Days Per Week */}
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-2">
                      2. How many days per week can you realistically study?
                    </label>
                    <p className="text-xs text-ink-muted mb-3">
                      If you select 4, 5, or 6 days/week, the remaining days in each 7-day cycle are built as lighter Mistake Log &amp; Vocabulary Consolidation days so you never fall behind.
                    </p>
                    <div className="grid grid-cols-5 gap-2.5 max-w-lg">
                      {[3, 4, 5, 6, 7].map((d) => {
                        const active = form.daysPerWeek === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, daysPerWeek: d }))}
                            className={`min-h-[44px] font-mono text-xs border transition-colors cursor-pointer ${
                              active
                                ? 'bg-ink text-paper border-ink font-semibold'
                                : 'bg-paper text-ink border-rule hover:border-ink'
                            }`}
                          >
                            {d} days/wk
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Focus Preference */}
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-3">
                      3. How should we weight your daily modules?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          id: 'weakness-priority' as StudyFocusPreference,
                          title: 'Prioritize my weakest modules (Recommended)',
                          desc: 'Allocates ~60% of high-intensity days to your lowest-scoring or hardest modules while keeping strong modules sharp.',
                        },
                        {
                          id: 'balanced' as StudyFocusPreference,
                          title: 'Balanced 4-module rotation',
                          desc: 'Cycles evenly through Reading, Writing, Listening, and Speaking every four active study days.',
                        },
                      ].map((opt) => {
                        const active = form.focusPreference === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, focusPreference: opt.id }))}
                            className={`p-4 border text-left transition-colors cursor-pointer ${
                              active
                                ? 'bg-ink text-paper border-ink'
                                : 'bg-paper text-ink border-rule hover:border-ink'
                            }`}
                          >
                            <div className="font-mono text-xs font-semibold flex items-center justify-between">
                              <span>{opt.title}</span>
                              <span>{active ? '✓' : ''}</span>
                            </div>
                            <p
                              className={`mt-1.5 text-xs leading-relaxed ${
                                active ? 'text-paper/80' : 'text-ink-muted'
                              }`}
                            >
                              {opt.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available Study Resources */}
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-2">
                      4. Which practice materials do you have access to?
                    </label>
                    <p className="text-xs text-ink-muted mb-3">
                      We will tailor your daily practice references to match the books and resources you use.
                    </p>
                    <div className="space-y-2">
                      {RESOURCE_OPTIONS.map((res) => {
                        const checked = form.availableResources.includes(res.id);
                        return (
                          <label
                            key={res.id}
                            className={`flex items-center gap-3 p-3 border text-xs sm:text-sm font-mono cursor-pointer transition-colors ${
                              checked
                                ? 'bg-ivory border-ink text-ink font-medium'
                                : 'bg-paper border-rule text-ink-muted hover:border-ink'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  availableResources: toggleArrayItem(
                                    prev.availableResources,
                                    res.id
                                  ),
                                }))
                              }
                              className="sr-only"
                            />
                            <span
                              className={`w-4 h-4 border inline-flex items-center justify-center text-[10px] shrink-0 ${
                                checked ? 'bg-ink text-paper border-ink' : 'border-ink-muted'
                              }`}
                            >
                              {checked ? '✓' : ''}
                            </span>
                            <span>{res.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-rule flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setStep('stepA')}
                      className="min-h-[44px] px-4 py-2 border border-rule font-mono text-xs text-ink hover:border-ink cursor-pointer"
                    >
                      ← Back to Step 01
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('stepC')}
                      className="min-h-[48px] px-6 py-3 bg-ink hover:bg-violet-pen text-paper hover:text-white font-mono text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                    >
                      Continue to Step 03: Skills &amp; Weaknesses →
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------- STEP C: SKILLS & WEAKNESSES ------------------- */}
              {step === 'stepC' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b border-rule">
                    <span className="font-mono text-xs text-violet-pen uppercase tracking-wider">
                      Step 03 of 04
                    </span>
                    <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-ink font-normal">
                      Module scores &amp; specific trouble areas
                    </h2>
                    <p className="mt-1 text-sm text-ink-muted">
                      Select the question types or marking criteria that cost you marks. Everything on this step is optional—if you aren’t sure yet, tick "I am not sure what my weaknesses are."
                    </p>
                  </div>

                  {/* Current Module Sub-scores (Optional) */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <label className="font-mono text-xs uppercase tracking-wider text-ink">
                        1. Current module bands (optional)
                      </label>
                      {form.prepStatus === 'beginner' && (
                        <span className="font-mono text-[11px] text-examiner-red">
                          Beginner mode active — leave blank to start with a Day 1 diagnostic
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-ivory border border-rule">
                      {(
                        [
                          { key: 'currentListeningBand', label: 'Listening' },
                          { key: 'currentReadingBand', label: 'Reading' },
                          { key: 'currentWritingBand', label: 'Writing' },
                          { key: 'currentSpeakingBand', label: 'Speaking' },
                        ] as const
                      ).map((mod) => (
                        <div key={mod.key}>
                          <label className="block font-mono text-[11px] text-ink-muted mb-1">
                            {mod.label}
                          </label>
                          <select
                            value={form[mod.key]}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, [mod.key]: e.target.value }))
                            }
                            className="w-full min-h-[40px] px-2.5 py-1.5 bg-paper border border-rule font-mono text-xs text-ink"
                          >
                            <option value="">Not sure</option>
                            {BAND_SCORE_OPTIONS.map((b) => (
                              <option key={b} value={b}>
                                Band {b}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* "Not sure what my weaknesses are" toggle */}
                  <div className="p-4 border border-rule-strong bg-paper">
                    <label className="flex items-center gap-3 cursor-pointer font-mono text-xs sm:text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={form.notSureWeaknesses}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            notSureWeaknesses: e.target.checked,
                          }))
                        }
                        className="sr-only"
                      />
                      <span
                        className={`w-4 h-4 border inline-flex items-center justify-center text-[10px] shrink-0 ${
                          form.notSureWeaknesses
                            ? 'bg-violet-pen text-white border-violet-pen'
                            : 'border-ink-muted'
                        }`}
                      >
                        {form.notSureWeaknesses ? '✓' : ''}
                      </span>
                      <span>
                        I am not sure what my specific weaknesses are yet (build a diagnostic-first curriculum covering all high-yield IELTS traps)
                      </span>
                    </label>
                  </div>

                  {/* 4 Module Weakness Checklists */}
                  <div className="space-y-6">
                    {/* Listening */}
                    <div className="p-5 border border-rule bg-paper">
                      <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-3">
                        Listening Difficulty Areas (select any that apply)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {LISTENING_WEAKNESS_OPTIONS.map((item) => {
                          const checked = form.listeningWeaknesses.includes(item);
                          return (
                            <label
                              key={item}
                              className={`flex items-start gap-2.5 p-2.5 border text-xs cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-ivory border-ink text-ink font-medium'
                                  : 'bg-surface-elevated border-rule text-ink-muted hover:border-ink'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    notSureWeaknesses: false,
                                    listeningWeaknesses: toggleArrayItem(
                                      prev.listeningWeaknesses,
                                      item
                                    ),
                                  }))
                                }
                                className="sr-only"
                              />
                              <span
                                className={`mt-0.5 w-3.5 h-3.5 border inline-flex items-center justify-center text-[10px] shrink-0 ${
                                  checked ? 'bg-ink text-paper border-ink' : 'border-ink-muted'
                                }`}
                              >
                                {checked ? '✓' : ''}
                              </span>
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reading */}
                    <div className="p-5 border border-rule bg-paper">
                      <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-3">
                        Reading Difficulty Areas (select any that apply)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {READING_WEAKNESS_OPTIONS.map((item) => {
                          const checked = form.readingWeaknesses.includes(item);
                          return (
                            <label
                              key={item}
                              className={`flex items-start gap-2.5 p-2.5 border text-xs cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-ivory border-ink text-ink font-medium'
                                  : 'bg-surface-elevated border-rule text-ink-muted hover:border-ink'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    notSureWeaknesses: false,
                                    readingWeaknesses: toggleArrayItem(
                                      prev.readingWeaknesses,
                                      item
                                    ),
                                  }))
                                }
                                className="sr-only"
                              />
                              <span
                                className={`mt-0.5 w-3.5 h-3.5 border inline-flex items-center justify-center text-[10px] shrink-0 ${
                                  checked ? 'bg-ink text-paper border-ink' : 'border-ink-muted'
                                }`}
                              >
                                {checked ? '✓' : ''}
                              </span>
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Writing */}
                    <div className="p-5 border border-rule bg-paper">
                      <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-3">
                        Writing Difficulty Areas ({form.testType === 'academic' ? 'Academic' : 'General Training'})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {writingWeaknessOptions.map((item) => {
                          const checked = form.writingWeaknesses.includes(item);
                          return (
                            <label
                              key={item}
                              className={`flex items-start gap-2.5 p-2.5 border text-xs cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-ivory border-ink text-ink font-medium'
                                  : 'bg-surface-elevated border-rule text-ink-muted hover:border-ink'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    notSureWeaknesses: false,
                                    writingWeaknesses: toggleArrayItem(
                                      prev.writingWeaknesses,
                                      item
                                    ),
                                  }))
                                }
                                className="sr-only"
                              />
                              <span
                                className={`mt-0.5 w-3.5 h-3.5 border inline-flex items-center justify-center text-[10px] shrink-0 ${
                                  checked ? 'bg-ink text-paper border-ink' : 'border-ink-muted'
                                }`}
                              >
                                {checked ? '✓' : ''}
                              </span>
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Speaking */}
                    <div className="p-5 border border-rule bg-paper">
                      <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-3">
                        Speaking Difficulty Areas (select any that apply)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SPEAKING_WEAKNESS_OPTIONS.map((item) => {
                          const checked = form.speakingWeaknesses.includes(item);
                          return (
                            <label
                              key={item}
                              className={`flex items-start gap-2.5 p-2.5 border text-xs cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-ivory border-ink text-ink font-medium'
                                  : 'bg-surface-elevated border-rule text-ink-muted hover:border-ink'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    notSureWeaknesses: false,
                                    speakingWeaknesses: toggleArrayItem(
                                      prev.speakingWeaknesses,
                                      item
                                    ),
                                  }))
                                }
                                className="sr-only"
                              />
                              <span
                                className={`mt-0.5 w-3.5 h-3.5 border inline-flex items-center justify-center text-[10px] shrink-0 ${
                                  checked ? 'bg-ink text-paper border-ink' : 'border-ink-muted'
                                }`}
                              >
                                {checked ? '✓' : ''}
                              </span>
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-rule flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setStep('stepB')}
                      className="min-h-[44px] px-4 py-2 border border-rule font-mono text-xs text-ink hover:border-ink cursor-pointer"
                    >
                      ← Back to Step 02
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('review')}
                      className="min-h-[48px] px-6 py-3 bg-ink hover:bg-violet-pen text-paper hover:text-white font-mono text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                    >
                      Review My Selection →
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------- STEP D: CONCISE REVIEW BEFORE GENERATING ------------------- */}
              {step === 'review' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b border-rule">
                    <span className="font-mono text-xs text-violet-pen uppercase tracking-wider">
                      Step 04 of 04 · Pre-Generation Review
                    </span>
                    <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-ink font-normal">
                      Confirm your study plan blueprint
                    </h2>
                    <p className="mt-1 text-sm text-ink-muted">
                      Check your goals and duration below before we build your Day 1 through Day {form.durationDays} curriculum.
                    </p>
                  </div>

                  <div className="divide-y divide-rule border border-rule bg-paper">
                    <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                          IELTS Goal &amp; Baseline
                        </span>
                        <p className="mt-1 font-mono text-xs sm:text-sm text-ink">
                          {form.testType === 'academic' ? 'IELTS Academic' : 'IELTS General Training'} ·{' '}
                          {form.prepStatus === 'beginner' || !form.currentOverallBand
                            ? 'Starting from scratch (No baseline score)'
                            : `Current Band ${form.currentOverallBand}`}{' '}
                          → <strong className="text-violet-pen">Target Band {form.targetOverallBand}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep('stepA')}
                        className="font-mono text-xs text-ink-muted hover:text-ink underline underline-offset-4 cursor-pointer"
                      >
                        Edit Step 01
                      </button>
                    </div>

                    <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                          Duration &amp; Study Schedule
                        </span>
                        <p className="mt-1 font-mono text-xs sm:text-sm text-ink">
                          <strong>{form.durationDays} Days</strong> (Day 1 to Day {form.durationDays}) ·{' '}
                          {form.daysPerWeek} active study days/week ·{' '}
                          {form.focusPreference === 'weakness-priority'
                            ? 'Prioritize weakest modules'
                            : 'Balanced 4-module rotation'}
                        </p>
                        {form.examDate && (
                          <p className="mt-1 font-mono text-xs text-ink-muted">
                            Booked Exam Date: {form.examDate} (Study routine automatically set to {form.durationDays} days until your exam)
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep('stepB')}
                        className="font-mono text-xs text-ink-muted hover:text-ink underline underline-offset-4 cursor-pointer"
                      >
                        Edit Step 02
                      </button>
                    </div>

                    <div className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-xl">
                        <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                          Module Sub-scores &amp; Selected Trouble Areas
                        </span>
                        <p className="mt-1 font-mono text-xs text-ink">
                          Current Sub-scores: L:{form.currentListeningBand || '—'} · R:
                          {form.currentReadingBand || '—'} · W:{form.currentWritingBand || '—'} · S:
                          {form.currentSpeakingBand || '—'}
                        </p>
                        <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
                          {form.notSureWeaknesses
                            ? 'Selected: "I am not sure what my weaknesses are" (Diagnostic-first coverage across all 4 modules).'
                            : [
                                ...form.listeningWeaknesses,
                                ...form.readingWeaknesses,
                                ...form.writingWeaknesses,
                                ...form.speakingWeaknesses,
                              ].join(' · ') || 'No specific weaknesses selected (Balanced high-yield coverage).'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep('stepC')}
                        className="font-mono text-xs text-ink-muted hover:text-ink underline underline-offset-4 cursor-pointer shrink-0"
                      >
                        Edit Step 03
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setStep('stepC')}
                      className="min-h-[44px] px-4 py-2 border border-rule font-mono text-xs text-ink hover:border-ink cursor-pointer"
                    >
                      ← Back to Step 03
                    </button>

                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={handleGenerateStudyPlan}
                      className="group/btn min-h-[52px] px-8 py-4 bg-violet-pen hover:bg-violet-pen-hover disabled:opacity-60 text-white font-mono text-sm font-medium inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <RedPen type="underline" seed={0} drawOnHover>
                        {isGenerating
                          ? `Designing Your ${form.durationDays}-Day Curriculum…`
                          : `Generate My ${form.durationDays}-Day IELTS Study Plan`}
                      </RedPen>
                      <IconArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* =====================================================================
              MODE 2: GENERATED INTERACTIVE STUDY PLAN WORKSPACE
             ===================================================================== */
          <div className="mt-10 space-y-12">
            {/* 1. Plan Summary Dashboard & Honest Examiner Calibration */}
            <div className="bg-surface-elevated border border-rule-strong p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-rule">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-examiner-red">
                    Personalized IELTS DECODED Curriculum
                  </span>
                  <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-ink font-normal">
                    {plan.planTitle}
                  </h2>
                  <p className="mt-2 font-mono text-xs text-ink-muted">
                    {plan.studentProfileSummary}
                  </p>
                </div>

                {/* Completion Counter & Quick Jump */}
                <div className="p-4 bg-ivory border border-rule min-w-[240px]">
                  <div className="flex items-baseline justify-between gap-4 font-mono text-xs">
                    <span className="text-ink-muted">PROGRESS</span>
                    <span className="text-ink font-semibold tabular-nums">
                      {completedDaysCount} / {plan.days.length} Days ({completionPercentage}%)
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full bg-paper border border-rule overflow-hidden">
                    <div
                      className="h-full bg-violet-pen transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  {nextUpDay && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePhaseFilter('all');
                        setActiveModuleFilter('all');
                        if (!expandedDayNumbers.includes(nextUpDay.dayNumber)) {
                          setExpandedDayNumbers((prev) => [...prev, nextUpDay.dayNumber]);
                        }
                        setTimeout(() => {
                          document
                            .getElementById(`study-day-${nextUpDay.dayNumber}`)
                            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 50);
                      }}
                      className="mt-3 w-full text-left font-mono text-[11px] text-violet-pen hover:text-ink underline underline-offset-4 cursor-pointer"
                    >
                      Jump to Next Up: Day {nextUpDay.dayNumber} →
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="mt-3 w-full min-h-[38px] px-3 py-2 bg-ink hover:bg-violet-pen disabled:opacity-60 text-paper hover:text-white font-mono text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>
                      {isDownloadingPdf ? 'Generating PDF…' : 'Download Study Plan as PDF'}
                    </span>
                    <IconArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Teacher Note + Warnings */}
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-ivory border-l-2 border-ink text-sm text-ink leading-relaxed">
                  <strong className="font-mono text-xs uppercase tracking-wider block text-ink-muted mb-1">
                    How to Follow Your Study Plan
                  </strong>
                  {plan.realisticExpectationNote}
                </div>

                {plan.ambitiousTargetWarning && (
                  <div className="p-4 bg-ivory border-l-2 border-examiner-red text-xs sm:text-sm text-ink leading-relaxed">
                    {plan.ambitiousTargetWarning}
                  </div>
                )}

                {plan.examDateConflictNote && (
                  <div className="p-4 bg-paper border border-rule font-mono text-xs text-ink-muted leading-relaxed">
                    {plan.examDateConflictNote}
                  </div>
                )}
              </div>

              {/* 4-Module Allocation & 4 Stages Overview */}
              <div className="mt-8 pt-6 border-t border-rule">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 font-mono text-xs">
                  <span className="uppercase tracking-wider text-ink-muted">
                    Your 4 Study Stages (Click a stage to filter days)
                  </span>
                  <span className="text-ink">
                    Study Focus: Reading {plan.moduleAllocationPercent.reading}% · Writing{' '}
                    {plan.moduleAllocationPercent.writing}% · Listening{' '}
                    {plan.moduleAllocationPercent.listening}% · Speaking{' '}
                    {plan.moduleAllocationPercent.speaking}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {plan.phases.map((phase) => {
                    const isSelected = activePhaseFilter === phase.phaseIndex;
                    return (
                      <button
                        key={phase.phaseIndex}
                        type="button"
                        onClick={() =>
                          setActivePhaseFilter((prev) =>
                            prev === phase.phaseIndex ? 'all' : phase.phaseIndex
                          )
                        }
                        className={`p-4 border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-ink text-paper border-ink'
                            : 'bg-paper text-ink border-rule hover:border-ink'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                            <span className={isSelected ? 'text-paper/80' : 'text-examiner-red'}>
                              {phase.dayRangeLabel}
                            </span>
                            <span>{isSelected ? 'Filtered ✓' : ''}</span>
                          </div>
                          <h3 className="mt-1 font-serif text-base font-normal">
                            {phase.phaseName}
                          </h3>
                          <p
                            className={`mt-2 text-xs leading-relaxed ${
                              isSelected ? 'text-paper/80' : 'text-ink-muted'
                            }`}
                          >
                            {phase.focusSummary}
                          </p>
                        </div>
                        <div
                          className={`mt-3 pt-2 border-t font-mono text-[10px] ${
                            isSelected
                              ? 'border-paper/20 text-paper/90'
                              : 'border-rule text-ink-subtle'
                          }`}
                        >
                          Milestone: {phase.keyMilestone}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Filter Bar & Expand/Collapse Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rule">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-ink-muted mr-1">Filter Module:</span>
                {(
                  [
                    { id: 'all', label: `All Days (${plan.days.length})` },
                    { id: 'reading', label: 'Reading' },
                    { id: 'writing', label: 'Writing' },
                    { id: 'listening', label: 'Listening' },
                    { id: 'speaking', label: 'Speaking' },
                  ] as const
                ).map((m) => {
                  const active = activeModuleFilter === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveModuleFilter(m.id)}
                      className={`px-3 py-1.5 font-mono text-xs border transition-colors cursor-pointer ${
                        active
                          ? 'bg-ink text-paper border-ink font-medium'
                          : 'bg-paper text-ink-muted border-rule hover:border-ink hover:text-ink'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}

                {activePhaseFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setActivePhaseFilter('all')}
                    className="px-3 py-1.5 font-mono text-xs border border-examiner-red text-examiner-red bg-paper cursor-pointer"
                  >
                    Phase {activePhaseFilter} Only ×
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setExpandedDayNumbers(filteredDays.map((d) => d.dayNumber))}
                  className="text-ink-muted hover:text-ink underline underline-offset-4 cursor-pointer"
                >
                  Expand All ({filteredDays.length})
                </button>
                <span className="text-ink-subtle">·</span>
                <button
                  type="button"
                  onClick={() => setExpandedDayNumbers([])}
                  className="text-ink-muted hover:text-ink underline underline-offset-4 cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* 3. Day-by-Day Curriculum List (Day 1 through Day N) */}
            <div className="space-y-4">
              {filteredDays.map((dayTask) => {
                const isExpanded = expandedDayNumbers.includes(dayTask.dayNumber);
                const dayProg = progress[dayTask.dayNumber] || {
                  completed: false,
                  completedTasks: [],
                  userNotes: '',
                };

                return (
                  <StudyDayCard
                    key={dayTask.dayNumber}
                    day={dayTask}
                    isExpanded={isExpanded}
                    dayProgress={dayProg}
                    onToggleExpand={() => toggleDayExpand(dayTask.dayNumber)}
                    onToggleComplete={() =>
                      toggleDayCompleted(dayTask.dayNumber, dayTask.specificStudyTasks.length)
                    }
                    onToggleSubTask={(idx) =>
                      toggleSubTaskCompleted(
                        dayTask.dayNumber,
                        idx,
                        dayTask.specificStudyTasks.length
                      )
                    }
                    onChangeNotes={(val) => updateDayNotes(dayTask.dayNumber, val)}
                    onNavigateToDiagnostic={onNavigateToDiagnostic}
                  />
                );
              })}
            </div>

            {/* 4. Native Conversion Bridge to IELTS DECODED Programs & Guides */}
            <div className="mt-16 pt-12 border-t border-rule">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Left 7 Columns: Primary Personalized Recommendation */}
                <div className="lg:col-span-7 bg-surface-elevated border border-rule-strong p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-examiner-red pb-3 border-b border-rule">
                      {plan.recommendedDecodeOffer.primaryBadge}
                    </div>
                    <h3 className="mt-4 font-serif text-2xl sm:text-3xl text-ink font-normal">
                      Want personal feedback while executing this{' '}
                      <RedPen type="underline" seed={2}>
                        {plan.input.durationDays}-day plan?
                      </RedPen>
                    </h3>
                    <p className="mt-2 font-mono text-xs text-ink">
                      Recommended for your profile: <strong>{plan.recommendedDecodeOffer.primaryTitle}</strong>
                    </p>
                    <p className="mt-4 text-sm sm:text-base text-ink-muted leading-relaxed">
                      {plan.recommendedDecodeOffer.primaryReason}
                    </p>
                  </div>

                  <div className="mt-8 pt-5 border-t border-rule flex flex-wrap items-center gap-4">
                    <a
                      href={wa(plan.recommendedDecodeOffer.primaryWaMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onWaAction(plan.recommendedDecodeOffer.primaryWaMessage)}
                      className="group/btn min-h-[48px] px-6 py-3.5 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors"
                    >
                      <RedPen type="underline" seed={0} drawOnHover>
                        {plan.recommendedDecodeOffer.primaryCtaText}
                      </RedPen>
                      <IconArrowUpRight className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => onNavigateHome('#programs')}
                      className="min-h-[44px] px-4 py-2 font-mono text-xs text-ink hover:text-violet-pen underline underline-offset-4 cursor-pointer"
                    >
                      Compare 12-Week Batch vs 1-to-1 Crash Course →
                    </button>
                  </div>
                </div>

                {/* Right 5 Columns: Self-Prep Guides & Free Writing Evaluator Bridge */}
                <div className="lg:col-span-5 bg-ivory border border-rule p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                      Self-Study Toolkit &amp; Diagnostics
                    </span>
                    <h4 className="mt-2 font-serif text-xl sm:text-2xl text-ink font-normal">
                      Pair your plan with the IELTS DECODED books &amp; tools
                    </h4>
                    <p className="mt-3 text-xs sm:text-sm text-ink-muted leading-relaxed">
                      {plan.recommendedDecodeOffer.secondaryReason}
                    </p>

                    <div className="mt-5 space-y-2.5 border-t border-rule pt-4 font-mono text-xs">
                      {plan.recommendedDecodeOffer.secondaryGuideIds.map((modId) => {
                        const g = SELF_PREP_GUIDES.find((item) => item.id === modId);
                        if (!g) return null;
                        return (
                          <div
                            key={g.id}
                            className="flex items-center justify-between gap-2 py-1.5 border-b border-rule/60"
                          >
                            <span className="text-ink">
                              {g.num} · {g.moduleName} Guide ({g.pages} pages)
                            </span>
                            <button
                              type="button"
                              onClick={() => onNavigateToGuides(g.id)}
                              className="text-violet-pen hover:text-ink underline underline-offset-4 cursor-pointer shrink-0"
                            >
                              BDT {g.priceBdt} →
                            </button>
                          </div>
                        );
                      })}
                      <div className="pt-2 flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-examiner-red font-semibold">
                          All 4 Guides Bundle (Save BDT 500)
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigateToGuides()}
                          className="text-ink font-semibold underline underline-offset-4 hover:text-violet-pen cursor-pointer"
                        >
                          BDT 1,499 →
                        </button>
                      </div>
                      <p className="text-[11px] text-ink-muted leading-relaxed pt-1">
                        <strong className="text-ink">50% Course Fee Credit:</strong> Buy any PDF guide today and deduct 50% of what you paid if you join a live program within 14 days.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-rule space-y-2.5">
                    <button
                      type="button"
                      onClick={() => onNavigateToDiagnostic()}
                      className="w-full min-h-[42px] px-4 py-2 bg-ink hover:bg-violet-pen text-paper hover:text-white font-mono text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Test Your Writing in Instant Writing Checker</span>
                      <IconArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenRescueModal('Study Plan Page - Free 38-Page Score Rescue Guide')
                      }
                      className="w-full min-h-[40px] px-4 py-2 border border-rule bg-paper hover:border-ink font-mono text-xs text-ink inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Download Free 38-Page Score Rescue PDF</span>
                      <IconArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Item 13, 14, 17: Mistake DNA Card + Send to Jubayer + Referral Share */}
              <MistakeDnaCardGenerator
                toolName={`${plan.input.durationDays}-Day IELTS Study Plan`}
                targetBand={plan.input.targetOverallBand}
                currentBand={plan.input.currentOverallBand || 'Starting'}
                bottleneckSkill={
                  plan.recommendedDecodeOffer.secondaryGuideIds[0]
                    ? plan.recommendedDecodeOffer.secondaryGuideIds[0].toUpperCase()
                    : 'Reading & Writing'
                }
                topErrorType={plan.realisticExpectationNote}
                kscTag="[S] Daily Execution & Pacing"
                actionFix={
                  plan.phases[0]?.focusSummary ||
                  'Follow your day-by-day checklist and log every mistake by [K], [S], or [C].'
                }
                examDate={
                  plan.input.examDate || `${plan.input.durationDays} days`
                }
                referralPath="/study-plan"
              />
            </div>
          </div>
        )}
      </div>

      {/* Smart Conditional Lead Capture Modal for Study Plan PDF Download */}
      {isPdfLeadModalOpen && plan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="study-plan-pdf-modal-title"
          className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => {
            if (!isDownloadingPdf) setIsPdfLeadModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md bg-paper text-ink border border-rule-strong shadow-xl p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-rule">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-examiner-red block">
                  BRANDED IELTS DECODED PDF · {plan.input.durationDays}-DAY ROUTINE
                </span>
                <h2
                  id="study-plan-pdf-modal-title"
                  className="mt-1 font-serif text-2xl text-ink font-normal"
                >
                  Download Your{' '}
                  <RedPen type="underline" seed={1}>
                    {plan.input.durationDays}-Day Study Plan
                  </RedPen>{' '}
                  PDF
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsPdfLeadModalOpen(false)}
                aria-label="Close PDF download modal"
                className="w-9 h-9 inline-flex items-center justify-center border border-rule text-ink-muted hover:text-ink hover:border-ink transition-colors cursor-pointer shrink-0"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPdfLeadAndDownload} className="mt-5 space-y-4" noValidate>
              {hasExistingLead ? (
                <div className="p-3.5 bg-ivory border border-rule text-xs text-ink leading-relaxed">
                  We recognized your saved details from earlier on the site. Your contact info below is{' '}
                  <strong className="font-semibold">optional</strong>—click{' '}
                  <strong className="font-semibold">Download PDF Now</strong> or skip directly.
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Enter your name and WhatsApp number to download your complete printable{' '}
                  <strong className="text-ink font-medium">
                    {plan.input.durationDays}-Day Band {plan.input.targetOverallBand} Study Plan PDF
                  </strong>
                  .
                </p>
              )}

              <div>
                <label
                  htmlFor="pdf-lead-name"
                  className="block font-mono text-xs text-ink font-medium mb-1.5"
                >
                  Your Full Name{' '}
                  {hasExistingLead ? (
                    <span className="text-ink-muted font-normal">(optional)</span>
                  ) : (
                    <span className="text-examiner-red">*</span>
                  )}
                </label>
                <input
                  id="pdf-lead-name"
                  type="text"
                  value={leadFullName}
                  onChange={(e) => {
                    setLeadFullName(e.target.value);
                    if (leadNameError) setLeadNameError(null);
                  }}
                  placeholder="e.g. Tasnim Rahman"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-paper border border-rule-strong font-sans text-sm text-ink focus:outline-2 focus:outline-violet-pen"
                />
                {leadNameError && (
                  <p className="mt-1 font-mono text-[11px] text-examiner-red">{leadNameError}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="pdf-lead-whatsapp"
                  className="block font-mono text-xs text-ink font-medium mb-1.5"
                >
                  WhatsApp Number (Bangladesh){' '}
                  {hasExistingLead ? (
                    <span className="text-ink-muted font-normal">(optional)</span>
                  ) : (
                    <span className="text-examiner-red">*</span>
                  )}
                </label>
                <input
                  id="pdf-lead-whatsapp"
                  type="tel"
                  value={leadWhatsapp}
                  onChange={(e) => {
                    setLeadWhatsapp(e.target.value);
                    if (leadPhoneError) setLeadPhoneError(null);
                  }}
                  placeholder="017XXXXXXXX"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-paper border border-rule-strong font-mono text-sm text-ink focus:outline-2 focus:outline-violet-pen"
                />
                {leadPhoneError && (
                  <p className="mt-1 font-mono text-[11px] text-examiner-red">{leadPhoneError}</p>
                )}
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={isDownloadingPdf}
                  className="w-full min-h-[48px] px-6 py-3 bg-violet-pen hover:bg-violet-pen-hover disabled:opacity-60 text-white font-mono text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>
                    {isDownloadingPdf
                      ? 'Generating Branded PDF…'
                      : `Download ${plan.input.durationDays}-Day Study Plan PDF`}
                  </span>
                  <IconArrowDown className="w-4 h-4" />
                </button>

                {hasExistingLead && (
                  <button
                    type="button"
                    onClick={handleSkipOptionalPdfLead}
                    disabled={isDownloadingPdf}
                    className="w-full min-h-[40px] px-4 py-2 border border-rule bg-ivory hover:border-ink font-mono text-xs text-ink cursor-pointer transition-colors"
                  >
                    Skip &amp; Download PDF Immediately →
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StudyDayCard({
  day,
  isExpanded,
  dayProgress,
  onToggleExpand,
  onToggleComplete,
  onToggleSubTask,
  onChangeNotes,
  onNavigateToDiagnostic,
}: {
  day: StudyPlanDayTask;
  isExpanded: boolean;
  dayProgress: { completed: boolean; completedTasks: number[]; userNotes: string };
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onToggleSubTask: (idx: number) => void;
  onChangeNotes: (val: string) => void;
  onNavigateToDiagnostic: () => void;
}) {
  return (
    <article
      id={`study-day-${day.dayNumber}`}
      className={`border transition-colors ${
        dayProgress.completed
          ? 'bg-ivory/70 border-rule'
          : isExpanded
          ? 'bg-surface-elevated border-rule-strong'
          : 'bg-paper border-rule hover:border-ink'
      }`}
    >
      {/* Card Header */}
      <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {/* Day Completion Checkbox Button */}
          <button
            type="button"
            onClick={onToggleComplete}
            aria-label={`Mark Day ${day.dayNumber} as ${
              dayProgress.completed ? 'incomplete' : 'completed'
            }`}
            className={`mt-0.5 sm:mt-0 w-7 h-7 border inline-flex items-center justify-center font-mono text-xs shrink-0 transition-colors cursor-pointer ${
              dayProgress.completed
                ? 'bg-ink text-paper border-ink'
                : 'bg-paper text-ink-muted border-rule-strong hover:border-ink'
            }`}
          >
            {dayProgress.completed ? '✓' : day.dayNumber}
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            className="text-left min-w-0 flex-1 cursor-pointer group"
          >
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-ink-muted">
              <span className="font-semibold text-ink tabular-nums">
                DAY {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-examiner-red">{day.questionTypeTag}</span>
              <span aria-hidden="true">·</span>
              <span>{day.phaseName.split('·')[0].trim()}</span>
              {day.isConsolidationDay && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-violet-pen">Weekly Review Day</span>
                </>
              )}
              {dayProgress.completed && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-ink font-medium">Completed ✓</span>
                </>
              )}
            </div>

            <h3
              className={`mt-1 font-serif text-lg sm:text-xl font-normal group-hover:text-violet-pen transition-colors ${
                dayProgress.completed ? 'line-through text-ink-muted' : 'text-ink'
              }`}
            >
              {day.title}
            </h3>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          aria-label={`Toggle Day ${day.dayNumber} details`}
          className="w-8 h-8 shrink-0 inline-flex items-center justify-center border border-rule text-ink-muted hover:border-ink hover:text-ink cursor-pointer"
        >
          <IconPlusMinus open={isExpanded} />
        </button>
      </div>

      {/* Expanded Day Curriculum Content */}
      {isExpanded && (
        <div className="px-4 pb-6 sm:px-6 sm:pb-7 pt-2 border-t border-rule space-y-6">
          {/* Primary Objective & Target Weakness Addressed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-ivory border border-rule">
            <div className="lg:col-span-8">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-examiner-red">
                Today’s Goal
              </span>
              <p className="mt-1 text-sm text-ink leading-relaxed">{day.primaryObjective}</p>
            </div>
            <div className="lg:col-span-4 lg:border-l lg:border-rule lg:pl-4">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                Skill You Are Improving
              </span>
              <p className="mt-1 font-mono text-xs text-ink leading-relaxed">
                {day.targetWeaknessAddressed}
              </p>
            </div>
          </div>

          {/* Specific Study Tasks (Interactive Checkboxes) */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-3">
              What to Do Today (Tick each step as you finish)
            </h4>
            <div className="space-y-2">
              {day.specificStudyTasks.map((task, idx) => {
                const isDone = dayProgress.completedTasks.includes(idx) || dayProgress.completed;
                return (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-3 border text-xs sm:text-sm cursor-pointer transition-colors ${
                      isDone
                        ? 'bg-ivory/60 border-rule text-ink-muted line-through'
                        : 'bg-paper border-rule text-ink hover:border-ink'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => onToggleSubTask(idx)}
                      className="sr-only"
                    />
                    <span
                      className={`mt-0.5 w-4 h-4 border inline-flex items-center justify-center font-mono text-[10px] shrink-0 ${
                        isDone ? 'bg-ink text-paper border-ink' : 'border-ink-muted'
                      }`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </span>
                    <span className="leading-relaxed">
                      {task.replace(/^\d+\.\s*/, '')}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Practice Material & How to Complete */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-4 border border-rule bg-paper">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-1.5">
                What Material to Use
              </span>
              <p className="text-xs sm:text-sm text-ink leading-relaxed">{day.practiceMaterial}</p>
            </div>

            <div className="p-4 border border-rule bg-paper">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-1.5">
                How to Practise Today
              </span>
              <p className="text-xs sm:text-sm text-ink leading-relaxed">{day.completionMethod}</p>
            </div>
          </div>

          {/* Step-by-Step Method */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-3">
              Step-by-Step Instructions
            </h4>
            <ol className="divide-y divide-rule border border-rule bg-paper text-xs sm:text-sm text-ink">
              {day.stepByStepMethod.map((stepText, idx) => (
                <li key={idx} className="p-3.5 flex items-baseline gap-3">
                  <span className="font-mono text-xs text-violet-pen font-semibold shrink-0 tabular-nums">
                    {idx + 1}.
                  </span>
                  <span className="leading-relaxed">{stepText}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Review & Error Analysis */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-3">
              How to Check Your Work
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-ink-muted">
              {day.reviewAndErrorAnalysis.map((rev, idx) => (
                <li key={idx} className="flex items-baseline gap-2.5">
                  <span className="font-mono text-xs text-examiner-red shrink-0">→</span>
                  <span className="leading-relaxed text-ink">{rev}</span>
                </li>
              ))}
            </ul>

            {day.primaryModule === 'writing' && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={onNavigateToDiagnostic}
                  className="font-mono text-xs text-violet-pen hover:text-ink underline underline-offset-4 cursor-pointer"
                >
                  Optional: You can also check your paragraph in the free Instant Writing Checker (/diagnostic) →
                </button>
              </div>
            )}
          </div>

          {/* Concrete Band 6 -> Band 7.5+ Upgrade Example (Where Helpful) */}
          {day.upgradeExample && (
            <div className="p-4 sm:p-5 bg-ivory border border-rule-strong space-y-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-examiner-red">
                Clear Example · {day.upgradeExample.contextLabel}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-paper border border-rule">
                  <span className="block font-mono text-[10px] uppercase text-ink-muted mb-1">
                    Common Mistake / Weak Example
                  </span>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {day.upgradeExample.band6Sample}
                  </p>
                </div>
                <div className="p-3.5 bg-paper border border-ink">
                  <span className="block font-mono text-[10px] uppercase text-violet-pen font-semibold mb-1">
                    Better Way (Clear &amp; Accurate)
                  </span>
                  <p className="text-xs text-ink leading-relaxed">
                    {day.upgradeExample.band75Upgrade}
                  </p>
                </div>
              </div>
              <p className="font-mono text-xs text-ink-muted">
                <strong className="text-ink">Why this helps:</strong> {day.upgradeExample.whyItWorks}
              </p>
            </div>
          )}

          {/* Success Criteria & Personal Mistake Log Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-rule">
            <div className="lg:col-span-6">
              <h4 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-2.5">
                What You Should Finish Today
              </h4>
              <ul className="space-y-1.5 text-xs text-ink">
                {day.successCriteria.map((crit, idx) => (
                  <li key={idx} className="flex items-baseline gap-2">
                    <span className="font-mono text-examiner-red">✓</span>
                    <span>{crit}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-mono text-[11px] text-ink-muted">{day.nextDayBridge}</p>
            </div>

            <div className="lg:col-span-6">
              <label className="block font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-2">
                My Notes &amp; Mistakes From Today (Saved Automatically)
              </label>
              <textarea
                rows={3}
                value={dayProgress.userNotes}
                onChange={(e) => onChangeNotes(e.target.value)}
                placeholder="Write down what confused you today, why any answer was wrong, or new words you want to remember..."
                className="w-full p-3 bg-paper border border-rule font-mono text-xs text-ink focus:outline-2 focus:outline-violet-pen"
              />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
