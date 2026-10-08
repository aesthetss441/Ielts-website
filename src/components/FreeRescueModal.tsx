import React, { useEffect, useRef, useState } from 'react';
import { SITE_CONFIG, trackWaClick } from '../config';
import { IconArrowDown, IconClose } from './EditorialGraphics';
import { RedPen } from './RedPen';

const LOCAL_STORAGE_LEADS_KEY = 'ielts_decoded_rescue_leads_v1';

interface StoredLocalLead {
  normalizedWhatsapp: string;
  fullName: string;
  submittedAt: string;
}

function getStoredLocalLeads(): StoredLocalLead[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredLocalLead(lead: StoredLocalLead): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredLocalLeads().filter(
      (item) => item.normalizedWhatsapp !== lead.normalizedWhatsapp
    );
    existing.push(lead);
    window.localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(existing));
  } catch {
    // ignore storage errors
  }
}

/**
 * Client-side validation for WhatsApp phone numbers.
 * Accepts Bangladesh numbers (01[3-9]XXXXXXXX, +8801[3-9]XXXXXXXX, 8801[3-9]XXXXXXXX)
 * and valid international numbers (10-15 digits), while rejecting fake sequences.
 */
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
      error: 'Please enter a valid WhatsApp number (digits only).',
    };
  }

  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Please enter a complete WhatsApp number (e.g. 017XXXXXXXX).',
    };
  }

  if (
    /^(\d)\1{7,}$/.test(digitsOnly) ||
    digitsOnly === '1234567890' ||
    digitsOnly === '01234567890'
  ) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Please enter a real WhatsApp phone number.',
    };
  }

  if (digitsOnly.startsWith('01')) {
    if (!/^01[3-9]\d{8}$/.test(digitsOnly)) {
      return {
        valid: false,
        normalized: '',
        display: '',
        error: 'Bangladesh WhatsApp numbers must be 11 digits starting with 013–019.',
      };
    }
    return {
      valid: true,
      normalized: `+88${digitsOnly}`,
      display: digitsOnly,
    };
  }

  if (digitsOnly.startsWith('8801')) {
    if (!/^8801[3-9]\d{8}$/.test(digitsOnly)) {
      return {
        valid: false,
        normalized: '',
        display: '',
        error: 'Bangladesh numbers with 880 must be 13 digits (e.g. +88017XXXXXXXX).',
      };
    }
    return {
      valid: true,
      normalized: `+${digitsOnly}`,
      display: `+${digitsOnly}`,
    };
  }

  return {
    valid: true,
    normalized: `+${digitsOnly}`,
    display: hasPlus ? `+${digitsOnly}` : digitsOnly,
  };
}

/**
 * Programmatically triggers an automatic browser download of the PDF file
 * without requiring the visitor to click a second button.
 */
function triggerAutomaticPdfDownload(url: string, fileName: string): void {
  if (typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  }, 500);
}

export function FreeRescueModal({
  isOpen,
  sourceLabel = 'Free Rescue Guide CTA',
  onClose,
}: {
  isOpen: boolean;
  sourceLabel?: string;
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setNameError(null);
    setPhoneError(null);
    setSubmitError(null);
    setIsSubmitting(false);
    setIsDownloading(false);

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
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || isDownloading) return;

    setNameError(null);
    setPhoneError(null);
    setSubmitError(null);

    const trimmedName = fullName.trim();
    let hasValidationError = false;

    if (!trimmedName || trimmedName.length < 2) {
      setNameError('Please enter your full name.');
      hasValidationError = true;
    }

    const phoneValidation = validateWhatsappPhone(whatsappNumber);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || 'Please enter a valid WhatsApp number.');
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: trimmedName,
          whatsappNumber: phoneValidation.display,
          source: sourceLabel,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        downloadUrl?: string;
      } | null;

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            'Could not save your details right now. Please check your connection and try again.'
        );
      }

      saveStoredLocalLead({
        normalizedWhatsapp: phoneValidation.normalized,
        fullName: trimmedName,
        submittedAt: new Date().toISOString(),
      });

      trackWaClick('RESCUE');
      setIsSubmitting(false);
      setIsDownloading(true);

      // Only after a successful response from Google Sheets, automatically trigger the PDF download
      triggerAutomaticPdfDownload(
        data.downloadUrl || '/api/rescue-guide/download',
        SITE_CONFIG.freeRescueGuide.downloadFileName
      );
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Could not submit right now. Please try again.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rescue-modal-title"
      className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-paper text-ink border border-rule-strong shadow-xl p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Kicker & Close Button */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-rule">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-examiner-red block">
              FREE 38-PAGE PDF · INSTANT DOWNLOAD
            </span>
            <h2
              id="rescue-modal-title"
              className="mt-1 font-serif text-2xl sm:text-3xl text-ink font-normal"
            >
              Download the Free{' '}
              <RedPen type="underline" seed={2}>
                Score Rescue
              </RedPen>{' '}
              Guide
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

        {isDownloading ? (
          <div className="py-6 space-y-4">
            <div className="p-4 bg-ivory border border-rule-strong flex items-start gap-3">
              <RedPen
                type="check"
                seed={1}
                className="shrink-0 translate-y-0.5 text-examiner-red"
              />
              <div>
                <p className="font-serif text-lg text-ink font-medium">
                  Your Free Rescue Guide is downloading…
                </p>
                <p className="mt-1 text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Check your browser downloads for{' '}
                  <span className="font-mono text-ink">
                    {SITE_CONFIG.freeRescueGuide.downloadFileName}
                  </span>
                  . Start with the 10-minute diagnostic on Page 6.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 font-mono text-xs text-ink-muted">
              <a
                href="/api/rescue-guide/download"
                download={SITE_CONFIG.freeRescueGuide.downloadFileName}
                className="text-ink underline underline-offset-4 hover:text-violet-pen"
              >
                Download didn’t start? Click here
              </a>

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
          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <p className="text-sm text-ink-muted leading-relaxed">
              Enter your name and WhatsApp number below—your 38-page PDF download will start automatically.
            </p>

            {/* Full Name */}
            <div>
              <label
                htmlFor="rescue-full-name"
                className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5"
              >
                Full Name <span className="text-examiner-red">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="rescue-full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="e.g. Tanvir Ahmed"
                className={`w-full min-h-[46px] px-3.5 py-2.5 bg-surface-elevated border text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen transition-colors ${
                  nameError ? 'border-examiner-red' : 'border-rule-strong'
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
              <label
                htmlFor="rescue-whatsapp"
                className="block font-mono text-xs uppercase tracking-wider text-ink mb-1.5"
              >
                WhatsApp Number <span className="text-examiner-red">*</span>
              </label>
              <input
                id="rescue-whatsapp"
                name="whatsappNumber"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={whatsappNumber}
                onChange={(e) => {
                  setWhatsappNumber(e.target.value);
                  if (phoneError) setPhoneError(null);
                }}
                placeholder="e.g. 017XXXXXXXX"
                className={`w-full min-h-[46px] px-3.5 py-2.5 bg-surface-elevated border font-mono text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-violet-pen transition-colors tabular-nums ${
                  phoneError ? 'border-examiner-red' : 'border-rule-strong'
                }`}
              />
              {phoneError && (
                <p className="mt-1.5 font-mono text-xs text-examiner-red">
                  {phoneError}
                </p>
              )}
            </div>

            {submitError && (
              <div className="p-3 bg-ivory border border-examiner-red/60 font-mono text-xs text-examiner-red">
                {submitError}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group/btn w-full min-h-[48px] px-6 py-3.5 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover disabled:opacity-60 text-white text-sm sm:text-base font-medium transition-colors cursor-pointer"
              >
                <RedPen type="underline" seed={0} drawOnHover>
                  {isSubmitting ? 'Saving & preparing PDF…' : 'Download the Free Rescue Guide'}
                </RedPen>
                <IconArrowDown className="w-4 h-4" />
              </button>
            </div>

            <p className="font-mono text-[11px] text-ink-subtle text-center">
              No account or login needed · Instant 38-page PDF download
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
