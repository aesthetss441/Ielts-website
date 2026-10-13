import React, { useEffect, useRef, useState } from 'react';
import {
  getTrafficSource,
  getWaUrl,
  SITE_CONFIG,
  trackSiteEvent,
  trackWaClick,
} from '../config';
import { GuideModuleId, getGuideById } from '../guidesConfig';
import { generateAndDownloadSampleChapterPdf } from '../utils/sampleChapterPdfGenerator';
import { IconArrowDown, IconArrowUpRight, IconClose } from './EditorialGraphics';
import { RedPen } from './RedPen';

export interface StoredLocalLead {
  normalizedWhatsapp: string;
  fullName: string;
  submittedAt: string;
  targetBand?: string;
  weakestSkill?: string;
  email?: string;
}

const LOCAL_LEADS_STORAGE_KEY = 'ielts_decoded_submitted_leads_v1';

export function getStoredLocalLeads(): StoredLocalLead[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_LEADS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredLocalLead(lead: StoredLocalLead): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredLocalLeads().filter(
      (item) => item.normalizedWhatsapp !== lead.normalizedWhatsapp
    );
    existing.unshift(lead);
    window.localStorage.setItem(
      LOCAL_LEADS_STORAGE_KEY,
      JSON.stringify(existing.slice(0, 20))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function getLatestSavedStudentLead(): StoredLocalLead | null {
  const leads = getStoredLocalLeads();
  return leads.length > 0 ? leads[0] : null;
}

const BD_OPERATOR_PREFIXES = new Set([
  '013',
  '014',
  '015',
  '016',
  '017',
  '018',
  '019',
]);

const DUMMY_SUBSCRIBER_SEQUENCES = new Set([
  '12345678',
  '23456789',
  '34567890',
  '01234567',
  '87654321',
  '98765432',
  '76543210',
  '12341234',
  '12121212',
  '01010101',
  '10101010',
  '00001111',
  '11110000',
  '11223344',
  '55667788',
]);

export function validateWhatsappPhone(raw: string): {
  valid: boolean;
  normalized: string;
  display: string;
  error?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Please enter your WhatsApp number.',
    };
  }

  if (!/^[+\d\s\-()]+$/.test(trimmed)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Please enter digits only (e.g. 017XXXXXXXX).',
    };
  }

  let digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.startsWith('8801')) {
    digitsOnly = digitsOnly.slice(2);
  } else if (digitsOnly.startsWith('88') && digitsOnly.length >= 12) {
    digitsOnly = digitsOnly.slice(2);
  }

  if (digitsOnly.length === 10 && /^[3-9]/.test(digitsOnly)) {
    digitsOnly = '0' + digitsOnly;
  } else if (digitsOnly.length === 10 && digitsOnly.startsWith('1')) {
    digitsOnly = '0' + digitsOnly;
  }

  if (!digitsOnly.startsWith('01')) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error:
        'Only Bangladeshi WhatsApp numbers are accepted (11 digits starting with 013–019).',
    };
  }

  if (digitsOnly.length !== 11) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: `Bangladeshi WhatsApp numbers must be exactly 11 digits (e.g. 017XXXXXXXX). You entered ${digitsOnly.length} digits.`,
    };
  }

  const prefix = digitsOnly.slice(0, 3);
  if (!BD_OPERATOR_PREFIXES.has(prefix)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: `Invalid operator prefix "${prefix}". Use 013, 014, 015, 016, 017, 018, or 019.`,
    };
  }

  const subscriber = digitsOnly.slice(3);

  if (/^(\d)\1{7}$/.test(subscriber)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error:
        'Dummy or repeated number detected. Please enter your real active WhatsApp number.',
    };
  }

  if (/(\d)\1{5,}/.test(subscriber)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error:
        'Invalid number (too many repeated digits). Please enter your real WhatsApp number.',
    };
  }

  if (DUMMY_SUBSCRIBER_SEQUENCES.has(subscriber)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error:
        'Sequential dummy number detected. Please enter your real active WhatsApp number.',
    };
  }

  const uniqueSubscriberDigits = new Set(subscriber.split('')).size;
  if (uniqueSubscriberDigits < 3) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error:
        'Please enter a genuine, active WhatsApp number (dummy numbers not accepted).',
    };
  }

  const uniqueTotalDigits = new Set(digitsOnly.split('')).size;
  if (uniqueTotalDigits < 4) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Please enter a valid active WhatsApp number.',
    };
  }

  return {
    valid: true,
    normalized: `+88${digitsOnly}`,
    display: digitsOnly,
  };
}

export function triggerAutomaticPdfDownload(url: string, fileName: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', fileName);
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

const SKILL_TIPS: Record<
  GuideModuleId,
  {
    skillLabel: string;
    oneTip: string;
    guideTitle: string;
    guidePages: number;
  }
> = {
  writing: {
    skillLabel: 'Writing (Task 1 & Task 2)',
    oneTip:
      'Cut memorised openings ("In this modern era..."). Write a 2-sentence introduction: Sentence 1 paraphrases the prompt tension; Sentence 2 states your clear position + 2 specific reasons.',
    guideTitle: 'Writing Self-Prep Guide',
    guidePages: 65,
  },
  reading: {
    skillLabel: 'Reading (T/F/NG & Headings)',
    oneTip:
      'Stop rereading whole paragraphs. Box the anchor noun to locate the 3-sentence window in 20 seconds, then circle the controlling qualifier ("mainly", "all", "more than") to separate FALSE from NOT GIVEN.',
    guideTitle: 'Reading Self-Prep Guide',
    guidePages: 48,
  },
  speaking: {
    skillLabel: 'Speaking (Part 2 & Part 3)',
    oneTip:
      'Never answer Part 2 bullet points one by one—you will freeze at 45 seconds. Use the 3-Phase Story Arc (Before -> The Turning Point Moment -> Impact Today) to speak effortlessly for 2 full minutes.',
    guideTitle: 'Speaking Self-Prep Guide',
    guidePages: 59,
  },
  listening: {
    skillLabel: 'Listening (Part 3 & Part 4)',
    oneTip:
      'In Part 3 multiple choice, both speakers mention all 3 options on purpose. Never write down the first match—wait for the contrast pivot ("Having said that...", "Initially we thought..., but...").',
    guideTitle: 'Listening Self-Prep Guide',
    guidePages: 50,
  },
};

export interface FreeRescueModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceLabel?: string;
  sampleModuleId?: GuideModuleId | null;
}

export default function FreeRescueModal({
  isOpen,
  onClose,
  sourceLabel = 'Free Rescue Guide Modal',
  sampleModuleId = null,
}: FreeRescueModalProps) {
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [targetBand, setTargetBand] = useState('7.0');
  const [weakestSkill, setWeakestSkill] = useState<GuideModuleId>('writing');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);

  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const isHandlingSubmitRef = useRef(false);
  const downloadTriggeredRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    const saved = getLatestSavedStudentLead();
    if (saved) {
      setFullName(saved.fullName || '');
      setWhatsappNumber(
        saved.normalizedWhatsapp
          ? saved.normalizedWhatsapp.replace(/^\+88/, '')
          : ''
      );
      if (saved.targetBand) setTargetBand(saved.targetBand);
      if (
        saved.weakestSkill &&
        ['writing', 'reading', 'speaking', 'listening'].includes(saved.weakestSkill)
      ) {
        setWeakestSkill(saved.weakestSkill as GuideModuleId);
      }
      if (saved.email) setEmail(saved.email);
    } else {
      setFullName('');
      setWhatsappNumber('');
    }

    if (sampleModuleId) {
      setWeakestSkill(sampleModuleId);
    }

    setNameError(null);
    setPhoneError(null);
    setConsentError(null);
    setSubmitError(null);
    setIsSubmitting(false);
    setIsDownloading(false);
    isHandlingSubmitRef.current = false;
    downloadTriggeredRef.current = false;

    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, sampleModuleId]);

  if (!isOpen) return null;

  const sampleGuide = sampleModuleId ? getGuideById(sampleModuleId) : null;
  const matchedSkillInfo = SKILL_TIPS[weakestSkill] || SKILL_TIPS.writing;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isHandlingSubmitRef.current || isSubmitting || isDownloading) return;

    setNameError(null);
    setPhoneError(null);
    setConsentError(null);
    setSubmitError(null);

    const trimmedName = fullName.trim();
    let hasValidationError = false;

    if (!trimmedName || trimmedName.length < 2) {
      setNameError('Please enter your full name.');
      hasValidationError = true;
    }

    const phoneValidation = validateWhatsappPhone(whatsappNumber);
    if (!phoneValidation.valid) {
      setPhoneError(
        phoneValidation.error || 'Please enter a valid WhatsApp number.'
      );
      hasValidationError = true;
    }

    if (!consent) {
      setConsentError('Please agree to the consent line to receive your download.');
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    isHandlingSubmitRef.current = true;
    setIsSubmitting(true);

    saveStoredLocalLead({
      normalizedWhatsapp: phoneValidation.normalized,
      fullName: trimmedName,
      submittedAt: new Date().toISOString(),
      targetBand,
      weakestSkill,
      email: email.trim() || undefined,
    });

    const trafficSrc = getTrafficSource();

    if (!downloadTriggeredRef.current) {
      downloadTriggeredRef.current = true;
      if (sampleModuleId) {
        generateAndDownloadSampleChapterPdf(sampleModuleId);
        trackSiteEvent('sample_chapter_download', {
          module: sampleModuleId,
          targetBand,
          weakestSkill,
        });
      } else {
        triggerAutomaticPdfDownload(
          '/api/rescue-guide/download',
          SITE_CONFIG.freeRescueGuide.downloadFileName
        );
        trackSiteEvent('guide_download', {
          guide: 'Free Rescue Guide 38p',
          targetBand,
          weakestSkill,
        });
      }
    }

    setIsDownloading(true);
    setIsSubmitting(false);

    fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: trimmedName,
        whatsappNumber: phoneValidation.display,
        targetBand,
        weakestSkill,
        email: email.trim(),
        src: trafficSrc,
        door: sampleGuide
          ? `${sampleGuide.moduleName} 5-Page Sample Chapter`
          : sourceLabel,
        source: sourceLabel,
        guide: sampleGuide
          ? `${sampleGuide.moduleName} Sample Chapter (5p)`
          : 'IELTS Band 7+ Score Rescue (38p)',
        consent: true,
        sheetTab: 'leads',
      }),
    }).catch((err) => {
      console.warn('Lead background submission error:', err);
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rescue-modal-title"
      className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-paper text-ink border border-rule-strong shadow-xl p-6 sm:p-8 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Kicker & Close Button */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-rule">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-examiner-red block">
              {sampleGuide
                ? `FREE 5-PAGE SAMPLE CHAPTER · ${sampleGuide.moduleName.toUpperCase()} GUIDE`
                : 'FREE 38-PAGE PDF · INSTANT DOWNLOAD'}
            </span>
            <h2
              id="rescue-modal-title"
              className="mt-1 font-serif text-2xl sm:text-3xl text-ink font-normal"
            >
              {sampleGuide ? (
                <>
                  Download Free{' '}
                  <RedPen type="underline" seed={2}>
                    {sampleGuide.moduleName}
                  </RedPen>{' '}
                  Sample
                </>
              ) : (
                <>
                  Download the Free{' '}
                  <RedPen type="underline" seed={2}>
                    Score Rescue
                  </RedPen>{' '}
                  Guide
                </>
              )}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close download form"
            className="w-9 h-9 inline-flex items-center justify-center border border-rule text-ink-muted hover:text-ink hover:border-ink transition-colors cursor-pointer shrink-0"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Item 16: Next-Step Screen after every capture */}
        {isDownloading ? (
          <div className="py-5 space-y-5">
            {/* 1. What they asked for */}
            <div className="p-4 bg-ivory border border-rule-strong flex items-start gap-3">
              <RedPen
                type="check"
                seed={1}
                className="shrink-0 translate-y-0.5 text-examiner-red"
              />
              <div>
                <p className="font-serif text-lg text-ink font-medium">
                  {sampleGuide
                    ? `Your 5-Page ${sampleGuide.moduleName} Sample Chapter has downloaded!`
                    : 'Your Free 38-Page Rescue Guide is downloading…'}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-ink-muted leading-relaxed">
                  {sampleGuide ? (
                    <>
                      Check your downloads for{' '}
                      <span className="font-mono text-ink">
                        IELTS-DECODED-{sampleGuide.moduleName}-Sample-Chapter-5p.pdf
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      Check your downloads for{' '}
                      <span className="font-mono text-ink">
                        {SITE_CONFIG.freeRescueGuide.downloadFileName}
                      </span>
                      .
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* 2. One immediate high-impact tip matched to their weakest skill */}
            <div className="p-4 border border-rule bg-surface-elevated">
              <span className="font-mono text-[10px] uppercase tracking-widest text-examiner-red block">
                QUICK FIX FOR YOUR #1 BOTTLENECK · {matchedSkillInfo.skillLabel.toUpperCase()}
              </span>
              <p className="mt-1.5 text-xs sm:text-sm text-ink leading-relaxed">
                {matchedSkillInfo.oneTip}
              </p>
            </div>

            {/* 3. ONE Offer by Weakest Skill: Free Writing Evaluation first, BDT 499 Guide second */}
            <div className="p-4 border-2 border-ink bg-paper space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-violet-pen block">
                RECOMMENDED NEXT STEP FOR BAND {targetBand}
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink font-normal">
                1st: Test Your Writing Free · 2nd: Get the {matchedSkillInfo.guideTitle} (BDT 499)
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Run a free instant check on your writing first, or unlock the full{' '}
                <strong className="text-ink">
                  {matchedSkillInfo.guidePages}-page {matchedSkillInfo.guideTitle} (BDT 499)
                </strong>{' '}
                — with 50% of your PDF fee credited if you join a live batch within 14 days.
              </p>

              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <a
                  href="/writing-checker"
                  onClick={onClose}
                  className="min-h-[42px] px-4 py-2 bg-ink hover:bg-ink-muted text-paper font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>1. Check My Writing Free</span>
                  <IconArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <a
                  href={getWaUrl(
                    `Hi Jubayer, I just downloaded the free sample. My target is Band ${targetBand} and my weakest skill is ${matchedSkillInfo.skillLabel}. I want the ${matchedSkillInfo.guideTitle} (BDT 499).`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWaClick(`NEXT_STEP_${weakestSkill.toUpperCase()}_499`)}
                  className="min-h-[42px] px-4 py-2 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>2. Get {matchedSkillInfo.guideTitle} (BDT 499)</span>
                  <IconArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between gap-3 font-mono text-xs text-ink-muted">
              {sampleGuide ? (
                <button
                  type="button"
                  onClick={() => generateAndDownloadSampleChapterPdf(sampleGuide.id)}
                  className="text-ink underline underline-offset-4 hover:text-violet-pen cursor-pointer"
                >
                  Download sample PDF again
                </button>
              ) : (
                <a
                  href="/api/rescue-guide/download"
                  download={SITE_CONFIG.freeRescueGuide.downloadFileName}
                  className="text-ink underline underline-offset-4 hover:text-violet-pen"
                >
                  Download didn’t start? Click here
                </a>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-rule-strong bg-surface-elevated hover:border-ink text-ink cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Item 15: Unified Lead Capture Form */
          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3.5">
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              {sampleGuide
                ? `Enter your details below—your 5-page ${sampleGuide.moduleName} sample chapter PDF will download immediately.`
                : 'Enter your details below—your 38-page Score Rescue PDF download will start automatically.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="rescue-full-name"
                  className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1"
                >
                  Full Name <span className="text-examiner-red">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  id="rescue-full-name"
                  name="fullName"
                  type="text"
                  autoComplete="off"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="Your Full Name"
                  className={`w-full min-h-[42px] px-3 py-2 bg-surface-elevated border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen transition-colors ${
                    nameError ? 'border-examiner-red' : 'border-rule-strong'
                  }`}
                />
                {nameError && (
                  <p className="mt-1 font-mono text-[11px] text-examiner-red">
                    {nameError}
                  </p>
                )}
              </div>

              {/* WhatsApp Number */}
              <div>
                <label
                  htmlFor="rescue-whatsapp"
                  className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1"
                >
                  WhatsApp (+880) <span className="text-examiner-red">*</span>
                </label>
                <input
                  id="rescue-whatsapp"
                  name="whatsappNumber"
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  required
                  value={whatsappNumber}
                  onChange={(e) => {
                    setWhatsappNumber(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder="017XXXXXXXX"
                  className={`w-full min-h-[42px] px-3 py-2 bg-surface-elevated border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen transition-colors tabular-nums font-mono ${
                    phoneError ? 'border-examiner-red' : 'border-rule-strong'
                  }`}
                />
                {phoneError && (
                  <p className="mt-1 font-mono text-[11px] text-examiner-red">
                    {phoneError}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Target Band */}
              <div>
                <label
                  htmlFor="rescue-target-band"
                  className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1"
                >
                  Target Band <span className="text-examiner-red">*</span>
                </label>
                <select
                  id="rescue-target-band"
                  value={targetBand}
                  onChange={(e) => setTargetBand(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono focus:outline-none focus:border-violet-pen"
                >
                  <option value="6.5">Band 6.5</option>
                  <option value="7.0">Band 7.0</option>
                  <option value="7.5">Band 7.5</option>
                  <option value="8.0+">Band 8.0+</option>
                </select>
              </div>

              {/* Weakest Skill */}
              <div>
                <label
                  htmlFor="rescue-weakest-skill"
                  className="block font-mono text-[11px] uppercase tracking-wider text-ink mb-1"
                >
                  Weakest Skill <span className="text-examiner-red">*</span>
                </label>
                <select
                  id="rescue-weakest-skill"
                  value={weakestSkill}
                  onChange={(e) => setWeakestSkill(e.target.value as GuideModuleId)}
                  className="w-full min-h-[42px] px-3 py-2 bg-surface-elevated border border-rule-strong text-sm text-ink font-mono focus:outline-none focus:border-violet-pen"
                >
                  <option value="writing">Writing (Task 1 & 2)</option>
                  <option value="reading">Reading (T/F/NG & Headings)</option>
                  <option value="speaking">Speaking (Part 2 & 3)</option>
                  <option value="listening">Listening (Part 3 & 4)</option>
                </select>
              </div>
            </div>

            {/* Optional Email */}
            <div>
              <label
                htmlFor="rescue-email"
                className="block font-mono text-[11px] uppercase tracking-wider text-ink-muted mb-1"
              >
                Email Address <span className="text-[10px]">(Optional)</span>
              </label>
              <input
                id="rescue-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com (optional backup copy)"
                className="w-full min-h-[40px] px-3 py-2 bg-surface-elevated border border-rule text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen"
              />
            </div>

            {/* Consent Checkbox (Item 15) */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (consentError) setConsentError(null);
                  }}
                  className="mt-1 accent-violet-pen cursor-pointer"
                />
                <span className="font-mono text-[11px] text-ink-muted leading-relaxed">
                  I agree to get WhatsApp/email messages from IELTS DECODED. Reply STOP to opt out.
                </span>
              </label>
              {consentError && (
                <p className="mt-1 font-mono text-[11px] text-examiner-red">
                  {consentError}
                </p>
              )}
            </div>

            {submitError && (
              <div className="p-3 bg-ivory border border-examiner-red/60 font-mono text-xs text-examiner-red">
                {submitError}
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting || isDownloading}
                className="group/btn w-full min-h-[48px] px-6 py-3 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm sm:text-base font-medium transition-colors cursor-pointer"
              >
                <RedPen type="underline" seed={0} drawOnHover>
                  {isSubmitting || isDownloading
                    ? 'Starting your download…'
                    : sampleGuide
                    ? `Download Free 5-Page ${sampleGuide.moduleName} Sample`
                    : 'Download the Free Rescue Guide'}
                </RedPen>
                <IconArrowDown className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
