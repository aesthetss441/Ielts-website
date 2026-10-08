/**
 * 10-LINE DESIGN BRIEF: IELTS DECODED
 * 1. Concept: "The examiner's desk meets an editorial studio." Archival, diagnostic, human.
 * 2. Tone: Calm, confident, direct—a sharp teacher showing a student where marks are lost.
 * 3. Palette: OKLCH warm paper, ivory, charcoal ink, warm gray, #5B2EE0 violet pen (5-10%), examiner red annotations.
 * 4. Type: Fraunces editorial serif (display/numerals), Plus Jakarta Sans (prose/UI), JetBrains Mono (labels/scores).
 * 5. Grid: Asymmetric 12-column editorial grid with generous whitespace and 60–70ch reading measure.
 * 6. Surface: 1px hairline rules instead of boxed cards; cards reserved strictly for the two main offer blocks.
 * 7. Signature Visuals: Hand-drawn SVG red-pen circles/underlines, 40-mark Mistake DNA (K/S/C), Band Ruler (6.0→8.0).
 * 8. Motion: Purposeful SVG stroke draws, subtle reveals, and scroll-linked reading progress; respects reduced motion.
 * 9. Interaction: Low-friction WhatsApp-first admission flow (`wa(keyword)`), ≥44px touch targets, mobile bottom bar.
 * 10. Refusal: Zero purple-blue gradients, zero glassmorphism, zero fake urgency timers, zero invented reviews or stock photos.
 */

import { INSTRUCTOR_PORTRAIT_DATA_URI } from './portraitData';

export type WaKeyword =
  | 'RESCUE'
  | 'WRITE'
  | 'ENROLL'
  | 'CRASH'
  | 'GENERAL'
  | 'GUIDES_GENERAL'
  | 'GUIDE_LISTENING'
  | 'GUIDE_READING'
  | 'GUIDE_WRITING'
  | 'GUIDE_SPEAKING';

export interface PrivacyMaskRect {
  top: string;
  left: string;
  width: string;
  height: string;
}

export interface ReviewItem {
  id: string;
  imageUrl: string;
  studentName?: string;
  scoreSummary?: string;
  altText: string;
  privacyMasks?: PrivacyMaskRect[];
}

export interface WrittenQuoteItem {
  id: string;
  quote: string;
  context: string;
  scoreBadge: string;
}

export interface VideoTestimonialConfig {
  videoUrl: string; // e.g., '/testimonial.mp4' (upload to public/) or a YouTube/Drive embed link
  posterUrl?: string;
  headlineQuote: string;
  summaryPoints: string[];
  studentLabel: string;
  moduleHighlight: string;
}

export interface SiteConfig {
  founder: {
    name: string;
    overallBand: string;
    moduleScores: string;
    credentials: string[];
    heroPhotoUrl: string;
    aboutPhotoUrl: string;
    facebookUrl: string;
  };
  whatsapp: {
    displayNumber: string;
    internationalNumber: string;
  };
  batchSchedule: {
    startDateText: string; // e.g., "15 November 2026" — leave empty to show "Ask on WhatsApp for next batch start date & class days"
    classDaysText: string; // e.g., "Sun · Tue · Thu (8:30 PM BST)"
    seatsConfirmedText: string; // Set to "X of 10 seats confirmed" ONLY when true; empty by default
  };
  tracking: {
    metaPixelId: string;
    enableLeadEvent: boolean;
  };
  leadMagnetMockups: {
    page1Url: string;
    page2Url: string;
    page3Url: string;
    page4Url: string;
  };
  freeRescueGuide: {
    pdfUrl: string; // e.g. '/IELTS-Band-7-Score-Rescue.pdf' (upload your PDF to /public)
    downloadFileName: string;
  };
  reviews: {
    ratingBadgeText?: string;
    videoTestimonial: VideoTestimonialConfig;
    writtenQuotes: WrittenQuoteItem[];
    items: ReviewItem[];
  };
  admissionVideoUrl: string;
  footerLinks: {
    socials: { label: string; url: string }[];
    policies: { label: string; url: string }[];
    refundTermsText: string; // Optional refund terms — renders only when supplied
    classScheduleText: string; // Optional class schedule note — renders only when supplied
    legalText: string;
  };
}

export const SITE_CONFIG: SiteConfig = {
  founder: {
    name: 'Jubayer Siddiki',
    overallBand: '8',
    moduleScores: 'L8.5 | R8.5 | W7 | S7',
    credentials: [
      'IELTS Overall 8 (CLB 9)',
      'Pearson Edexcel IGCSE English Grade 9',
      '100+ students taught',
      'Author, IELTS DECODED book series',
    ],
    heroPhotoUrl: INSTRUCTOR_PORTRAIT_DATA_URI,
    aboutPhotoUrl: INSTRUCTOR_PORTRAIT_DATA_URI,
    facebookUrl: 'https://www.facebook.com/jubayersiddiki66/',
  },
  whatsapp: {
    displayNumber: '01305273703',
    internationalNumber: '8801305273703',
  },
  batchSchedule: {
    startDateText: '', // Fill in real batch start date (e.g. "Next batch starts: 10 Nov") when scheduled
    classDaysText: '3 live classes/week · 90 min each (evening slots)',
    seatsConfirmedText: '', // Fill in "X of 10 seats confirmed" only when true
  },
  tracking: {
    metaPixelId: '',
    enableLeadEvent: false,
  },
  leadMagnetMockups: {
    page1Url: '',
    page2Url: '',
    page3Url: '',
    page4Url: '',
  },
  freeRescueGuide: {
    pdfUrl: '/IELTS_Band7_Score_Rescue.pdf',
    downloadFileName: 'IELTS_Band7_Score_Rescue.pdf',
  },
  reviews: {
    ratingBadgeText: 'Student-shared results, shown with permission',
    videoTestimonial: {
      videoUrl: '/testimonial.mp4', // Upload your video to public/testimonial.mp4 (or paste a YouTube/Drive embed URL here)
      headlineQuote:
        '“I felt really stuck before joining. Reading List of Headings used to be really hard—after Jubayer’s guidance, I gained confidence and started improving consistently.”',
      summaryPoints: [
        'Before: Felt stuck and lost marks repeatedly on Reading — List of Headings (Matching Headings).',
        'The Fix: Step-by-step strategy to stop guessing from first-line distractors and find paragraph main ideas.',
        'After: Built real exam confidence, improved Reading accuracy, and recommends the program to other students.',
      ],
      studentLabel: 'IELTS DECODED Student · Video Review',
      moduleHighlight: 'Reading · List of Headings Breakthrough',
    },
    writtenQuotes: [
      {
        id: 'quote-1',
        quote:
          '“THANK YOUUUUUUUU SOOOO MUCH! Even tho the exam was a disaster, somehow Allah saved me.”',
        context: 'Student direct message after receiving exam results',
        scoreBadge: 'Overall 7.0 (L7.5 | R7.5 | W7.0 | S6.5)',
      },
      {
        id: 'quote-2',
        quote:
          'Shared official score breakdown in chat immediately after completing the 1-month 1-to-1 live coaching program.',
        context: '1-Month 1-to-1 Crash Course student',
        scoreBadge: 'Overall 8.0 (L9.0 | R9.0 | W7.5 | S7.0)',
      },
    ],
    items: [
      {
        id: 'proof-2',
        imageUrl: '/proof-2.png',
        studentName: 'Student M. R. · 1:1 Crash Course (1 Month)',
        scoreSummary: 'Overall 8.0 (L9.0 | R9.0 | W7.5 | S7.0)',
        altText:
          'Student-shared result achieving Overall Band 8.0 (Listening 9.0, Reading 9.0, Writing 7.5, Speaking 7.0) in 1 month of 1:1 personal coaching with Jubayer Siddiki.',
        // Blurs the student's name and avatar inside the chat portion of the image to protect student privacy
        privacyMasks: [
          { top: '35.5%', left: '46.5%', width: '21%', height: '3.8%' },
        ],
      },
      {
        id: 'proof-1',
        imageUrl: '/proof-1.jpg',
        studentName: 'Student Direct Message · Exam Result',
        scoreSummary: 'Overall 7.0 (L7.5 | R7.5 | W7.0 | S6.5)',
        altText:
          'Student message thanking Jubayer Siddiki after receiving Overall Band 7.0 (Listening 7.5, Reading 7.5, Writing 7.0, Speaking 6.5).',
        // Blurs the student's profile photo avatars and name header in the chat screenshot
        privacyMasks: [
          { top: '2.2%', left: '2.2%', width: '18.5%', height: '6.8%' },
          { top: '73.5%', left: '2.2%', width: '4.5%', height: '4.5%' },
        ],
      },
      {
        id: 'proof-3',
        imageUrl: '/proof-3.jpg',
        studentName: 'Student-Shared Result · Band 7.0 Breakdown',
        scoreSummary: 'Overall Band 7.0 (L7.5 | R7.5 | W7.0 | S6.5)',
        altText:
          'Student-shared score breakdown showing Listening 7.5, Reading 7.5, Writing 7.0, Speaking 6.5, and Overall Band Score 7.0.',
      },
      {
        id: 'proof-4',
        imageUrl: '/proof-4.jpg',
        studentName: 'Student-Shared Result · Band 8.0 Breakdown',
        scoreSummary: 'Overall Band 8.0 (L9.0 | R9.0 | W7.5 | S7.0)',
        altText:
          'Student-shared score breakdown showing Listening 9.0, Reading 9.0, Writing 7.5, Speaking 7.0, and Overall Band Score 8.0.',
      },
    ],
  },
  admissionVideoUrl: '',
  footerLinks: {
    socials: [
      { label: 'Facebook · Jubayer Siddiki', url: 'https://www.facebook.com/jubayersiddiki66/' },
    ],
    policies: [],
    refundTermsText: '', // Fill in real refund terms when available
    classScheduleText: '', // Fill in real class schedule details when available
    legalText: '',
  },
};

const WA_MESSAGES: Record<WaKeyword, string> = {
  RESCUE: "Hi Jubayer, I'd like the free guide. RESCUE",
  WRITE: "Hi Jubayer, I'd like the free writing evaluation. WRITE",
  ENROLL: "Hi Jubayer, I'd like to ask about the 12-Week Band 7+ Roadmap Mentorship Program. ENROLL",
  CRASH: "Hi Jubayer, I'd like to ask about the 1-Month 1-to-1 Live IELTS Crash Course. CRASH",
  GENERAL: "Hi Jubayer, I'd like to know more about IELTS DECODED.",
  GUIDES_GENERAL: "Hi Jubayer, I'm interested in the self-prep guides.",
  GUIDE_LISTENING: "Hi Jubayer, I'd like the IELTS DECODED Listening Self-Prep Guide (BDT 499).",
  GUIDE_READING: "Hi Jubayer, I'd like the IELTS DECODED Reading Self-Prep Guide (BDT 499).",
  GUIDE_WRITING: "Hi Jubayer, I'd like the IELTS DECODED Writing Self-Prep Guide (BDT 499).",
  GUIDE_SPEAKING: "Hi Jubayer, I'd like the IELTS DECODED Speaking Self-Prep Guide (BDT 499).",
};

/**
 * Generates a valid wa.me URL with URL-encoded pre-filled text.
 * Accepts either a WaKeyword or any custom message string.
 */
export function wa(keywordOrMessage: WaKeyword | string = 'GENERAL'): string {
  const message =
    keywordOrMessage in WA_MESSAGES
      ? WA_MESSAGES[keywordOrMessage as WaKeyword]
      : keywordOrMessage || WA_MESSAGES.GENERAL;
  return `https://wa.me/${SITE_CONFIG.whatsapp.internationalNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Returns the raw pre-filled message text for a given keyword or custom text.
 */
export function getWaMessageText(keywordOrMessage: WaKeyword | string = 'GENERAL'): string {
  return keywordOrMessage in WA_MESSAGES
    ? WA_MESSAGES[keywordOrMessage as WaKeyword]
    : keywordOrMessage || WA_MESSAGES.GENERAL;
}

/**
 * Builds the exact WhatsApp message for 1, 2, or 3+ selected Self-Prep Guides.
 */
export function buildGuidesBundleWaMessage(selectedModuleNames: string[]): string {
  if (selectedModuleNames.length === 0) {
    return WA_MESSAGES.GUIDES_GENERAL;
  }
  if (selectedModuleNames.length === 1) {
    return `Hi Jubayer, I'd like the IELTS DECODED ${selectedModuleNames[0]} Self-Prep Guide (BDT 499).`;
  }
  if (selectedModuleNames.length === 2) {
    return `Hi Jubayer, I'd like these guides: ${selectedModuleNames.join(', ')} (2 guides, BDT 499 × 2).`;
  }
  return `Hi Jubayer, I'd like these guides: ${selectedModuleNames.join(', ')} (${selectedModuleNames.length} guides). Could you share the bundle price?`;
}

/**
 * Fires optional Meta Pixel Lead event on WhatsApp click if configured.
 */
export function trackWaClick(keywordOrLabel: string): void {
  if (!SITE_CONFIG.tracking.enableLeadEvent || !SITE_CONFIG.tracking.metaPixelId) {
    return;
  }
  const win = window as unknown as { fbq?: (action: string, event: string, params?: Record<string, string>) => void };
  if (typeof win.fbq === 'function') {
    win.fbq('track', 'Lead', { content_name: keywordOrLabel });
  }
}
