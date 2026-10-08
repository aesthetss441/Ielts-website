export type GuideModuleId = 'listening' | 'reading' | 'writing' | 'speaking';

export interface GuidePageImage {
  fileSlug: string; // e.g. 'listening-p01-cover.webp'
  src: string; // default path
  page: number;
  caption: string;
  alt: string;
}

export interface GuideContentRow {
  category: 'START HERE' | 'THE TEST' | 'SKILLS' | 'PRACTICE' | 'REVIEW' | 'NEXT STEP';
  details: string;
  monoStats?: string;
}

export interface GuideData {
  id: GuideModuleId;
  num: string; // '01' | '02' | '03' | '04'
  moduleName: 'Listening' | 'Reading' | 'Writing' | 'Speaking';
  title: string;
  subtitle: string;
  oneLine: string;
  pages: number;
  priceBdt: number;
  rowStatsMono: string;
  redPenNote: string;
  whatsAppSingleText: string;
  contentsTable: GuideContentRow[];
  whatMakesItDifferent: {
    title: string;
    description: string;
  }[];
  images: GuidePageImage[];
}

function makeGuideImage(
  moduleId: GuideModuleId,
  moduleName: 'Listening' | 'Reading' | 'Writing' | 'Speaking',
  fileSlug: string,
  page: number,
  caption: string
): GuidePageImage {
  return {
    fileSlug,
    src: `/guides/${moduleId}/${fileSlug}`,
    page,
    caption,
    alt: `IELTS DECODED ${moduleName} Self-Prep Guide, page ${page}: ${caption}`,
  };
}

/**
 * Generates candidate URLs for a guide screenshot so whether the owner uploads files into:
 * - /public/<fileSlug>
 * - /public/guides/<module>/<fileSlug>
 * - /src/assets/guides/<module>/<fileSlug>
 * or uploads .webp / .png / .jpg variants, it resolves automatically without placeholders.
 */
export function getCandidateImageUrls(moduleId: GuideModuleId, fileSlug: string): string[] {
  const baseNoExt = fileSlug.replace(/\.(webp|png|jpg|jpeg)$/i, '');
  const exts = ['webp', 'png', 'jpg'];
  const urls: string[] = [];

  for (const ext of exts) {
    const filename = `${baseNoExt}.${ext}`;
    urls.push(`/${filename}`);
    urls.push(`/guides/${moduleId}/${filename}`);
    urls.push(`/src/assets/guides/${moduleId}/${filename}`);
  }

  return Array.from(new Set(urls));
}

export const SELF_PREP_SERIES_FACTS = {
  seriesTitle: 'IELTS DECODED Self-Prep Series',
  edition: 'First edition 2026',
  totalPages: 222,
  unitPriceBdt: 499,
  licenceNote: "Licensed for the buyer's personal study. No sharing or reselling.",
  originalityNote:
    'All passages, scripts, maps, charts, questions, prompts and model answers are original exam-style practice written for these guides.',
  limitsNote:
    'PDF only (no video). Listening includes full scripts and 3 ways to practise without audio, but no audio recordings. The guides do not include personal teacher correction—that is what the live programs are for.',
};

export const WHAT_MAKES_GUIDES_DIFFERENT = [
  {
    num: '01',
    title: 'One method across all four guides',
    description:
      'Find the problem → fix it → track it. It is the exact same diagnostic system used in the free Score Rescue guide.',
  },
  {
    num: '02',
    title: 'Built to be written in',
    description:
      'Diagnostics, drills, error logs and trackers. You don’t just read the PDF passively—you work through it.',
  },
  {
    num: '03',
    title: 'An error log that records the cause, not just the answer',
    description:
      'Included in every guide so you see why marks are being lost instead of repeating the same slips.',
  },
  {
    num: '04',
    title: '“Official” vs “my advice” labels',
    description:
      'Every guide clearly separates what is an official IELTS rule from what is a classroom teaching method.',
  },
  {
    num: '05',
    title: 'Written by an Overall 8 teacher & 100% original',
    description:
      'Every passage, script, prompt, and model answer is original exam-style practice written for these guides, with a clear personal-study licence.',
  },
  {
    num: '06',
    title: 'Honest about limits',
    description:
      'Listening has full scripts (no audio recordings), and the guides give no personal feedback—that is what the live programs are for.',
  },
  {
    num: '07',
    title: 'Designed as one system',
    description:
      'The same clean navigation and layout across all four guides so you never get lost switching between modules.',
  },
  {
    num: '08',
    title: 'A plan, not a pile',
    description:
      'Each guide ends with a structured 4-week study plan and a practical test-day checklist.',
  },
  {
    num: '09',
    title: 'Bangla-speaker pronunciation notes',
    description:
      'The Speaking guide includes dedicated notes on common pronunciation tendencies for Bangla speakers.',
  },
];

export const SELF_PREP_GUIDES: GuideData[] = [
  {
    id: 'listening',
    num: '01',
    moduleName: 'Listening',
    title: 'IELTS DECODED · Listening Self-Prep Guide',
    subtitle: '50 pages · Prediction, traps, scripts & 3 ways to practise without audio',
    oneLine: 'Prediction, question-type methods, paraphrase & spelling drills, and 4 original practice sections with full scripts.',
    pages: 50,
    priceBdt: 499,
    rowStatsMono: '50 pp · 60 paraphrase pairs · 4 practice sections with scripts',
    redPenNote: 'start with the diagnostic',
    whatsAppSingleText: "Hi Jubayer, I'd like the IELTS DECODED Listening Self-Prep Guide (BDT 499).",
    contentsTable: [
      {
        category: 'START HERE',
        details: '10-minute diagnostic and "where to start" page.',
        monoStats: '10-min diagnostic',
      },
      {
        category: 'THE TEST',
        details: 'Format, band score tables, the four sections, marking rules that cost marks.',
        monoStats: '4 sections · marking rules',
      },
      {
        category: 'SKILLS',
        details: 'Prediction (reading ahead), how to answer each question type, traps and distractors, spelling and plurals, accents and connected speech.',
        monoStats: '60 paraphrase pairs · 50 spelling/date items',
      },
      {
        category: 'PRACTICE',
        details: 'Partial-dictation drills, 3 ways to practise without audio, and 4 original practice sections with full scripts (form completion; map + multiple choice; multiple choice + matching; note completion), each with questions and answer keys.',
        monoStats: '4 full-script sections · No audio files',
      },
      {
        category: 'REVIEW',
        details: 'How to review a practice test, cause-based error log, and score tracker.',
        monoStats: 'Error log · Score tracker',
      },
      {
        category: 'NEXT STEP',
        details: '4-week study plan and test-day checklist.',
        monoStats: '4-week plan · Checklist',
      },
    ],
    whatMakesItDifferent: [
      {
        title: '3 ways to practise without audio',
        description:
          'Honest about having no audio recordings: gives you full scripts, partial-dictation drills, and 3 structured ways to train prediction and paraphrase from transcripts.',
      },
      {
        title: '60 paraphrase pairs & 50 spelling/number traps',
        description:
          'Targets the exact spelling, plural, date, and number slips that quietly cost 3–4 raw marks in Section 1 and Section 4.',
      },
      {
        title: 'An error log that records the cause',
        description:
          'Separates missed answers caused by losing your place on the page from vocabulary/paraphrase gaps or spelling slips.',
      },
    ],
    images: [
      makeGuideImage('listening', 'Listening', 'listening-p01-cover.webp', 1, 'Cover'),
      makeGuideImage('listening', 'Listening', 'listening-p05-diagnostic.webp', 5, '10-minute diagnostic'),
      makeGuideImage('listening', 'Listening', 'listening-p17-paraphrase-bank.webp', 17, 'Paraphrase bank'),
      makeGuideImage('listening', 'Listening', 'listening-p26-section-1-form.webp', 26, 'Practice Section 1: form completion'),
      makeGuideImage('listening', 'Listening', 'listening-p30-section-2-map.webp', 30, 'Practice Section 2: map'),
      makeGuideImage('listening', 'Listening', 'listening-p43-error-log.webp', 43, 'Error log'),
      makeGuideImage('listening', 'Listening', 'listening-p45-four-week-plan.webp', 45, '4-week study plan'),
    ],
  },
  {
    id: 'reading',
    num: '02',
    moduleName: 'Reading',
    title: 'IELTS DECODED · Reading Self-Prep Guide',
    subtitle: '48 pages · All 14 question formats, timing trainer & 3 original passages',
    oneLine: 'Step-by-step methods for all 14 question formats, timing trainer, trap catalogue, 42 drills, and 3 full original passages.',
    pages: 48,
    priceBdt: 499,
    rowStatsMono: '48 pp · 14 question formats · 42 drills · 3 full original passages',
    redPenNote: 'start with the diagnostic',
    whatsAppSingleText: "Hi Jubayer, I'd like the IELTS DECODED Reading Self-Prep Guide (BDT 499).",
    contentsTable: [
      {
        category: 'START HERE',
        details: '10-minute diagnostic to pinpoint which question formats and timing habits are costing marks.',
        monoStats: '10-min diagnostic',
      },
      {
        category: 'THE TEST',
        details: 'The Academic Reading test on one page, band conversion table, and the 14 question formats.',
        monoStats: '14 question formats',
      },
      {
        category: 'SKILLS',
        details: 'Skim, scan and read closely; keywords and paraphrase; timing trainer; speed drills; True/False/Not Given, Yes/No/Not Given, Matching Headings, Matching Information/Features/Sentence Endings, completion types, diagram labelling.',
        monoStats: '2-page trap catalogue · 60 paraphrase pairs · 2 pp topic vocab',
      },
      {
        category: 'PRACTICE',
        details: '42 drill questions across 14 question types with answer keys, plus 3 full original passages with questions and explanations (and a page to run them as a full timed test).',
        monoStats: '42 drills · 3 full original passages',
      },
      {
        category: 'REVIEW',
        details: '2-page error log that records the cause of each mistake, timing log, and score tracker.',
        monoStats: '2-page error log · Timing log',
      },
      {
        category: 'NEXT STEP',
        details: '4-week study plan and test-day checklist.',
        monoStats: '4-week plan · Checklist',
      },
    ],
    whatMakesItDifferent: [
      {
        title: 'All 14 question formats broken down individually',
        description:
          'Shows the exact step-by-step order for True/False/Not Given, Matching Headings, and Matching Information so you stop reading whole passages blindly.',
      },
      {
        title: '2-page trap catalogue & timing trainer',
        description:
          'Trains you to spot first-sentence distractors, qualifier traps, and 20-minute passage pacing before attempting full tests.',
      },
      {
        title: '42 targeted drills before 3 full original passages',
        description:
          'Fix weak question types in isolation with 42 drills and answer keys, then test yourself on 3 full original exam-style passages.',
      },
    ],
    images: [
      makeGuideImage('reading', 'Reading', 'reading-p01-cover.webp', 1, 'Cover'),
      makeGuideImage('reading', 'Reading', 'reading-p08-14-formats.webp', 8, 'The 14 question formats'),
      makeGuideImage('reading', 'Reading', 'reading-p11-timing-trainer.webp', 11, 'Timing trainer'),
      makeGuideImage('reading', 'Reading', 'reading-p13-tfng.webp', 13, 'True / False / Not Given'),
      makeGuideImage('reading', 'Reading', 'reading-p18-trap-catalogue.webp', 18, 'Trap catalogue'),
      makeGuideImage('reading', 'Reading', 'reading-p30-passage-1-questions.webp', 30, 'Passage 1 questions'),
      makeGuideImage('reading', 'Reading', 'reading-p40-error-log.webp', 40, 'Error log'),
    ],
  },
  {
    id: 'writing',
    num: '03',
    moduleName: 'Writing',
    title: 'IELTS DECODED · Writing Self-Prep Guide',
    subtitle: '65 pages · Task 1 and Task 2, from 6.5 to 7.5+',
    oneLine: 'Task 1 & Task 2 methods, 15 original model answers, "Fix this paragraph: 6 → 7 → 8", 50 prompts, and 60+ editing drills.',
    pages: 65,
    priceBdt: 499,
    rowStatsMono: '65 pp · 15 model answers · 50 Task 2 prompts · 60+ editing exercises',
    redPenNote: '6 → 7 → 8 upgrades',
    whatsAppSingleText: "Hi Jubayer, I'd like the IELTS DECODED Writing Self-Prep Guide (BDT 499).",
    contentsTable: [
      {
        category: 'START HERE',
        details: '10-minute diagnostic; the four criteria in plain English; Band 6 → 8: what actually changes; every task type at a glance.',
        monoStats: '4 criteria · Band 6 → 8',
      },
      {
        category: 'THE TEST',
        details: 'Task 1 visual types and Task 2 essay types A–F mapped clearly with planning sheets.',
        monoStats: 'Task 1 visuals · Essay types A–F',
      },
      {
        category: 'SKILLS',
        details: 'Task 1: method, overview (weak vs strong), grouping skill with drills and keys, planning sheet, language for data, tactics by visual type. Task 2: method, introductions, body paragraphs, conclusions, planning sheet, outline practice with keys.',
        monoStats: 'Grouping drills · Outline practice',
      },
      {
        category: 'PRACTICE',
        details: '15 original model answers (7 Task 1 + 8 Task 2) with analysis, "Fix this paragraph: 6 → 7 → 8", 50 Task 2 prompts with idea starters (not memorised templates), 60+ editing and fix-it exercises with keys, collocations and topic vocabulary.',
        monoStats: '15 models · 50 prompts · 60+ fix-it drills',
      },
      {
        category: 'REVIEW',
        details: 'Self-marking rubric in plain English, error-patterns finder, Writing error log, timed practice log and score tracker.',
        monoStats: 'Self-marking rubric · Error log',
      },
      {
        category: 'NEXT STEP',
        details: '4-week study plan and test-day checklist.',
        monoStats: '4-week plan · Checklist',
      },
    ],
    whatMakesItDifferent: [
      {
        title: '“Fix this paragraph: 6 → 7 → 8” & 60+ editing exercises',
        description:
          'Instead of just showing finished Band 8 essays, it trains you to spot vague claims, weak overviews, and grammar slips and rewrite them step by step.',
      },
      {
        title: '50 Task 2 prompts with idea starters (not memorised templates)',
        description:
          'Helps you generate clear, relevant arguments and examples under exam timing without relying on robotic templates that cap your Task Response score.',
      },
      {
        title: 'Plain-English self-marking rubric',
        description:
          'Lets you audit your own Task 1 overview, paragraph unity, cohesion, and sentence variety when studying on your own.',
      },
    ],
    images: [
      makeGuideImage('writing', 'Writing', 'writing-p01-cover.webp', 1, 'Cover'),
      makeGuideImage('writing', 'Writing', 'writing-p14-grouping-drills.webp', 14, 'Grouping drills'),
      makeGuideImage('writing', 'Writing', 'writing-p21-line-graph-model.webp', 21, 'Line Graph model answer'),
      makeGuideImage('writing', 'Writing', 'writing-p38-fix-this-paragraph.webp', 38, 'Fix this paragraph: 6 → 7 → 8'),
      makeGuideImage('writing', 'Writing', 'writing-p48-prompt-bank.webp', 48, 'Prompt bank'),
      makeGuideImage('writing', 'Writing', 'writing-p52-editing-exercises.webp', 52, 'Editing exercises'),
      makeGuideImage('writing', 'Writing', 'writing-p57-self-marking-rubric.webp', 57, 'Self-marking rubric'),
    ],
  },
  {
    id: 'speaking',
    num: '04',
    moduleName: 'Speaking',
    title: 'IELTS DECODED · Speaking Self-Prep Guide',
    subtitle: '59 pages · Parts 1, 2 and 3, with pronunciation',
    oneLine: 'Natural frameworks for Parts 1–3, 58 cue cards, 32 model answers, Band 6 vs 7 vs 8 comparisons, and Bangla-speaker pronunciation notes.',
    pages: 59,
    priceBdt: 499,
    rowStatsMono: '59 pp · 100 Part 1 Qs · 58 cue cards · 72 Part 3 Qs · Pronunciation',
    redPenNote: 'natural, not memorised',
    whatsAppSingleText: "Hi Jubayer, I'd like the IELTS DECODED Speaking Self-Prep Guide (BDT 499).",
    contentsTable: [
      {
        category: 'START HERE',
        details: '10-minute diagnostic; what the criteria reward at Band 6, 7 and 8; "natural, not memorised".',
        monoStats: '10-min diagnostic · Band 6/7/8 criteria',
      },
      {
        category: 'THE TEST',
        details: 'How Parts 1, 2 and 3 work together and what examiners listen for in Fluency, Lexical Resource, Grammar and Pronunciation.',
        monoStats: 'Parts 1, 2 & 3 · 4 criteria',
      },
      {
        category: 'SKILLS',
        details: 'Part 1: answering naturally. Part 2: the 1-minute preparation method & note-taking practice. Part 3: five frameworks & what to do when you have no ideas. Side-by-side Band 6 vs 7 vs 8 answers and fluency toolkit.',
        monoStats: '5 Part 3 frameworks · Band 6 vs 7 vs 8',
      },
      {
        category: 'PRACTICE',
        details: 'Part 1: 100 questions across 25 topics + 12 model Q&As. Part 2: 8 full model answers + 58 cue cards. Part 3: 72 questions across 12 themes + 12 model answers. Pronunciation module: word stress, rhythm and chunking, intonation, connected speech, common difficulties for Bangla speakers (tendencies, not rules).',
        monoStats: '100 Part 1 Qs · 58 cue cards · 72 Part 3 Qs',
      },
      {
        category: 'REVIEW',
        details: 'Self-recording rubric, how to review your own recording, a mock-interview script a friend can run, error log, and score tracker.',
        monoStats: 'Self-recording rubric · Friend mock script',
      },
      {
        category: 'NEXT STEP',
        details: '4-week study plan and test-day checklist.',
        monoStats: '4-week plan · Checklist',
      },
    ],
    whatMakesItDifferent: [
      {
        title: 'Band 6 vs 7 vs 8 side-by-side answers',
        description:
          'See how the exact same Part 1, 2, or 3 question sounds at Band 6, Band 7, and Band 8—without unnatural memorised idioms.',
      },
      {
        title: 'Pronunciation notes for Bangla speakers',
        description:
          'Covers word stress, rhythm, chunking, intonation, connected speech, and specific pronunciation tendencies common among Bangla speakers.',
      },
      {
        title: 'Self-recording rubric & friend mock-interview script',
        description:
          'Gives you a structured way to record yourself alone, grade your own pauses and grammar slips, or run a full mock test with a friend.',
      },
    ],
    images: [
      makeGuideImage('speaking', 'Speaking', 'speaking-p01-cover.webp', 1, 'Cover'),
      makeGuideImage('speaking', 'Speaking', 'speaking-p21-part-2-model.webp', 21, 'Part 2 model answer'),
      makeGuideImage('speaking', 'Speaking', 'speaking-p41-band-6-7-8.webp', 41, 'Band 6, 7, 8 comparison'),
      makeGuideImage('speaking', 'Speaking', 'speaking-p45-word-stress.webp', 45, 'Word stress'),
      makeGuideImage('speaking', 'Speaking', 'speaking-p49-bangla-speakers.webp', 49, 'Difficulties for Bangla speakers'),
      makeGuideImage('speaking', 'Speaking', 'speaking-p52-mock-interview.webp', 52, 'Mock interview script'),
      makeGuideImage('speaking', 'Speaking', 'speaking-p55-four-week-plan.webp', 55, '4-week plan'),
    ],
  },
];

export const GUIDES_FAQ_ITEMS = [
  {
    question: 'Is this a PDF or a video course?',
    answer:
      'PDF guides, no video. Each guide is a standalone PDF designed for one student working through diagnostics, drills, and study plans on their own.',
  },
  {
    question: 'Is audio included for Listening?',
    answer:
      'No recordings, but full scripts and three ways to practise without audio are included alongside 60 paraphrase pairs, 50 spelling/date/number items, and partial-dictation drills.',
  },
  {
    question: 'Is it for Academic or General Training?',
    answer:
      'Written for Academic IELTS. Listening and Speaking tips apply to both.',
  },
  {
    question: 'Are these real exam questions?',
    answer:
      'No. All practice material—passages, scripts, maps, charts, questions, prompts and model answers—is original, exam-style, and written specifically for these guides.',
  },
  {
    question: 'Which guide should I start with?',
    answer:
      'Take the 10-minute diagnostic in the free Score Rescue guide first to see which module is costing you the most marks.',
  },
  {
    question: 'How do I get it?',
    answer:
      'Message us on WhatsApp at 01305273703. Payment details are shared in the chat, and the PDF is sent directly to you.',
  },
  {
    question: 'Is there a discount?',
    answer:
      'Yes, when you buy 3 or more guides, a bundle discount applies. The exact bundle amount is confirmed on WhatsApp.',
  },
  {
    question: 'Can I share it with friends?',
    answer:
      "No. Each guide is licensed strictly for the buyer's personal study. No sharing or reselling.",
  },
  {
    question: 'Will someone correct my Writing or Speaking?',
    answer:
      'Not in the guides. The guides include self-marking rubrics and error logs for studying alone; our live programs include personal writing correction and speaking feedback.',
  },
];
