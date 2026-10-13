import React, { useState } from 'react';
import { SITE_CONFIG, trackSiteEvent, trackWaClick, wa } from '../config';
import { IconArrowUpRight, IconCheckCircle } from './EditorialGraphics';
import {
  getLatestSavedStudentLead,
  saveStoredLocalLead,
  validateWhatsappPhone,
} from './FreeRescueModal';
import { RedPen } from './RedPen';

interface SpeakingMocksProps {
  onNavigateHome?: (sectionHash?: string) => void;
  standalone?: boolean;
}

export function SpeakingMocksSection({
  onNavigateHome,
  standalone = false,
}: SpeakingMocksProps) {
  const [fullName, setFullName] = useState(() => {
    const saved = getLatestSavedStudentLead();
    return saved?.fullName || '';
  });
  const [whatsappNumber, setWhatsappNumber] = useState(() => {
    const saved = getLatestSavedStudentLead();
    return saved?.normalizedWhatsapp ? saved.normalizedWhatsapp.replace(/^\+88/, '') : '';
  });
  const [targetBand, setTargetBand] = useState('7.0');
  const [currentBand, setCurrentBand] = useState('6.0');
  const [availability, setAvailability] = useState('Evening (8:00 PM – 11:00 PM BST)');
  const [examDate, setExamDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Default pre-made direct WhatsApp message if student clicks direct CTA without form
  const directWaMessage = `Hi Jubayer, I'd like to get the Three Live IELTS Speaking Mocks (BDT 499). Please share your availability and payment details. SPEAKING MOCKS`;

  // Pre-made personalized WhatsApp message prepared from form details
  const preparedWaMessage = (() => {
    const parts = [
      `Hi Jubayer, I want to book the Three Live IELTS Speaking Mocks (BDT 499).`,
    ];
    if (fullName.trim()) parts.push(`Name: ${fullName.trim()}.`);
    if (whatsappNumber.trim()) parts.push(`WhatsApp: ${whatsappNumber.trim()}.`);
    parts.push(`Target Band: ${targetBand}.`);
    if (currentBand && currentBand !== 'Not tested yet') {
      parts.push(`Current Band: ${currentBand}.`);
    }
    parts.push(`Preferred Time: ${availability}.`);
    if (examDate.trim()) parts.push(`Exam Timeline: ${examDate.trim()}.`);
    if (additionalNotes.trim()) parts.push(`Struggle/Focus: ${additionalNotes.trim()}.`);
    parts.push(
      `Please share your active bKash/Nagad details so I can confirm and schedule Mock #1 on Google Meet.`
    );
    return parts.join(' ');
  })();

  const handleOpenForm = () => {
    setIsOpenForm(true);
    trackSiteEvent('whatsapp_click', { button: 'OPEN_SPEAKING_MOCKS_FORM' });
    setTimeout(() => {
      document.getElementById('speaking-mocks-order-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);

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

    // Save lead in background and localStorage for convenience
    saveStoredLocalLead({
      fullName: trimmedName,
      normalizedWhatsapp: phoneValidation.normalized,
      submittedAt: new Date().toISOString(),
      targetBand,
      weakestSkill: 'speaking',
    });

    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: trimmedName,
        whatsappNumber: phoneValidation.display,
        sheetTab: 'leads',
        product: '3 Live IELTS Speaking Mocks (BDT 499)',
        source: 'Speaking Mocks Offer (#programs)',
        door: '3 Speaking Mocks BDT 499',
        targetBand,
        currentBand,
        weakestSkill: 'speaking',
        availability,
        examDate: examDate.trim(),
        notes: additionalNotes.trim(),
      }),
    }).catch(() => {
      // Non-blocking background sync
    });

    trackSiteEvent('whatsapp_click', { button: 'PREPARE_SPEAKING_MOCKS_WA' });

    // Open WhatsApp directly with the pre-made personalized message
    const url = wa(preparedWaMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="speaking-mocks"
      className={`border-2 border-rule-strong bg-surface-elevated p-6 sm:p-10 scroll-mt-20 ${
        standalone ? 'max-w-[1200px] mx-auto my-12' : 'mt-12'
      }`}
      aria-labelledby="speaking-mocks-title"
    >
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-rule">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-ivory border border-rule font-mono text-[11px] uppercase tracking-wider text-examiner-red font-semibold">
            <span>INTRODUCTORY OFFER</span>
            <span className="text-ink-subtle" aria-hidden="true">·</span>
            <span>1-TO-1 ON GOOGLE MEET</span>
          </div>
          <h3
            id="speaking-mocks-title"
            className="mt-3 font-serif text-2xl sm:text-3xl lg:text-4xl text-ink font-normal leading-tight"
          >
            Three Live IELTS Speaking Mocks —{' '}
            <RedPen type="underline" seed={3}>
              BDT 499
            </RedPen>
          </h3>
          <p className="mt-2 text-sm sm:text-base text-ink-muted max-w-3xl leading-relaxed">
            Experience real test conditions before sitting for your real exam. Three individually scheduled 1-to-1 mocks conducted personally by Jubayer Siddiki on Google Meet—with an individual 4-criterion feedback report after each session.
          </p>
        </div>

        <div className="font-mono bg-paper border border-rule-strong p-4 lg:text-right shrink-0">
          <span className="block text-[11px] uppercase tracking-widest text-ink-muted">Total Package Price</span>
          <div className="flex items-baseline gap-2 lg:justify-end">
            <span className="font-serif text-3xl sm:text-4xl text-ink font-medium tabular-nums">BDT 499</span>
          </div>
          <span className="block text-xs text-examiner-red font-medium">BDT 499 for all three mocks</span>
        </div>
      </div>

      {/* Deliverables & Real Test Conditions Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Exactly what is included */}
        <div className="lg:col-span-7 space-y-4">
          <h4 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
            What is included in this 3-mock package:
          </h4>

          <ul className="space-y-3 text-xs sm:text-sm text-ink-muted leading-relaxed">
            <li className="flex items-start gap-2.5 p-3 bg-ivory border border-rule">
              <IconCheckCircle className="w-4 h-4 text-violet-pen shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">Three individually scheduled 1-to-1 mock tests:</strong> Conducted personally by Jubayer Siddiki on Google Meet. Schedule them across 1–3 weeks as you practice and refine your answers.
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-3 bg-ivory border border-rule">
              <IconCheckCircle className="w-4 h-4 text-violet-pen shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">Full 3-part test format (11–14 minutes each):</strong> Follows official IELTS Part 1 (Introduction &amp; Interview), Part 2 (Cue Card Individual Long Turn with 1 min prep), and Part 3 (Two-way Discussion).
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-3 bg-ivory border border-rule">
              <IconCheckCircle className="w-4 h-4 text-violet-pen shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">Realistic test conditions:</strong> Examiner-style questions, strict timing, and no interruptions or coaching during the mock itself so you feel genuine test pressure.
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-3 bg-ivory border border-rule">
              <IconCheckCircle className="w-4 h-4 text-violet-pen shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">Individual feedback report after each mock:</strong> Estimated diagnostic feedback assessed against all 4 official IELTS Speaking criteria:
                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[11px] text-ink">
                  <span>1. Fluency &amp; Coherence (FC)</span>
                  <span>2. Lexical Resource (LR)</span>
                  <span>3. Grammatical Range &amp; Accuracy (GRA)</span>
                  <span>4. Pronunciation (PR)</span>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-3 bg-ivory border border-rule">
              <IconCheckCircle className="w-4 h-4 text-violet-pen shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">Actionable recommendations between mocks:</strong> Specific strengths highlighted, recurring pronunciation/grammar hesitations exposed, and a prioritized fix plan for your next attempt.
              </div>
            </li>
          </ul>

          <div className="p-3 bg-paper border border-rule font-mono text-[11px] text-ink-muted leading-relaxed">
            <strong className="text-ink">Practice Assessment Notice:</strong> Scores are diagnostic practice estimates based on the public IELTS Speaking band descriptors. This is an independent prep service, not an official IELTS test, and does not guarantee an official band score.
          </div>
        </div>

        {/* Right Column: Workflow & WhatsApp CTA */}
        <div className="lg:col-span-5 bg-paper border border-rule-strong p-6 space-y-4">
          <div className="font-mono text-xs uppercase tracking-wider text-ink-muted pb-3 border-b border-rule">
            How Scheduling &amp; Sessions Work
          </div>

          <div className="space-y-3 font-mono text-xs text-ink leading-relaxed">
            <div className="p-2.5 bg-ivory border border-rule space-y-1">
              <span className="font-bold text-violet-pen">Personalized &amp; Manual:</span>
              <p className="text-ink-muted text-[11px]">
                Sessions are arranged manually through WhatsApp and conducted on Google Meet. No automated booking bot—we coordinate real times that fit your daily schedule (evening &amp; weekend slots available).
              </p>
            </div>

            <ol className="space-y-2 text-ink-muted text-[11px]">
              <li><strong>1. Message on WhatsApp:</strong> Tap below to send your pre-made booking request directly to Jubayer.</li>
              <li><strong>2. Time Coordination:</strong> We agree on your Mock #1 date, time, and share payment details directly in chat.</li>
              <li><strong>3. Google Meet Link:</strong> You receive the private Meet link 15 minutes before the session.</li>
              <li><strong>4. Post-Mock Report:</strong> Receive your 4-criterion feedback report within hours.</li>
              <li><strong>5. Repeat for Mocks 2 &amp; 3:</strong> Apply the feedback and schedule the next mock when you are ready.</li>
            </ol>
          </div>

          <div className="pt-2 space-y-2.5">
            {/* Primary CTA: Directly prepares message and goes to WhatsApp */}
            <a
              href={wa(directWaMessage)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWaClick('GET_SPEAKING_MOCKS_DIRECT')}
              className="w-full min-h-[50px] px-6 py-3.5 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover text-white text-sm font-medium transition-colors"
            >
              <RedPen type="underline" seed={0} drawOnHover>
                Get My Speaking Mocks — BDT 499
              </RedPen>
              <IconArrowUpRight className="w-4 h-4" />
            </a>

            {!isOpenForm ? (
              <button
                type="button"
                onClick={handleOpenForm}
                className="w-full min-h-[44px] px-4 py-2.5 border border-rule-strong bg-ivory hover:border-ink text-ink font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Or Customize My Schedule &amp; Target Band First</span>
                <span>↓</span>
              </button>
            ) : (
              <p className="font-mono text-xs text-violet-pen text-center font-medium">
                ↓ Customization form open below
              </p>
            )}
          </div>

          <p className="font-mono text-[11px] text-ink-muted text-center">
            Conducted on Google Meet · WhatsApp:{' '}
            <strong className="text-ink">{SITE_CONFIG.whatsapp.displayNumber}</strong>
          </p>
        </div>
      </div>

      {/* OPTIONAL CUSTOMIZATION FORM: Prepares custom message and launches WhatsApp */}
      {isOpenForm && (
        <div id="speaking-mocks-order-form" className="mt-10 pt-8 border-t-2 border-rule-strong scroll-mt-20">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rule">
              <div>
                <h4 className="font-serif text-2xl text-ink font-normal">
                  Customize Your Speaking Mock Booking (BDT 499)
                </h4>
                <p className="font-mono text-xs text-ink-muted mt-1">
                  Fill in your preferred availability and target band. Clicking the button will prepare your exact pre-made message and open WhatsApp directly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenForm(false)}
                className="font-mono text-xs text-ink-muted hover:text-ink underline cursor-pointer self-start sm:self-auto"
              >
                Hide Form
              </button>
            </div>

            {/* Student Information */}
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
                  placeholder="e.g. Nusrat Jahan"
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

            {/* Band Goals & Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5">
                  Current Speaking Level
                </label>
                <select
                  value={currentBand}
                  onChange={(e) => setCurrentBand(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-paper border border-rule text-sm text-ink font-mono focus:outline-none focus:border-violet-pen"
                >
                  <option value="Not tested yet">Not tested yet (First attempt)</option>
                  <option value="5.0 - 5.5">Band 5.0 – 5.5</option>
                  <option value="6.0">Band 6.0</option>
                  <option value="6.5">Band 6.5</option>
                  <option value="7.0">Band 7.0</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5">
                  Target Speaking Band
                </label>
                <select
                  value={targetBand}
                  onChange={(e) => setTargetBand(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-paper border border-rule text-sm text-ink font-mono focus:outline-none focus:border-violet-pen"
                >
                  <option value="6.5">Band 6.5</option>
                  <option value="7.0">Band 7.0</option>
                  <option value="7.5">Band 7.5</option>
                  <option value="8.0+">Band 8.0+</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5">
                  Approx. Real Exam Date
                </label>
                <input
                  type="text"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  placeholder="e.g. Next month / Dec 2026"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-paper border border-rule text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen"
                />
              </div>
            </div>

            {/* Availability for Google Meet Sessions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5">
                  Preferred Time Slot (Google Meet) *
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-paper border border-rule text-sm text-ink font-mono focus:outline-none focus:border-violet-pen"
                >
                  <option value="Evening (8:00 PM – 11:00 PM BST)">Evening (8:00 PM – 11:00 PM BST) · Most Popular</option>
                  <option value="Afternoon (3:00 PM – 6:00 PM BST)">Afternoon (3:00 PM – 6:00 PM BST)</option>
                  <option value="Morning / Noon (11:00 AM – 2:00 PM BST)">Morning / Noon (11:00 AM – 2:00 PM BST)</option>
                  <option value="Friday / Saturday Special Slots">Friday / Saturday Special Weekend Slots</option>
                  <option value="Flexible (Coordinate anytime on WhatsApp)">Flexible (Coordinate anytime on WhatsApp)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5">
                  Any specific struggle or Part you fear?
                </label>
                <input
                  type="text"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Fluency pauses in Part 3, running out of ideas in Cue Card"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-paper border border-rule text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen"
                />
              </div>
            </div>

            {/* Pre-made Message Preview Box */}
            <div className="p-4 bg-ivory border border-rule space-y-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink font-semibold">
                Your Pre-Made WhatsApp Message Preview:
              </span>
              <p className="font-mono text-xs text-ink-muted bg-paper p-3 border border-rule leading-relaxed italic">
                &ldquo;{preparedWaMessage}&rdquo;
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="font-mono text-[11px] text-ink-muted">
                No upfront TrxID required here. We coordinate schedule &amp; payment directly in chat.
              </p>

              <button
                type="submit"
                className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Get My Speaking Mocks on WhatsApp (BDT 499)</span>
                <IconArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
