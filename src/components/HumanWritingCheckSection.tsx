import React, { useState } from 'react';
import { SITE_CONFIG, trackSiteEvent, trackWaClick, wa } from '../config';
import { IconArrowUpRight, IconCheckCircle } from './EditorialGraphics';
import {
  getLatestSavedStudentLead,
  saveStoredLocalLead,
  validateWhatsappPhone,
} from './FreeRescueModal';
import { RedPen } from './RedPen';

export type WritingCheckTaskType = 'task1_academic' | 'task1_gt' | 'task2_essay';

interface HumanWritingCheckProps {
  initialPrompt?: string;
  initialResponse?: string;
  initialTaskType?: 'task1_report' | 'task2_essay' | 'task2_intro';
  onNavigateHome?: (sectionHash?: string) => void;
}

export function HumanWritingCheckSection({
  initialPrompt = '',
  initialResponse = '',
  initialTaskType,
}: HumanWritingCheckProps) {
  const [taskType, setTaskType] = useState<WritingCheckTaskType>(() => {
    if (initialTaskType === 'task1_report') return 'task1_academic';
    return 'task2_essay';
  });

  const [essayPrompt, setEssayPrompt] = useState(initialPrompt);
  const [essayResponse, setEssayResponse] = useState(initialResponse);
  const [targetBand, setTargetBand] = useState('7.0');

  const [fullName, setFullName] = useState(() => {
    const saved = getLatestSavedStudentLead();
    return saved?.fullName || '';
  });
  const [whatsappNumber, setWhatsappNumber] = useState(() => {
    const saved = getLatestSavedStudentLead();
    return saved?.normalizedWhatsapp ? saved.normalizedWhatsapp.replace(/^\+88/, '') : '';
  });
  const [trxId, setTrxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad'>('bKash');

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [essayError, setEssayError] = useState<string | null>(null);
  const [trxError, setTrxError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [addWritingGuideBump, setAddWritingGuideBump] = useState(false);

  const basePrice = 299;
  const bumpPrice = 199;
  const totalPrice = addWritingGuideBump ? basePrice + bumpPrice : basePrice;

  const wordCount = essayResponse.trim()
    ? essayResponse.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const handleOpenOrderForm = () => {
    setIsOpenForm(true);
    trackSiteEvent('whatsapp_click', { button: 'OPEN_HUMAN_WRITING_CHECK_FORM' });
    setTimeout(() => {
      document.getElementById('human-check-order-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);
    setEssayError(null);
    setTrxError(null);
    setSubmitError(null);

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setNameError('Please enter your full name.');
      return;
    }

    const phoneValidation = validateWhatsappPhone(whatsappNumber);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || 'Please enter a valid BD WhatsApp number (013–019).');
      return;
    }

    if (wordCount < 20) {
      setEssayError('Please paste your essay draft (at least 20 words) for the human review.');
      return;
    }

    const cleanTrx = trxId.trim();
    if (!cleanTrx || cleanTrx.length < 4) {
      setTrxError('Please enter the bKash or Nagad Transaction ID (TrxID) after sending BDT 299.');
      return;
    }

    setIsSubmitting(true);

    try {
      saveStoredLocalLead({
        fullName: trimmedName,
        normalizedWhatsapp: phoneValidation.normalized,
        submittedAt: new Date().toISOString(),
        targetBand,
        weakestSkill: 'writing',
      });

      const productRecorded = addWritingGuideBump
        ? `Human Writing Check (BDT 299) + Writing Self-Prep Guide PDF (+BDT 199 Bump) (Total: BDT ${totalPrice})`
        : 'Human Writing Check (BDT 299)';

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: trimmedName,
          whatsappNumber: phoneValidation.display,
          sheetTab: 'payments',
          product: productRecorded,
          source: 'Human Writing Check Section (/diagnostic)',
          door: 'Human Writing Check BDT 299',
          trxId: cleanTrx,
          targetBand,
          weakestSkill: 'writing',
          taskType,
          essayPrompt: essayPrompt.trim(),
          essayResponse: essayResponse.trim(),
          wordCount,
          paymentMethod,
          totalPaid: totalPrice,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Could not record your order. Please message Jubayer on WhatsApp.');
      }

      trackSiteEvent('paid_form_submitted', {
        product: productRecorded,
        trxId: cleanTrx,
      });

      setOrderConfirmed(true);
      setTimeout(() => {
        document.getElementById('human-check-confirmed-box')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit order. Please check your connection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const taskTypeLabel =
    taskType === 'task1_academic'
      ? 'Task 1 (Academic Report)'
      : taskType === 'task1_gt'
      ? 'Task 1 (General Training Letter)'
      : 'Task 2 (Essay)';

  const waConfirmMessage = `Hi Jubayer, I just ordered the ${
    addWritingGuideBump
      ? `Human Writing Check + Writing Self-Prep Guide Add-on (Total BDT ${totalPrice})`
      : 'Human Writing Check (BDT 299)'
  }. Name: ${fullName.trim()}, WhatsApp: ${whatsappNumber.trim()}, TrxID: ${trxId.trim()} (${paymentMethod}), Task: ${taskTypeLabel}. Target Band: ${targetBand}. Looking forward to the review!`;

  return (
    <section
      id="human-writing-check"
      className="mt-14 pt-12 border-t-2 border-rule-strong scroll-mt-20"
      aria-labelledby="human-writing-check-title"
    >
      <div className="bg-surface-elevated border-2 border-rule-strong shadow-sm p-6 sm:p-10">
        {/* Top Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-rule">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-ivory border border-rule font-mono text-[11px] uppercase tracking-wider text-examiner-red font-semibold">
              <span>OPTIONAL PERSONAL ASSESSMENT</span>
              <span className="text-ink-subtle" aria-hidden="true">·</span>
              <span className="text-ink font-bold">BDT 299 ONLY</span>
            </div>
            <h2
              id="human-writing-check-title"
              className="mt-3 font-serif text-2xl sm:text-3xl lg:text-4xl text-ink font-normal leading-tight"
            >
              Want My Personal Assessment?{' '}
              <RedPen type="underline" seed={2}>
                Human Writing Check — BDT 299
              </RedPen>
            </h2>
          </div>

          <div className="font-mono text-right">
            <span className="block text-xs uppercase tracking-widest text-ink-muted">Personal Review Fee</span>
            <span className="font-serif text-3xl sm:text-4xl text-ink font-medium tabular-nums">BDT 299</span>
          </div>
        </div>

        {/* Value Proposition & What's Included */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-sm sm:text-base text-ink leading-relaxed">
              The free AI evaluator above gives you instant, 24/7 band descriptor matching. If you want a <strong>real human eye</strong> on your writing, upgrade to my personal review. I evaluate your script personally using the four official IELTS Writing criteria—pointing out the exact blind spots an automated tool cannot capture.
            </p>

            <div className="p-4 bg-ivory border border-rule space-y-2.5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
                What is included in your BDT 299 check:
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-violet-pen shrink-0 mt-0.5" />
                  <span><strong>One IELTS Writing Task 1 or Task 2 submission</strong> (full essay, report, or letter).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-violet-pen shrink-0 mt-0.5" />
                  <span><strong>Personal review by Jubayer Siddiki</strong> (IELTS Overall 8) using the four official IELTS Writing assessment criteria: Task Response / Task Achievement, Coherence &amp; Cohesion, Lexical Resource, and Grammatical Range &amp; Accuracy.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-violet-pen shrink-0 mt-0.5" />
                  <span><strong>Estimated band for each criterion</strong> and an <strong>estimated overall Writing band</strong> (diagnostic practice estimate based on official descriptors).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-violet-pen shrink-0 mt-0.5" />
                  <span><strong>Specific explanations of your most important weaknesses</strong> (why you are currently losing marks).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-violet-pen shrink-0 mt-0.5" />
                  <span><strong>Sentence-level corrections and practical recommendations</strong> for grammar, word choice, and cohesive devices.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <IconCheckCircle className="w-4 h-4 text-violet-pen shrink-0 mt-0.5" />
                  <span><strong>Short, prioritized action plan</strong> explaining what you should work on next before test day.</span>
                </li>
              </ul>
            </div>

            {/* Transparent Boundary Note */}
            <div className="p-3 bg-paper border border-rule font-mono text-[11px] text-ink-muted leading-relaxed">
              <strong className="text-ink">Practice Assessment Notice:</strong> This human review is an independent educational assessment conducted by Jubayer Siddiki based on published IELTS descriptors. It does not provide an official IELTS score, does not guarantee a particular band on test day, and does not claim official IELTS examiner status.
            </div>
          </div>

          {/* Right Column: CTA & Process Card */}
          <div className="lg:col-span-5 bg-paper border border-rule-strong p-6 space-y-4">
            <div className="font-mono text-xs uppercase tracking-wider text-ink-muted pb-3 border-b border-rule">
              Simple 3-Step Process
            </div>

            <ol className="space-y-3 font-mono text-xs text-ink leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-ink text-paper text-[10px] font-bold inline-flex items-center justify-center shrink-0">1</span>
                <span>Send <strong>BDT 299</strong> via bKash or Nagad Personal to <strong>{SITE_CONFIG.whatsapp.displayNumber}</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-ink text-paper text-[10px] font-bold inline-flex items-center justify-center shrink-0">2</span>
                <span>Fill the form below with your essay, prompt, and TrxID.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-ink text-paper text-[10px] font-bold inline-flex items-center justify-center shrink-0">3</span>
                <span>I personally review your script and deliver your 4-criterion feedback report directly on WhatsApp within 24–48 hours.</span>
              </li>
            </ol>

            <div className="pt-2">
              {!isOpenForm ? (
                <button
                  type="button"
                  onClick={handleOpenOrderForm}
                  className="w-full min-h-[50px] px-6 py-3.5 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  <RedPen type="underline" seed={1} drawOnHover>
                    Get My Essay Human-Checked — BDT 299
                  </RedPen>
                  <IconArrowUpRight className="w-4 h-4" />
                </button>
              ) : (
                <p className="font-mono text-xs text-violet-pen text-center font-medium">
                  ↓ Submission form open below
                </p>
              )}
            </div>

            <p className="font-mono text-[11px] text-ink-muted text-center">
              Questions first? Message Jubayer on{' '}
              <a
                href={wa('Hi Jubayer, I have a question about the BDT 299 Human Writing Check.')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWaClick('HUMAN_CHECK_QUESTIONS')}
                className="text-ink underline underline-offset-4 hover:text-violet-pen"
              >
                WhatsApp ({SITE_CONFIG.whatsapp.displayNumber})
              </a>
            </p>
          </div>
        </div>

        {/* ORDER / SUBMISSION FORM */}
        {isOpenForm && (
          <div id="human-check-order-form" className="mt-10 pt-8 border-t-2 border-rule-strong scroll-mt-20">
            {orderConfirmed ? (
              <div id="human-check-confirmed-box" className="p-6 sm:p-8 bg-ivory border-2 border-violet-pen space-y-4">
                <div className="flex items-center gap-2.5">
                  <IconCheckCircle className="w-6 h-6 text-violet-pen shrink-0" />
                  <h3 className="font-serif text-2xl text-ink font-normal">
                    Human Writing Check Order Recorded!
                  </h3>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Thank you, <strong className="text-ink">{fullName}</strong>. Your essay submission and payment details (<strong className="text-ink">TrxID: {trxId}</strong> · {paymentMethod}) have been securely logged.
                </p>

                {/* 5 Distinct Order Progress Stages */}
                <div className="p-4 bg-paper border border-rule space-y-2 font-mono text-xs">
                  <div className="text-[11px] uppercase tracking-wider text-ink font-bold pb-1 border-b border-rule">
                    Order Status &amp; Next Steps:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center pt-1">
                    <div className="p-2 bg-violet-pen text-white font-medium">
                      ✓ 1. Payment Submitted
                    </div>
                    <div className="p-2 bg-ivory border border-rule text-ink font-medium">
                      2. Payment Verified (In progress)
                    </div>
                    <div className="p-2 bg-paper border border-rule text-ink-muted">
                      3. Script Under Review
                    </div>
                    <div className="p-2 bg-paper border border-rule text-ink-muted">
                      4. Red-Pen Corrections Done
                    </div>
                    <div className="p-2 bg-paper border border-rule text-ink-muted">
                      5. Feedback Delivered (WhatsApp)
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-paper border border-rule space-y-2">
                  <p className="font-mono text-xs text-ink font-medium">
                    What happens next:
                  </p>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                    1. Tap the button below to send your confirmation ping on WhatsApp with your TrxID.<br />
                    2. I will verify the transaction and confirm receipt of your script.<br />
                    3. Your detailed 4-criterion feedback, sentence-level corrections, and prioritized action plan will be delivered directly to your WhatsApp (<strong className="text-ink">{whatsappNumber}</strong>) within 24–48 hours.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href={wa(waConfirmMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackWaClick('HUMAN_CHECK_CONFIRM_WA')}
                    className="flex-1 min-h-[48px] px-6 py-3.5 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Send Order Ping on WhatsApp</span>
                    <IconArrowUpRight className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderConfirmed(false);
                      setIsOpenForm(false);
                      setTrxId('');
                    }}
                    className="min-h-[48px] px-5 py-3.5 border border-rule-strong bg-paper hover:border-ink text-ink font-mono text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Submit Another Essay
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="space-y-6">
                <div>
                  <h3 className="font-serif text-2xl text-ink font-normal">
                    Submit Your Essay for Human Assessment (BDT 299)
                  </h3>
                  <p className="font-mono text-xs text-ink-muted mt-1">
                    Fill in your essay details and bKash/Nagad TrxID below. I will personally review your writing.
                  </p>
                </div>

                {/* 1. Student Identification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5">
                      Full Name <span className="text-examiner-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (nameError) setNameError(null);
                      }}
                      placeholder="e.g. Tanvir Ahmed"
                      className={`w-full min-h-[44px] px-3.5 py-2.5 bg-paper border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen ${
                        nameError ? 'border-examiner-red' : 'border-rule'
                      }`}
                    />
                    {nameError && (
                      <p className="mt-1 font-mono text-xs text-examiner-red">{nameError}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-mono text-xs uppercase tracking-wider text-ink">
                        WhatsApp Number <span className="text-examiner-red">*</span>
                      </label>
                      <span className="font-mono text-[11px] text-ink-muted">BD only (+880)</span>
                    </div>
                    <div className="flex items-stretch">
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-ivory border-y border-l border-rule text-ink font-mono text-xs select-none shrink-0 min-h-[44px]">
                        <span role="img" aria-label="Bangladesh flag">🇧🇩</span>
                        <span className="font-medium text-ink-muted">+880</span>
                      </span>
                      <input
                        type="tel"
                        required
                        value={whatsappNumber}
                        onChange={(e) => {
                          setWhatsappNumber(e.target.value);
                          if (phoneError) setPhoneError(null);
                        }}
                        placeholder="01XXXXXXXXX"
                        className={`w-full min-h-[44px] px-3.5 py-2.5 bg-paper border text-sm text-ink font-mono placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen ${
                          phoneError ? 'border-examiner-red' : 'border-rule'
                        }`}
                      />
                    </div>
                    {phoneError && (
                      <p className="mt-1 font-mono text-xs text-examiner-red">{phoneError}</p>
                    )}
                  </div>
                </div>

                {/* 2. Task Details & Target Band */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5">
                      Task Type <span className="text-examiner-red">*</span>
                    </label>
                    <select
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value as WritingCheckTaskType)}
                      className="w-full min-h-[44px] px-3 py-2 bg-paper border border-rule text-sm text-ink font-mono focus:outline-none focus:border-violet-pen"
                    >
                      <option value="task2_essay">Task 2: Essay (Academic / General)</option>
                      <option value="task1_academic">Task 1: Academic Report (Chart / Graph / Map / Process)</option>
                      <option value="task1_gt">Task 1: General Training Letter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5">
                      Your Target Writing Band
                    </label>
                    <select
                      value={targetBand}
                      onChange={(e) => setTargetBand(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 bg-paper border border-rule text-sm text-ink font-mono focus:outline-none focus:border-violet-pen"
                    >
                      <option value="6.5">Band 6.5</option>
                      <option value="7.0">Band 7.0 (Most common target)</option>
                      <option value="7.5">Band 7.5</option>
                      <option value="8.0">Band 8.0</option>
                    </select>
                  </div>
                </div>

                {/* 3. Question / Prompt */}
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5">
                    Essay / Report Question (Prompt)
                  </label>
                  <textarea
                    rows={2}
                    value={essayPrompt}
                    onChange={(e) => setEssayPrompt(e.target.value)}
                    placeholder="Paste the IELTS question prompt here (e.g., Some people believe that university education should be free...)"
                    className="w-full p-3 bg-paper border border-rule text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen leading-relaxed"
                  />
                </div>

                {/* 4. Essay Response */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-mono text-xs uppercase tracking-wider text-ink">
                      Your Written Response <span className="text-examiner-red">*</span>
                    </label>
                    <span className="font-mono text-xs text-ink-muted tabular-nums">
                      {wordCount} words
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    required
                    value={essayResponse}
                    onChange={(e) => {
                      setEssayResponse(e.target.value);
                      if (essayError) setEssayError(null);
                    }}
                    placeholder="Paste your full IELTS essay, report, or letter draft here..."
                    className={`w-full p-3.5 bg-paper border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen leading-relaxed font-mono ${
                      essayError ? 'border-examiner-red' : 'border-rule'
                    }`}
                  />
                  {essayError && (
                    <p className="mt-1 font-mono text-xs text-examiner-red">{essayError}</p>
                  )}
                </div>

                {/* Order Bump Card: Add Writing Self-Prep Guide for +BDT 199 */}
                <div className="p-3.5 bg-ivory border-2 border-violet-pen/50 relative">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-violet-pen font-bold bg-paper px-2 py-0.5 border border-violet-pen/30">
                      SPECIAL 1-TIME UPGRADE
                    </span>
                    <span className="font-mono text-xs text-ink-muted">
                      <span className="line-through">BDT 499</span>{' '}
                      <strong className="text-violet-pen">+BDT 199</strong>
                    </span>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={addWritingGuideBump}
                      onChange={(e) => setAddWritingGuideBump(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-violet-pen shrink-0"
                    />
                    <div className="space-y-1">
                      <p className="font-serif text-sm sm:text-base text-ink font-medium leading-snug">
                        Add the 65-Page Writing Self-Prep Guide PDF —{' '}
                        <span className="text-violet-pen font-mono font-bold">+BDT 199</span>{' '}
                        <span className="text-xs text-ink-muted">(Save BDT 300)</span>
                      </p>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        Master the exact band 7+ paragraph templates, cohesive device maps, and 40 examiner-analyzed model essays while Jubayer grades your script.
                      </p>
                    </div>
                  </label>
                </div>

                {/* 5. Payment & TrxID Instructions Box */}
                <div className="p-4 sm:p-5 bg-ivory border-2 border-rule-strong space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-rule">
                    <span className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
                      Payment Instructions ({addWritingGuideBump ? `BDT ${totalPrice}` : 'BDT 299'})
                    </span>
                    <span className="font-mono text-xs text-examiner-red font-bold">
                      Personal Account
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-ink leading-relaxed space-y-2">
                    <p>
                      Please send{' '}
                      <strong className="text-violet-pen font-bold">BDT {totalPrice}</strong>{' '}
                      to Jubayer&apos;s personal mobile financial wallet:
                    </p>
                    <div className="p-3 bg-paper border border-rule font-mono text-xs sm:text-sm space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-ink-muted">bKash Personal / Nagad Personal:</span>
                        <strong className="text-ink font-bold text-sm sm:text-base select-all">
                          {SITE_CONFIG.whatsapp.displayNumber}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-ink-muted">
                        <span>Recipient Name:</span>
                        <span>Jubayer Siddiki</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-ink-muted pt-1 border-t border-rule">
                        <span>Amount to Send:</span>
                        <span className="font-bold text-ink">
                          BDT {totalPrice} {addWritingGuideBump ? '(Essay Check + Guide PDF)' : '(Essay Check)'}
                        </span>
                      </div>
                    </div>
                    <p className="font-mono text-[11px] text-ink-muted">
                      Use the <strong>&quot;Send Money&quot;</strong> option in your bKash or Nagad app for BDT {totalPrice}. After the transfer, copy the Transaction ID (TrxID) and paste it below.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as 'bKash' | 'Nagad')}
                        className="w-full min-h-[42px] px-3 py-2 bg-paper border border-rule text-sm text-ink font-mono"
                      >
                        <option value="bKash">bKash Personal (Send Money)</option>
                        <option value="Nagad">Nagad Personal (Send Money)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                        bKash / Nagad Transaction ID (TrxID) *
                      </label>
                      <input
                        type="text"
                        required
                        value={trxId}
                        onChange={(e) => {
                          setTrxId(e.target.value);
                          if (trxError) setTrxError(null);
                        }}
                        placeholder="e.g. BJM8492KLP"
                        className={`w-full min-h-[42px] px-3 py-2 bg-paper border text-sm text-ink font-mono uppercase ${
                          trxError ? 'border-examiner-red' : 'border-rule'
                        }`}
                      />
                      {trxError && (
                        <p className="mt-1 font-mono text-xs text-examiner-red">{trxError}</p>
                      )}
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 bg-ivory border border-examiner-red font-mono text-xs text-examiner-red">
                    {submitError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <p className="font-mono text-[11px] text-ink-muted">
                    Your script and TrxID are recorded instantly. Turnaround: 24–48 hours.
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-violet-pen hover:bg-violet-pen-hover disabled:opacity-60 text-white font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>
                      {isSubmitting
                        ? 'Recording Your Order…'
                        : `Submit Essay & TrxID (BDT ${totalPrice})`}
                    </span>
                    <IconArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
