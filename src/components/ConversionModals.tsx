import React, { useEffect, useState } from 'react';
import {
  getTrafficSource,
  getWaUrl,
  trackSiteEvent,
  trackWaClick,
  WA_MESSAGES,
} from '../config';
import { GuideModuleId, SELF_PREP_SERIES_FACTS } from '../guidesConfig';
import { IconArrowUpRight, IconClose } from './EditorialGraphics';
import {
  getLatestSavedStudentLead,
  saveStoredLocalLead,
  validateWhatsappPhone,
} from './FreeRescueModal';
import { RedPen } from './RedPen';

export type ActionModalType =
  | 'paid_verification'
  | 'batch_application'
  | 'share_result'
  | 'waitlist'
  | null;

export interface ConversionModalsProps {
  activeModal: ActionModalType;
  onClose: () => void;
  defaultProduct?: string;
}

export function ConversionActionModal({
  activeModal,
  onClose,
  defaultProduct = 'Complete 4-Guide Bundle (BDT 1,499)',
}: ConversionModalsProps) {
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [targetBand, setTargetBand] = useState('7.0');
  const [currentBand, setCurrentBand] = useState('6.0');
  const [weakestSkill, setWeakestSkill] = useState('Writing');
  const [examDate, setExamDate] = useState('');
  const [trxId, setTrxId] = useState('');
  const [product, setProduct] = useState(defaultProduct);
  const [beforeBand, setBeforeBand] = useState('6.0');
  const [afterBand, setAfterBand] = useState('7.5');
  const [quote, setQuote] = useState('');
  const [consent, setConsent] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [addOrderBump, setAddOrderBump] = useState(false);

  // Determine dynamic order bump offer based on the base product
  const getOrderBumpConfig = (selectedProduct: string) => {
    if (selectedProduct.includes('Writing Self-Prep Guide') || selectedProduct.includes('Reading') || selectedProduct.includes('Speaking') || selectedProduct.includes('Listening')) {
      return {
        title: 'Add 1 Human Essay Check by Jubayer',
        bumpPrice: 199,
        originalPrice: 299,
        description: 'Submit 1 Task 1 or Task 2 essay. Get sentence-level corrections, 4 official criteria band breakdown, and prioritized action plan within 24–48h.',
        tag: 'SPECIAL CHECKOUT UPGRADE',
        addonName: 'Human Essay Check (BDT 199 Add-on)',
      };
    }
    if (selectedProduct.includes('Human Writing Check')) {
      return {
        title: 'Add Writing Self-Prep Guide (65-Page PDF)',
        bumpPrice: 299,
        originalPrice: 499,
        description: 'Complete 65-page band 7+ framework: paragraph templates, linking words, examiner scoring rubrics, and high-scoring sample essays.',
        tag: 'SPECIAL COMBO UPGRADE',
        addonName: 'Writing Self-Prep Guide PDF (BDT 299 Add-on)',
      };
    }
    if (selectedProduct.includes('Complete 4-Guide Bundle')) {
      return {
        title: 'Add 1 Human Essay Check + 1 Speaking Diagnostic',
        bumpPrice: 399,
        originalPrice: 798,
        description: 'Get your writing reviewed personally plus a 1-to-1 live speaking diagnostic session on Google Meet.',
        tag: 'VIP BUNDLE UPGRADE',
        addonName: 'Writing + Speaking VIP Diagnostic (BDT 399 Add-on)',
      };
    }
    return null;
  };

  const bumpConfig = activeModal === 'paid_verification' ? getOrderBumpConfig(product) : null;

  // Extract base price number from product string e.g. "Writing Self-Prep Guide (BDT 499)" -> 499
  const basePriceMatch = product.match(/BDT\s*([\d,]+)/i);
  const basePriceNum = basePriceMatch ? parseInt(basePriceMatch[1].replace(/,/g, ''), 10) : 499;
  const totalAmount = addOrderBump && bumpConfig ? basePriceNum + bumpConfig.bumpPrice : basePriceNum;

  useEffect(() => {
    if (!activeModal) return;
    setSubmitted(false);
    setErrorMsg(null);
    setAddOrderBump(false);
    if (defaultProduct) setProduct(defaultProduct);

    const saved = getLatestSavedStudentLead();
    if (saved) {
      setFullName(saved.fullName || '');
      setWhatsappNumber(
        saved.normalizedWhatsapp
          ? saved.normalizedWhatsapp.replace(/^\+88/, '')
          : ''
      );
      if (saved.targetBand) setTargetBand(saved.targetBand);
    }
  }, [activeModal, defaultProduct]);

  if (!activeModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const phoneValidation = validateWhatsappPhone(whatsappNumber);
    if (!phoneValidation.valid) {
      setErrorMsg(phoneValidation.error || 'Please enter a valid BD WhatsApp number.');
      return;
    }

    if (activeModal === 'paid_verification' && !trxId.trim()) {
      setErrorMsg('Please enter your bKash/Nagad/Bank Transaction ID (TrxID).');
      return;
    }

    if (activeModal === 'share_result' && !quote.trim()) {
      setErrorMsg('Please write a short sentence on what helped you improve.');
      return;
    }

    if (!consent) {
      setErrorMsg('Please check the permission/consent box to submit.');
      return;
    }

    saveStoredLocalLead({
      normalizedWhatsapp: phoneValidation.normalized,
      fullName: fullName.trim(),
      submittedAt: new Date().toISOString(),
      targetBand,
      weakestSkill: weakestSkill.toLowerCase(),
    });

    const sheetTab =
      activeModal === 'paid_verification'
        ? 'payments'
        : activeModal === 'batch_application'
        ? 'batch_applications'
        : activeModal === 'share_result'
        ? 'results_submissions'
        : 'waitlist';

    const finalProduct = addOrderBump && bumpConfig
      ? `${product} + ${bumpConfig.addonName} (Total: BDT ${totalAmount.toLocaleString()})`
      : product;

    if (activeModal === 'paid_verification') {
      trackSiteEvent('paid_form_submitted', { product: finalProduct, trxId: trxId.trim() });
    } else if (activeModal === 'batch_application') {
      trackSiteEvent('batch_application_submitted', { targetBand, weakestSkill });
    } else if (activeModal === 'share_result') {
      trackSiteEvent('result_submitted', { beforeBand, afterBand });
    } else {
      trackSiteEvent('waitlist_joined', { targetBand, weakestSkill });
    }

    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: fullName.trim(),
        whatsappNumber: phoneValidation.display,
        targetBand,
        currentBand,
        weakestSkill,
        examDate,
        trxId: trxId.trim(),
        product: finalProduct,
        beforeBand,
        afterBand,
        quote: quote.trim(),
        consent: true,
        src: getTrafficSource(),
        door: activeModal,
        source: activeModal,
        guide: finalProduct,
        sheetTab,
      }),
    }).catch(() => {});

    setSubmitted(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-paper text-ink border border-rule-strong shadow-xl p-6 sm:p-8 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-rule">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-examiner-red block">
              {activeModal === 'paid_verification' && 'PAYMENT VERIFICATION · FAST DELIVERY'}
              {activeModal === 'batch_application' && '12-WEEK CORE BATCH · APPLICATION'}
              {activeModal === 'share_result' && 'STUDENT RESULT SUBMISSION'}
              {activeModal === 'waitlist' && 'RECORDED COURSE WAITLIST · COMING LATER'}
            </span>
            <h3 className="mt-1 font-serif text-2xl sm:text-3xl text-ink font-normal">
              {activeModal === 'paid_verification' && "I've Paid — Verify My Order"}
              {activeModal === 'batch_application' && 'Apply for the 12-Week Live Batch'}
              {activeModal === 'share_result' && 'Share Your IELTS Result'}
              {activeModal === 'waitlist' && 'Join the Recorded Course Waitlist'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 inline-flex items-center justify-center border border-rule text-ink-muted hover:text-ink hover:border-ink cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 space-y-4">
            <div className="p-4 bg-ivory border border-rule-strong">
              <p className="font-serif text-xl text-ink">
                {activeModal === 'paid_verification' && 'Payment details recorded!'}
                {activeModal === 'batch_application' && 'Batch application received!'}
                {activeModal === 'share_result' && 'Thank you for sharing your result!'}
                {activeModal === 'waitlist' && 'You are on the priority waitlist!'}
              </p>
              <p className="mt-1.5 text-xs sm:text-sm text-ink-muted leading-relaxed">
                {activeModal === 'paid_verification' &&
                  `Your TrxID (${trxId}) for ${addOrderBump && bumpConfig ? `${product} + ${bumpConfig.addonName}` : product} has been logged. ${
                    product.includes('Speaking Mocks')
                      ? 'Scheduling for your 3 Google Meet sessions will be coordinated directly through WhatsApp.'
                      : product.includes('Human Writing Check')
                      ? 'Your personal 4-criterion feedback report will be delivered directly on WhatsApp within 24–48 hours.'
                      : SELF_PREP_SERIES_FACTS.deliveryNote
                  } Tap below to send a quick WhatsApp ping to Jubayer for instant confirmation:`}
                {activeModal === 'batch_application' &&
                  'Your diagnostic profile has been saved to batch_applications. Tap below to message Jubayer on WhatsApp to confirm your batch schedule:'}
                {activeModal === 'share_result' &&
                  'Your score progression has been saved to results_submissions.'}
                {activeModal === 'waitlist' &&
                  'We will message you on WhatsApp as soon as the self-paced recorded course opens.'}
              </p>
            </div>

            {activeModal !== 'share_result' && (
              <a
                href={getWaUrl(
                  activeModal === 'paid_verification'
                    ? `Hi Jubayer, I just submitted the "I've Paid" form. Name: ${fullName}, Product: ${
                        addOrderBump && bumpConfig
                          ? `${product} + ${bumpConfig.addonName} (BDT ${totalAmount.toLocaleString()})`
                          : product
                      }, TrxID: ${trxId}.`
                    : activeModal === 'batch_application'
                    ? `Hi Jubayer, I just applied for the 12-Week Core Batch (BDT 7,999). Name: ${fullName}, Current Band: ${currentBand}, Target Band: ${targetBand}, Weakest Skill: ${weakestSkill}.`
                    : `Hi Jubayer, I just joined the Recorded Course Waitlist. My target is Band ${targetBand} and my weakest skill is ${weakestSkill}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWaClick(`MODAL_CONFIRM_${activeModal.toUpperCase()}`)}
                className="w-full min-h-[46px] px-5 py-3 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors"
              >
                <span>Confirm with Jubayer on WhatsApp</span>
                <IconArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[42px] border border-rule-strong bg-paper hover:border-ink text-ink font-mono text-xs uppercase tracking-wider cursor-pointer"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {activeModal === 'paid_verification' && (
              <div className="p-3.5 bg-ivory border border-rule text-xs text-ink-muted leading-relaxed space-y-1.5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink font-medium">
                  HOW PAYMENT & DELIVERY WORKS:
                </p>
                <p>
                  1. Message Jubayer on WhatsApp (<strong className="text-ink">01305-273703</strong>) first to get the active bKash / Nagad / Bank details.
                </p>
                <p>
                  2. After sending payment, submit your <strong className="text-ink">TrxID</strong> below. {SELF_PREP_SERIES_FACTS.deliveryNote}
                </p>
                <a
                  href={getWaUrl(
                    `Hi Jubayer, please share your bKash/Nagad number so I can pay for ${product}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWaClick('PAID_MODAL_ASK_NUMBER')}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-violet-pen underline underline-offset-4"
                >
                  <span>Need the bKash/Nagad number first? Message on WhatsApp</span>
                  <IconArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                  WhatsApp (+880) *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono"
                />
              </div>
            </div>

            {activeModal === 'paid_verification' && (
              <>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                    Product Purchased *
                  </label>
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono"
                  >
                    <option value="Human Writing Check (BDT 299)">
                      Human Writing Check (Task 1 or Task 2) — BDT 299
                    </option>
                    <option value="3 Live IELTS Speaking Mocks (BDT 499)">
                      3 Live IELTS Speaking Mocks (Google Meet) — BDT 499
                    </option>
                    <option value="Complete 4-Guide Bundle (BDT 1,499)">
                      Complete 4-Guide Bundle — BDT 1,499 (Save BDT 500)
                    </option>
                    <option value="Writing Self-Prep Guide (BDT 499)">
                      Writing Self-Prep Guide (65p) — BDT 499
                    </option>
                    <option value="Reading Self-Prep Guide (BDT 499)">
                      Reading Self-Prep Guide (48p) — BDT 499
                    </option>
                    <option value="Speaking Self-Prep Guide (BDT 499)">
                      Speaking Self-Prep Guide (59p) — BDT 499
                    </option>
                    <option value="Listening Self-Prep Guide (BDT 499)">
                      Listening Self-Prep Guide (50p) — BDT 499
                    </option>
                    <option value="12-Week Core Batch (BDT 7,999)">
                      12-Week Core Batch — BDT 7,999 (Founding Batch)
                    </option>
                    <option value="1-Month 1-to-1 Live Crash Course (BDT 9,999)">
                      1-Month 1-to-1 Live Crash Course — BDT 9,999
                    </option>
                  </select>
                </div>
                {bumpConfig && (
                  <div className="p-3.5 bg-ivory border-2 border-violet-pen/50 relative">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-violet-pen font-bold bg-paper px-2 py-0.5 border border-violet-pen/30">
                        {bumpConfig.tag}
                      </span>
                      <span className="font-mono text-xs text-ink-muted">
                        <span className="line-through">BDT {bumpConfig.originalPrice}</span>{' '}
                        <strong className="text-violet-pen">+BDT {bumpConfig.bumpPrice}</strong>
                      </span>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={addOrderBump}
                        onChange={(e) => setAddOrderBump(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-violet-pen shrink-0"
                      />
                      <div className="space-y-1">
                        <p className="font-serif text-sm sm:text-base text-ink font-medium leading-snug">
                          {bumpConfig.title} —{' '}
                          <span className="text-violet-pen font-mono font-bold">
                            +BDT {bumpConfig.bumpPrice}
                          </span>
                        </p>
                        <p className="text-xs text-ink-muted leading-relaxed">
                          {bumpConfig.description}
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                <div className="p-3 bg-paper border border-rule font-mono text-xs flex items-center justify-between">
                  <span className="text-ink-muted uppercase tracking-wider text-[11px]">
                    Total Payment Due:
                  </span>
                  <div className="text-right">
                    <span className="font-serif text-base sm:text-lg text-ink font-semibold tabular-nums">
                      BDT {totalAmount.toLocaleString()}
                    </span>
                    {addOrderBump && bumpConfig && (
                      <span className="block text-[10px] text-violet-pen">
                        Includes {bumpConfig.addonName}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                    bKash / Nagad / Bank Transaction ID (TrxID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. BJM8492KLP"
                    className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono uppercase"
                  />
                </div>
              </>
            )}

            {activeModal === 'batch_application' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                      Current Band *
                    </label>
                    <select
                      value={currentBand}
                      onChange={(e) => setCurrentBand(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono"
                    >
                      <option value="Not taken yet">Not taken yet</option>
                      <option value="5.0 - 5.5">Band 5.0 – 5.5</option>
                      <option value="6.0">Band 6.0</option>
                      <option value="6.5">Band 6.5</option>
                      <option value="7.0+">Band 7.0+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                      Target Band *
                    </label>
                    <select
                      value={targetBand}
                      onChange={(e) => setTargetBand(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono"
                    >
                      <option value="6.5">Band 6.5</option>
                      <option value="7.0">Band 7.0</option>
                      <option value="7.5">Band 7.5</option>
                      <option value="8.0+">Band 8.0+</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                      Weakest Skill *
                    </label>
                    <select
                      value={weakestSkill}
                      onChange={(e) => setWeakestSkill(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono"
                    >
                      <option value="Writing">Writing</option>
                      <option value="Reading">Reading</option>
                      <option value="Speaking">Speaking</option>
                      <option value="Listening">Listening</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                      Target Exam Date
                    </label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            {activeModal === 'share_result' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                      Before Band *
                    </label>
                    <select
                      value={beforeBand}
                      onChange={(e) => setBeforeBand(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono"
                    >
                      <option value="5.5">Band 5.5</option>
                      <option value="6.0">Band 6.0</option>
                      <option value="6.5">Band 6.5</option>
                      <option value="7.0">Band 7.0</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                      After Band Achieved *
                    </label>
                    <select
                      value={afterBand}
                      onChange={(e) => setAfterBand(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono"
                    >
                      <option value="6.5">Band 6.5</option>
                      <option value="7.0">Band 7.0</option>
                      <option value="7.5">Band 7.5</option>
                      <option value="8.0">Band 8.0</option>
                      <option value="8.5">Band 8.5</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                    Short Quote (What changed your score?) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="e.g. Fixing my Task 2 paragraph structure and T/F/NG qualifier logic jumped my score in 5 weeks."
                    className="w-full p-3 bg-surface-elevated border border-rule-strong text-sm text-ink"
                  />
                </div>
              </>
            )}

            {activeModal === 'waitlist' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                    Target Band *
                  </label>
                  <select
                    value={targetBand}
                    onChange={(e) => setTargetBand(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono"
                  >
                    <option value="6.5">Band 6.5</option>
                    <option value="7.0">Band 7.0</option>
                    <option value="7.5">Band 7.5</option>
                    <option value="8.0+">Band 8.0+</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1">
                    Weakest Skill *
                  </label>
                  <select
                    value={weakestSkill}
                    onChange={(e) => setWeakestSkill(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono"
                  >
                    <option value="Writing">Writing</option>
                    <option value="Reading">Reading</option>
                    <option value="Speaking">Speaking</option>
                    <option value="Listening">Listening</option>
                  </select>
                </div>
              </div>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 accent-violet-pen"
              />
              <span className="font-mono text-[11px] text-ink-muted leading-relaxed">
                {activeModal === 'share_result'
                  ? 'I give permission to display my first name, band progression, and quote on IELTS DECODED (personal IDs/TRF numbers blurred). I agree to get WhatsApp/email messages from IELTS DECODED. Reply STOP to opt out.'
                  : 'I agree to get WhatsApp/email messages from IELTS DECODED. Reply STOP to opt out.'}
              </span>
            </label>

            {errorMsg && (
              <p className="font-mono text-xs text-examiner-red">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full min-h-[46px] px-6 py-3 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-xs uppercase tracking-wider cursor-pointer"
            >
              {activeModal === 'paid_verification' && 'Submit TrxID & Verify Payment'}
              {activeModal === 'batch_application' && 'Submit 12-Week Batch Application'}
              {activeModal === 'share_result' && 'Submit My IELTS Result'}
              {activeModal === 'waitlist' && 'Join Recorded Course Waitlist'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Item 4, 5, 7: Price Ladder (5 Rungs), "Which Option Fits Me?" Diagnostic Box,
 * and Value-vs-Price Block (Cost of 1 More IELTS Attempt vs Fixing It Once).
 */
export function PriceLadderAndOptionFitSection({
  onOpenRescueModal,
  onOpenActionModal,
}: {
  onOpenRescueModal: (source: string, sampleModuleId?: GuideModuleId | null) => void;
  onOpenActionModal: (type: ActionModalType, defaultProduct?: string) => void;
}) {
  const [fitTargetBand, setFitTargetBand] = useState<'6.5' | '7.0' | '7.5+'>('7.0');
  const [fitWeakestSkill, setFitWeakestSkill] = useState<GuideModuleId>('writing');
  const [fitWeeks, setFitWeeks] = useState<'under_3' | '4_to_8' | '8_plus'>('4_to_8');

  const getSingleRecommendation = () => {
    const skillLabel =
      fitWeakestSkill.charAt(0).toUpperCase() + fitWeakestSkill.slice(1);
    const pageMap: Record<GuideModuleId, number> = {
      listening: 50,
      reading: 48,
      writing: 65,
      speaking: 59,
    };

    if (fitWeeks === 'under_3') {
      return {
        badge: 'URGENT TIMELINE (< 3 WEEKS TO EXAM)',
        title: `1-Month 1-to-1 Live Crash Course (BDT 9,999) + ${skillLabel} Guide`,
        price: 'BDT 9,999 Private 1-to-1 (or Start with BDT 499 Guide)',
        reason: `With less than 3 weeks left for a Band ${fitTargetBand} target, you do not have time for a 12-week cycle. You need direct 1-to-1 red-pen correction on your ${skillLabel} mistakes immediately (BDT 9,999 for 4 live 1-to-1 classes/week), paired with the ${pageMap[fitWeakestSkill]}-page ${skillLabel} Guide.`,
        waMessage: `Hi Jubayer, I used the "Which option fits me?" tool. My exam is in under 3 weeks, my target is Band ${fitTargetBand}, and my weakest skill is ${skillLabel}. Please share details for the 1-to-1 Crash Course (BDT 9,999) + ${skillLabel} Guide.`,
        ctaLabel: 'Book 1-to-1 Crash Slot on WhatsApp',
      };
    }

    if (fitWeeks === '4_to_8') {
      return {
        badge: 'BEST FIT FOR 4–8+ WEEKS · COMPLETE GUIDED SYSTEM',
        title: '12-Week Core Batch (BDT 7,999) — Or Start With the BDT 499 Guide',
        price: 'BDT 7,999 Founding Batch (Regular BDT 9,999 · 50% PDF Fee Credit Applies)',
        reason: `To reach Band ${fitTargetBand} while fixing ${skillLabel}, you have the right window for structured live classes, full mock tests, and line-by-line examiner feedback. Want to test the system on your own first? Grab the ${pageMap[fitWeakestSkill]}-page ${skillLabel} Guide for BDT 499—50% is credited if you join the batch within 14 days.`,
        waMessage: `Hi Jubayer, I used the "Which option fits me?" tool. My target is Band ${fitTargetBand}, weakest skill is ${skillLabel}, and I have 4–8+ weeks. I want to ask about the 12-Week Batch (BDT 7,999) / ${skillLabel} Guide (BDT 499).`,
        ctaLabel: 'Message Jubayer This Recommendation on WhatsApp',
      };
    }

    return {
      badge: 'SELF-PACED FOUNDATION (8+ WEEKS TO EXAM)',
      title: `Complete 4-Guide Self-Prep Bundle (BDT 1,499) or ${skillLabel} Guide (BDT 499)`,
      price: 'BDT 499 Single Module · BDT 1,499 All 4 Guides (Save BDT 500)',
      reason: `Since you have 8+ weeks to build toward Band ${fitTargetBand}, start with the ${pageMap[fitWeakestSkill]}-page ${skillLabel} Self-Prep Guide (BDT 499) or all 4 guides (222 pages total for BDT 1,499). If you decide to join the live batch later, 50% of your PDF fee is deducted.`,
      waMessage: `Hi Jubayer, I used the "Which option fits me?" tool. My target is Band ${fitTargetBand} and my weakest skill is ${skillLabel}. I want to start with the Self-Prep Guide (BDT 499 / All 4 for BDT 1,499).`,
      ctaLabel: `Get the ${skillLabel} Guide / Bundle on WhatsApp`,
    };
  };

  const rec = getSingleRecommendation();

  return (
    <div className="space-y-10">
      {/* Item 5: "Which option fits me?" Interactive Diagnostic Selector */}
      <div className="border-2 border-ink bg-paper p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-rule">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-examiner-red block">
              30-SECOND DECISION ENGINE · ZERO GUESSWORK
            </span>
            <h3 className="mt-1 font-serif text-2xl sm:text-3xl text-ink font-normal">
              Which option{' '}
              <RedPen type="underline" seed={5}>
                fits me
              </RedPen>{' '}
              right now?
            </h3>
          </div>
          <p className="font-mono text-xs text-ink-muted">
            Select your target band, weakest skill, and weeks until exam for ONE exact recommendation.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Target Band */}
          <div className="p-4 bg-ivory border border-rule">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-muted mb-2">
              1. Your Target Band
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['6.5', '7.0', '7.5+'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    setFitTargetBand(b);
                    trackSiteEvent('option_fit_answered', {
                      targetBand: b,
                      weakestSkill: fitWeakestSkill,
                      weeks: fitWeeks,
                    });
                  }}
                  className={`py-2 font-mono text-xs border transition-colors cursor-pointer ${
                    fitTargetBand === b
                      ? 'bg-ink text-paper border-ink font-medium'
                      : 'bg-paper text-ink border-rule hover:border-ink'
                  }`}
                >
                  Band {b}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Weakest Skill */}
          <div className="p-4 bg-ivory border border-rule">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-muted mb-2">
              2. Your Weakest Skill
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'writing', label: 'Writing' },
                  { id: 'reading', label: 'Reading' },
                  { id: 'speaking', label: 'Speaking' },
                  { id: 'listening', label: 'Listening' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setFitWeakestSkill(s.id);
                    trackSiteEvent('option_fit_answered', {
                      targetBand: fitTargetBand,
                      weakestSkill: s.id,
                      weeks: fitWeeks,
                    });
                  }}
                  className={`py-2 font-mono text-xs border transition-colors cursor-pointer ${
                    fitWeakestSkill === s.id
                      ? 'bg-ink text-paper border-ink font-medium'
                      : 'bg-paper text-ink border-rule hover:border-ink'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Weeks to Exam */}
          <div className="p-4 bg-ivory border border-rule">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-muted mb-2">
              3. Weeks Until Your Exam
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'under_3' as const, label: '< 3 Wks' },
                { id: '4_to_8' as const, label: '4–8 Wks' },
                { id: '8_plus' as const, label: '8+ Wks' },
              ].map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setFitWeeks(w.id);
                    trackSiteEvent('option_fit_answered', {
                      targetBand: fitTargetBand,
                      weakestSkill: fitWeakestSkill,
                      weeks: w.id,
                    });
                  }}
                  className={`py-2 font-mono text-xs border transition-colors cursor-pointer ${
                    fitWeeks === w.id
                      ? 'bg-ink text-paper border-ink font-medium'
                      : 'bg-paper text-ink border-rule hover:border-ink'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Single Output Recommendation */}
        <div className="mt-6 p-5 sm:p-6 bg-surface-elevated border border-rule-strong flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <span className="font-mono text-[10px] uppercase tracking-widest text-violet-pen block">
              {rec.badge}
            </span>
            <h4 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              {rec.title}
            </h4>
            <p className="font-mono text-xs text-examiner-red font-medium">
              {rec.price}
            </p>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed pt-1">
              {rec.reason}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <a
              href={getWaUrl(rec.waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWaClick('OPTION_FIT_RECOMMENDATION')}
              className="min-h-[46px] px-5 py-3 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors"
            >
              <span>{rec.ctaLabel}</span>
              <IconArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() =>
                onOpenRescueModal(
                  `Option Fit Sample (${fitWeakestSkill})`,
                  fitWeakestSkill
                )
              }
              className="min-h-[40px] px-4 py-2 border border-rule-strong bg-paper hover:border-ink text-ink font-mono text-[11px] uppercase tracking-wider cursor-pointer"
            >
              Or Download Free 5-Page {fitWeakestSkill} Sample First
            </button>
          </div>
        </div>
      </div>

      {/* Item 4: The 4-Tier Value Ladder */}
      <div className="border border-rule-strong bg-ivory p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-rule">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-examiner-red block">
              ASCENDING VALUE LADDER · CHOOSE YOUR LEVEL OF SUPPORT
            </span>
            <h3 className="mt-1 font-serif text-2xl sm:text-3xl text-ink font-normal">
              4 Clear Ways to Reach Your Target Band
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onOpenActionModal('paid_verification')}
            className="font-mono text-xs text-violet-pen underline underline-offset-4 hover:text-ink cursor-pointer self-start sm:self-auto"
          >
            Already paid via bKash/Nagad? Submit TrxID here →
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tier 1: Free Diagnostic */}
          <div className="p-4 bg-paper border border-rule flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                  TIER 01 · FREE
                </span>
                <span className="px-2 py-0.5 bg-ivory border border-rule font-mono text-[10px] text-ink-muted uppercase">
                  Zero Risk
                </span>
              </div>
              <h4 className="mt-2 font-serif text-lg text-ink font-medium">Free Diagnostic &amp; Tools</h4>
              <p className="mt-1 font-mono text-base text-ink font-bold">BDT 0</p>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                38-page Rescue PDF, 5-page module previews, AI Writing Evaluator, Study Planner &amp; Band Score Calculator.
              </p>
            </div>
            <a
              href="/diagnostic"
              className="mt-4 min-h-[40px] px-3.5 py-2 border border-ink text-ink hover:bg-ink hover:text-paper font-mono text-[11px] uppercase tracking-wider inline-flex items-center justify-center transition-colors text-center"
            >
              Test Free Diagnostic →
            </a>
          </div>

          {/* Tier 2: Micro-Diagnostic Services */}
          <div className="p-4 bg-paper border-2 border-rule-strong flex flex-col justify-between relative">
            <div className="absolute -top-3 right-3 px-2 py-0.5 bg-examiner-red text-white font-mono text-[9px] uppercase tracking-wider font-bold">
              POPULAR MICRO-FIX
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-examiner-red font-semibold">
                  TIER 02 · PERSONAL EVAL
                </span>
              </div>
              <h4 className="mt-2 font-serif text-lg text-ink font-medium">Personal Diagnostic Checks</h4>
              <p className="mt-1 font-mono text-base text-ink font-bold">
                BDT 299 <span className="text-xs font-normal text-ink-muted">/ BDT 499</span>
              </p>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                <strong>BDT 299:</strong> 1 Essay Human Check with 4-criterion band breakdown &amp; line-by-line red pen.<br />
                <strong>BDT 499:</strong> 3 Live Speaking Mocks on Google Meet (1-to-1).
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              <a
                href="/diagnostic#human-writing-check"
                className="min-h-[36px] px-3 py-1.5 bg-ink text-paper hover:bg-ink-muted font-mono text-[10px] uppercase tracking-wider inline-flex items-center justify-center transition-colors text-center"
              >
                Human Writing Check (BDT 299) →
              </a>
              <a
                href="/#speaking-mocks"
                className="min-h-[36px] px-3 py-1.5 border border-ink text-ink hover:bg-ivory font-mono text-[10px] uppercase tracking-wider inline-flex items-center justify-center transition-colors text-center"
              >
                3 Speaking Mocks (BDT 499) →
              </a>
            </div>
          </div>

          {/* Tier 3: Complete Self-Prep Guides */}
          <div className="p-4 bg-paper border border-rule-strong flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink font-semibold">
                  TIER 03 · SELF-PREP
                </span>
                <span className="px-1.5 py-0.5 bg-ivory border border-rule font-mono text-[9px] text-ink-muted">
                  50% Credit
                </span>
              </div>
              <h4 className="mt-2 font-serif text-lg text-ink font-medium">4-Module Self-Prep Series</h4>
              <p className="mt-1 font-mono text-base text-ink font-bold">
                BDT 499 <span className="text-xs font-normal text-ink-muted">ea / BDT 1,499 All 4</span>
              </p>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                222 pages across Listening (50p), Reading (48p), Writing (65p), Speaking (59p). Includes 50% fee credit toward live batches within 14 days.
              </p>
            </div>
            <a
              href="/guides"
              className="mt-4 min-h-[40px] px-3.5 py-2 border border-rule-strong bg-ivory hover:border-ink text-ink font-mono text-[11px] uppercase tracking-wider inline-flex items-center justify-center transition-colors text-center"
            >
              Inspect Self-Prep Guides →
            </a>
          </div>

          {/* Tier 4: Core Live Batch & 1-to-1 Mentorship */}
          <div className="p-4 bg-paper border-2 border-violet-pen flex flex-col justify-between relative">
            <div className="absolute -top-3 right-3 px-2 py-0.5 bg-violet-pen text-white font-mono text-[9px] uppercase tracking-wider font-bold">
              MAXIMUM RESULTS
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-violet-pen font-bold">
                  TIER 04 · LIVE MENTORSHIP
                </span>
              </div>
              <h4 className="mt-2 font-serif text-lg text-ink font-medium">12-Wk Batch or 1-to-1 Crash</h4>
              <p className="mt-1 font-mono text-base text-violet-pen font-bold">
                BDT 7,999 <span className="text-xs font-normal text-ink-muted">/ BDT 9,999</span>
              </p>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                <strong>12-Week Batch:</strong> 36 live interactive classes (10 seats only), 5 full mocks.<br />
                <strong>1-to-1 Crash:</strong> 4 private classes/week customized to your exam date.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenActionModal('batch_application')}
              className="mt-4 min-h-[40px] px-3.5 py-2 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-[11px] uppercase tracking-wider inline-flex items-center justify-center transition-colors cursor-pointer text-center"
            >
              Apply for Live Cohort →
            </button>
          </div>
        </div>

        {/* Item 7: Value-vs-Price Line */}
        <div className="mt-5 pt-4 border-t border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-ink-muted">
          <span>
            <strong className="text-ink">Value vs. Retake Cost:</strong> One extra IELTS attempt costs ~BDT 22,500+ (check the current fee with British Council / IDP) plus 4–8 weeks of lost visa/admission time.
          </span>
          <a
            href="#free-guide"
            className="text-ink underline underline-offset-4 hover:text-violet-pen shrink-0"
          >
            Can’t afford a program yet? Start with the free tools →
          </a>
        </div>
      </div>
    </div>
  );
}
