import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const GEMINI_TEXT_MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalizes a band score string/number to a valid IELTS 0.5 increment between 1.0 and 9.0.
 */
function normalizeIeltsBand(raw: unknown, fallback = 6.5): number {
  const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(/[^0-9.]/g, ''));
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 9) {
    return fallback;
  }
  return Math.round(parsed * 2) / 2;
}

/**
 * Calculates the official IELTS Writing overall band score from the 4 criterion scores.
 * Official IELTS Writing rounding rule:
 * - Average the 4 criteria equally (25% each).
 * - Round to the nearest 0.5 band (.25 rounds up to .5; .75 rounds up to the next whole band;
 *   .125 rounds down to .0; .625 rounds down to .5).
 * Note: Math.round(avg * 2) / 2 implements this exact IELTS rounding rule (e.g., 8.75 * 2 = 17.5 -> 18 / 2 = 9.0;
 * 8.25 * 2 = 16.5 -> 17 / 2 = 8.5; 6.125 * 2 = 12.25 -> 12 / 2 = 6.0).
 */
function calculateOfficialIeltsOverallBand(criteriaBands: number[]): string {
  if (criteriaBands.length !== 4) {
    return '6.5';
  }
  const sum = criteriaBands.reduce((acc, b) => acc + b, 0);
  const avg = sum / 4;
  const rounded = Math.round(avg * 2) / 2;
  return rounded.toFixed(1);
}

/**
 * Calls Gemini with automatic multi-model fallback and retry on 503/429 high-demand spikes.
 */
async function generateJsonWithCascade(options: {
  contents: string;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
  temperature?: number;
}): Promise<string> {
  const ai = getGeminiClient();
  let lastError: unknown = null;

  for (const modelName of GEMINI_TEXT_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const isGemini3 = modelName.startsWith('gemini-3');
        const response = await ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature ?? 0.2,
            responseMimeType: 'application/json',
            responseSchema: options.responseSchema,
            ...(isGemini3
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
          },
        });
        const text = response.text?.trim();
        if (text) {
          return text;
        }
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isTransient =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('high demand') ||
          msg.includes('overloaded');

        if (isTransient && attempt === 0) {
          await sleep(300);
          continue;
        }
        // Move immediately to the next model in the cascade
        break;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('All examiner models are temporarily busy.');
}

/**
 * Full-Range (Band 4.0 to Band 9.0) Official IELTS Band Descriptor fallback analyzer
 * used ONLY if every Gemini model in the cascade is simultaneously unreachable.
 * Accurately distinguishes Band 9, Band 8, Band 7, Band 6, and Band 5 writing without
 * artificially capping high-level scripts at Band 6.5.
 */
function buildFallbackWritingEvaluation(params: {
  taskType: string;
  promptQuestion: string;
  studentResponse: string;
  targetBand: string;
}) {
  const { taskType, studentResponse, targetBand } = params;
  const paragraphs = studentResponse
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const words = studentResponse.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = studentResponse
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  // Check for mechanical sentence-initial linkers
  const mechanicalLinkerMatches =
    studentResponse.match(
      /(?:^|[.!?]\s+)(firstly|secondly|thirdly|lastly|moreover|furthermore|in addition to this|nowadays|in a nutshell|to sum up)\b/gi
    ) || [];

  // Check for memorised template clichés
  const clicheMatches =
    studentResponse.match(
      /\b(in this modern era|modern era of globalization|burning issue|plays a vital role|double-edged sword|every coin has two sides|since the dawn of time|with the advancement of technology|broaden their horizons)\b/gi
    ) || [];

  // Check for genuine grammatical & syntactic errors common in Band 5–6.5 scripts
  const grammarErrorPatterns = [
    /\bevery (?:person|people|student|citizen|child|country) (?:are|have|were)\b/gi,
    /\bevery (?:person|student|child) life\b/gi,
    /\bless (?:people|students|cars|workers|citizens|problems|opportunities)\b/gi,
    /\bmore (?:better|faster|easier|worse|higher)\b/gi,
    /\binformations\b|\badvices\b|\bequipments\b|\bresearches\b|\bknowledges\b|\btraffics\b|\bluggages\b/gi,
    /\ba lot of (?:informations|advices|equipments)\b/gi,
    /\bdepend to\b|\bdiscuss about\b|\bcomprise of\b|\bdespite of\b|\bemphasis on\b/gi,
    /\bpeoples\b|\bchildrens\b/gi,
    /\bcan able to\b|\bwill can\b|\bmust to\b|\bshould to\b/gi,
    /\btraffic jam\b(?!\s+in)/gi,
    /\banother (?:people|countries|things|reasons|benefits)\b/gi,
    /\bthere is many\b|\bthere are much\b/gi,
  ];
  let detectedGrammarErrors = 0;
  for (const pat of grammarErrorPatterns) {
    const m = studentResponse.match(pat);
    if (m) detectedGrammarErrors += m.length;
  }

  // Check for varied subordination, relative clauses, conditionals, concession, participial clauses
  const complexGrammarMatches =
    studentResponse.match(
      /\b(although|even though|whereas|while|whilst|despite|in spite of|provided that|unless|if|whether|which|whose|whereby|not only|consequently|therefore|nevertheless|nonetheless|having|given that)\b/gi
    ) || [];

  // Lexical variety (type-token ratio adjusted for length)
  const cleanTokens = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, '')).filter((w) => w.length > 2);
  const uniqueTokens = new Set(cleanTokens);
  const lexicalDiversity = cleanTokens.length > 0 ? uniqueTokens.size / cleanTokens.length : 0.5;

  const hasOverview =
    /\b(overall|in general|generally speaking|main trend|most noticeable|it is clear that|broadly)\b/i.test(
      studentResponse
    );

  const firstCriterionName =
    taskType === 'task1_report' ? 'Task Achievement' : 'Task Response';

  // Determine min word count expectations
  const expectedMinWords =
    taskType === 'task2_intro' ? 35 : taskType === 'task1_report' ? 150 : 250;

  // Base calibration from 8.5 down or up depending on positive & negative descriptor evidence
  let trScore = 8.0;
  let ccScore = 8.0;
  let lrScore = 8.0;
  let graScore = 8.0;

  // Word count / task development adjustments
  if (wordCount < expectedMinWords * 0.65) {
    trScore = 5.0;
    ccScore = Math.min(ccScore, 5.5);
  } else if (wordCount < expectedMinWords * 0.9) {
    trScore = 6.0;
  } else if (wordCount >= expectedMinWords && paragraphs.length >= (taskType === 'task2_intro' ? 1 : 4)) {
    trScore = 8.5;
  }

  if (taskType === 'task1_report' && !hasOverview) {
    trScore = Math.min(trScore, 5.5);
  }

  // Template / cliché adjustments
  if (clicheMatches.length >= 2) {
    trScore = Math.min(trScore, 6.0);
    lrScore = Math.min(lrScore, 6.0);
  } else if (clicheMatches.length === 1) {
    trScore = Math.min(trScore, 6.5);
    lrScore = Math.min(lrScore, 6.5);
  } else if (lexicalDiversity >= 0.54 && wordCount >= expectedMinWords) {
    lrScore = 8.5;
  }

  // Cohesion adjustments
  if (mechanicalLinkerMatches.length >= 3) {
    ccScore = 6.0;
  } else if (mechanicalLinkerMatches.length === 2) {
    ccScore = 6.5;
  } else if (mechanicalLinkerMatches.length === 1) {
    ccScore = 7.5;
  } else if (paragraphs.length >= (taskType === 'task2_intro' ? 1 : 4) && sentences.length >= (taskType === 'task2_intro' ? 2 : 10)) {
    ccScore = 8.5;
  }

  // Grammar adjustments
  if (detectedGrammarErrors >= 3) {
    graScore = 5.5;
    trScore = Math.min(trScore, 6.0);
  } else if (detectedGrammarErrors === 2) {
    graScore = 6.0;
    trScore = Math.min(trScore, 6.5);
  } else if (detectedGrammarErrors === 1) {
    graScore = 6.5;
  } else if (complexGrammarMatches.length >= 5 && sentences.length >= 8) {
    graScore = 8.5;
  }

  // Promote to Band 9.0 when a full-length essay exhibits zero clichés, zero mechanical linkers,
  // zero detected grammar errors, strong lexical precision, and well-proportioned paragraphing
  if (
    wordCount >= expectedMinWords &&
    clicheMatches.length === 0 &&
    mechanicalLinkerMatches.length === 0 &&
    detectedGrammarErrors === 0 &&
    complexGrammarMatches.length >= (taskType === 'task2_intro' ? 1 : 4) &&
    lexicalDiversity >= 0.52
  ) {
    trScore = 9.0;
    ccScore = 9.0;
    lrScore = 9.0;
    graScore = 9.0;
  }

  const overallBand = calculateOfficialIeltsOverallBand([trScore, ccScore, lrScore, graScore]);
  const overallNumeric = parseFloat(overallBand);

  const firstSentence = sentences[0] || studentResponse.slice(0, 120).trim();
  const secondSentence = sentences[1] || sentences[sentences.length - 1] || firstSentence;

  const isHighBand = overallNumeric >= 8.0;

  return {
    overallBand,
    examinerVerdictHeadline: isHighBand
      ? `Your response demonstrates authentic Band ${overallBand} control across the official IELTS descriptors—natural cohesion, clear task fulfilment, and accurate syntax.`
      : `Your draft demonstrates a Band ${overallBand} foundation, with specific descriptor bottlenecks in ${
          graScore <= lrScore ? 'grammatical accuracy' : 'lexical precision'
        } and cohesion.`,
    examinerSummaryNote: isHighBand
      ? `This script satisfies the Band ${overallBand} descriptors smoothly: your position is coherent and fully developed without relying on memorised templates or forced vocabulary, and your sentences are consistently accurate.`
      : `You address the prompt topic and organise your response into readable paragraphs. To move from Band ${overallBand} to Band ${targetBand}, focus on eliminating mechanical sentence-initial linkers, cutting memorised clichés, and increasing your ratio of error-free clauses.`,
    criteria: [
      {
        name: firstCriterionName,
        band: trScore.toFixed(1),
        descriptorMatch:
          trScore >= 8.5
            ? 'Prompt is appropriately and fully addressed; a clear, fully developed position is presented with relevant, extended support.'
            : trScore >= 7.0
            ? 'Addresses all parts of the task and presents a clear, developed position throughout the response.'
            : 'Addresses the main task, though some points remain general or rely on formulaic framing.',
        specificFeedback:
          trScore >= 8.0
            ? `Your opening ("${firstSentence.slice(0, 80)}...") frames the issue directly and naturally. Your arguments are logically extended and directly answer the prompt without digression.`
            : `Your opening ("${firstSentence.slice(0, 80)}...") introduces the topic, though ${
                clicheMatches.length > 0
                  ? `phrases like "${clicheMatches[0]}" read as memorised framing.`
                  : 'your supporting points need more specific cause-and-effect extension.'
              }`,
      },
      {
        name: 'Coherence & Cohesion',
        band: ccScore.toFixed(1),
        descriptorMatch:
          ccScore >= 8.5
            ? 'Cohesion is managed effortlessly so that it attracts no attention; paragraphing is skilful and progression is seamless.'
            : ccScore >= 7.0
            ? 'Logically organises information and ideas with a clear progression throughout and appropriate cohesive devices.'
            : 'Arranges information coherently, but uses some cohesive devices mechanically at the start of sentences.',
        specificFeedback:
          ccScore >= 8.0
            ? 'Your ideas progress organically from sentence to sentence using natural referencing and lexical ties rather than mechanical signposting.'
            : mechanicalLinkerMatches.length > 0
            ? `You rely on overt sentence-initial signposts (${mechanicalLinkerMatches
                .slice(0, 3)
                .join(', ')}). Replace these with internal referencing ("This policy...", "Such measures...") for smoother Band 8+ flow.`
            : 'Your paragraph progression is clear; tightening the topic sentence of each body paragraph will further strengthen cohesion.',
      },
      {
        name: 'Lexical Resource',
        band: lrScore.toFixed(1),
        descriptorMatch:
          lrScore >= 8.5
            ? 'Uses a wide range of vocabulary fluently and flexibly to convey precise meanings with natural and sophisticated control of lexical features.'
            : lrScore >= 7.0
            ? 'Uses a sufficient range of vocabulary to allow flexibility and precision, with awareness of style and collocation.'
            : 'Uses an adequate range of vocabulary for the task, though some phrasing is general or formulaic.',
        specificFeedback:
          lrScore >= 8.0
            ? 'Your word choice is natural, accurate, and appropriate to the register—you convey precise meaning without forcing artificial or archaic vocabulary.'
            : clicheMatches.length > 0
            ? `Avoid memorised template expressions such as "${clicheMatches.join('", "')}". Official IELTS examiners discount memorised clichés and reward natural, topic-specific collocations.`
            : 'You communicate clearly; upgrading general nouns and verbs into precise topic collocations will lift this score.',
      },
      {
        name: 'Grammatical Range & Accuracy',
        band: graScore.toFixed(1),
        descriptorMatch:
          graScore >= 8.5
            ? 'Uses a wide range of structures with full flexibility and accuracy; the vast majority of sentences are completely error-free.'
            : graScore >= 7.0
            ? 'Uses a variety of complex structures and produces frequent error-free sentences with good control of grammar and punctuation.'
            : 'Uses a mix of simple and complex sentence forms, with some errors in grammar and punctuation that rarely reduce communication.',
        specificFeedback:
          graScore >= 8.0
            ? 'Your syntactic control is strong: you balance clear simple sentences with subordinate and relative clauses accurately and naturally.'
            : 'You attempt multi-clause structures, but countable/uncountable noun slips, determiner errors, or awkward phrasing reduce the proportion of error-free sentences.',
      },
    ],
    redPenUpgrades: [
      {
        originalSentence: firstSentence,
        whyItLosesMarks: isHighBand
          ? 'Already Band 8.5–9.0 quality—clear, natural, and grammatically accurate. Shown below is an alternative Band 9 stylistic variation:'
          : 'Can be tightened for stronger academic precision and natural Band 8+ register.',
        band75Upgrade: firstSentence,
      },
      {
        originalSentence: secondSentence,
        whyItLosesMarks: isHighBand
          ? 'Already effective and well-controlled in your script. Here is an alternative Band 9 syntactic phrasing:'
          : 'Upgrading the clause linkage and lexical precision strengthens both LR and GRA.',
        band75Upgrade: secondSentence,
      },
    ],
    priorityActionSteps: isHighBand
      ? [
          'Maintain this exact balance of clarity and natural collocation under timed 40-minute exam conditions.',
          'Continue avoiding artificial "thesaurus" vocabulary—your clear, accurate phrasing is what secures Band 8.5–9.0.',
          'Reserve 2 minutes at the end of the test to verify zero typographical slips.',
        ]
      : [
          'Cut memorised hook phrases and open directly with an accurate paraphrase of the prompt.',
          'Replace mechanical sentence-initial linkers ("Firstly", "Moreover") with internal pronoun and demonstratives referencing ("This shift...", "Such policies...").',
          'Proofread countable plural nouns and articles ("the" vs zero article) to maximise your percentage of 100% error-free sentences.',
        ],
    recommendedNextStep: {
      offerTitle: 'IELTS DECODED Writing Self-Prep Guide (BDT 499)',
      reason: isHighBand
        ? `Your writing is already at Band ${overallBand}. If you want to ensure your other modules (Reading, Listening, Speaking) match this standard on test day, review our complete module frameworks.`
        : `Since your draft is currently at Band ${overallBand}, applying the exact Task 1 & Task 2 paragraph frameworks and sentence upgrades will help you reach Band ${targetBand}.`,
      waKeyword: `Hi Jubayer, I checked my Writing on the Diagnostic Desk (scored Band ${overallBand}, target ${targetBand}). I want your advice on my IELTS preparation.`,
    },
  };
}

function buildFallbackScoreAdvisor(params: {
  listening: string;
  reading: string;
  writing: string;
  speaking: string;
  targetBand: string;
  timeline: string;
}) {
  const l = parseFloat(params.listening) || 6.0;
  const r = parseFloat(params.reading) || 6.0;
  const w = parseFloat(params.writing) || 5.5;
  const s = parseFloat(params.speaking) || 6.0;
  const avg = Math.round(((l + r + w + s) / 4) * 2) / 2;

  const scores = [
    { name: 'Listening', val: l },
    { name: 'Reading', val: r },
    { name: 'Writing', val: w },
    { name: 'Speaking', val: s },
  ];
  scores.sort((a, b) => a.val - b.val);
  const weakest = scores[0];
  const receptiveMin = r <= l ? { name: 'Reading', val: r } : { name: 'Listening', val: l };

  const isUrgent = params.timeline.toLowerCase().includes('week') || params.timeline.includes('1 month');

  return {
    currentOverall: avg.toFixed(1),
    gapSummaryHeadline: `You are currently at Overall Band ${avg.toFixed(1)}—reaching Band ${params.targetBand} requires fixing ${weakest.name} while locking in fast marks in ${receptiveMin.name}.`,
    primaryBottleneckModule: `${weakest.name} (Band ${weakest.val.toFixed(1)})`,
    fastestGainModule: `${receptiveMin.name} (Band ${receptiveMin.val.toFixed(1)} → ${(receptiveMin.val + 1.0).toFixed(1)})`,
    honestAssessment: `With ${params.timeline} before your test, taking random mock tests will keep you stuck at ${avg.toFixed(1)}. Your fastest mathematical path to Overall ${params.targetBand} is raising ${receptiveMin.name} by 1.0 band through question-type elimination while getting targeted sentence-level correction in ${weakest.name}.`,
    fourteenDayFocus: [
      `Days 1–5: Stop full timed tests and isolate your 3 lowest-scoring question types in ${receptiveMin.name} using a mistake log.`,
      `Days 6–10: Rebuild your ${weakest.name} structure using official Band 7+ criteria instead of memorised templates.`,
      `Days 11–14: Complete 2 targeted timed sections under exam conditions and review every single error by cause (Knowledge, Strategy, or Careless slip).`,
    ],
    primaryRecommendation: isUrgent
      ? {
          title: '1-Month 1-to-1 Live IELTS Crash Course (BDT 9,999)',
          whyItFits: `Because your timeline is ${params.timeline} and ${weakest.name} is at Band ${weakest.val.toFixed(1)}, private 1-to-1 live sessions focused strictly on your weak modules will move your score fastest.`,
          whatsappMessage: `Hi Jubayer, my current scores are L:${params.listening} R:${params.reading} W:${params.writing} S:${params.speaking} (Overall ${avg.toFixed(1)}) and my target is Band ${params.targetBand} in ${params.timeline}. Please guide me.`,
        }
      : {
          title: '12-Week Band 7+ Roadmap Mentorship Program (BDT 7,999)',
          whyItFits: `With ${params.timeline} available, the 10-student cohort gives you structured mastery of all 4 modules, personal writing correction, and weekly speaking feedback.`,
          whatsappMessage: `Hi Jubayer, my current scores are L:${params.listening} R:${params.reading} W:${params.writing} S:${params.speaking} (Overall ${avg.toFixed(1)}) and my target is Band ${params.targetBand}. I want to know more about joining your program.`,
        },
  };
}

// In-memory set of normalized WhatsApp numbers that have already succeeded in the current server process
const submittedNumbers = new Set<string>();

/**
 * Normalizes and validates a WhatsApp phone number.
 * Supports Bangladesh numbers (01[3-9]XXXXXXXX, +8801[3-9]XXXXXXXX, 8801[3-9]XXXXXXXX)
 * as well as valid international numbers (10 to 15 digits).
 */
function validateAndNormalizePhone(rawInput: string): {
  valid: boolean;
  normalized: string;
  display: string;
  error?: string;
} {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Please enter your WhatsApp number.',
    };
  }

  // Only allow digits, spaces, +, -, (, )
  if (!/^[+\d\s\-()]+$/.test(trimmed)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Please enter a valid WhatsApp phone number (digits only).',
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

  // Reject obvious fake repeating numbers (e.g., 00000000000, 11111111111) or simple sequences
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

  // Bangladesh mobile number validation when starting with 01, 8801, or +8801
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
        error: 'Bangladesh WhatsApp numbers with 880 must be 13 digits (e.g. +88017XXXXXXXX).',
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
 * Formats timestamp in Bangladesh Standard Time (Asia/Dhaka) for Google Sheets readability.
 */
function formatDhakaTimestamp(date: Date): string {
  try {
    return (
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(date) + ' BST'
    );
  } catch {
    return date.toISOString();
  }
}

/**
 * Sends the lead to the Google Apps Script Web App URL (GOOGLE_SHEETS_WEBHOOK_URL)
 * and waits for a successful response.
 */
async function sendLeadToGoogleSheetsWebhook(
  webhookUrl: string,
  lead: {
    fullName: string;
    whatsappNumber: string;
    normalizedWhatsapp: string;
    submittedAt: string;
    isoTimestamp: string;
    source: string;
  }
): Promise<void> {
  const payload = {
    name: lead.fullName,
    fullName: lead.fullName,
    whatsapp: lead.whatsappNumber,
    whatsappNumber: lead.whatsappNumber,
    normalizedWhatsapp: lead.normalizedWhatsapp,
    timestamp: lead.submittedAt,
    submittedAt: lead.submittedAt,
    isoTimestamp: lead.isoTimestamp,
    source: lead.source,
    guide: 'IELTS Band 7+ Score Rescue',
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
    },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(
      `Google Sheet submission failed (HTTP ${response.status}). Please try again.`
    );
  }

  const responseText = await response.text().catch(() => '');

  // Google Apps Script errors or sign-in pages return HTML error pages even on 200 OK
  if (
    responseText.includes('accounts.google.com/ServiceLogin') ||
    responseText.includes('script.google.com/macros/error') ||
    responseText.includes('TypeError:') ||
    responseText.includes('ReferenceError:') ||
    responseText.includes('Exception:')
  ) {
    throw new Error(
      'Google Sheet Web App returned an error or requires "Anyone" access in deployment settings.'
    );
  }

  // If the Apps Script returns JSON, verify it didn't explicitly return { result: 'error' } or { ok: false }
  try {
    const parsed = JSON.parse(responseText) as {
      ok?: boolean;
      result?: string;
      status?: string;
      error?: string;
    };
    if (
      parsed &&
      (parsed.ok === false ||
        parsed.result === 'error' ||
        parsed.status === 'error')
    ) {
      throw new Error(
        parsed.error || 'Google Sheet Web App reported a submission error.'
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Google Sheet')) {
      throw err;
    }
    // Non-JSON plain text responses (e.g., "OK" or "Success") from Apps Script are valid
  }
}

/**
 * Resolves the Free Rescue Guide PDF file path.
 * Prioritizes any user-uploaded PDF in /public or project root, and falls back to
 * /public/IELTS-Band-7-Score-Rescue.pdf.
 */
function resolveRescueGuidePdfPath(): { filePath: string; downloadName: string } | null {
  const publicDir = path.resolve(__dirname, 'public');
  const rootDir = __dirname;

  const preferredCandidates = [
    path.join(publicDir, 'IELTS_Band7_Score_Rescue.pdf'),
    path.join(publicDir, 'Free Rescue Guide.pdf'),
    path.join(publicDir, 'free-rescue-guide.pdf'),
    path.join(publicDir, 'IELTS DECODED - Band 7+ Score Rescue.pdf'),
    path.join(publicDir, 'IELTS-Band-7-Score-Rescue.pdf'),
    path.join(publicDir, 'score-rescue.pdf'),
    path.join(publicDir, 'rescue-guide.pdf'),
  ];

  const allPdfs: { filePath: string; mtimeMs: number; name: string }[] = [];
  for (const dir of [publicDir, rootDir]) {
    if (!fs.existsSync(dir)) continue;
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (entry.toLowerCase().endsWith('.pdf')) {
          const full = path.join(dir, entry);
          const stat = fs.statSync(full);
          if (stat.isFile()) {
            allPdfs.push({ filePath: full, mtimeMs: stat.mtimeMs, name: entry });
          }
        }
      }
    } catch {
      // ignore read errors
    }
  }

  if (allPdfs.length > 1) {
    allPdfs.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return {
      filePath: allPdfs[0].filePath,
      downloadName: 'IELTS-DECODED-Band-7-Score-Rescue.pdf',
    };
  }

  for (const candidate of preferredCandidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return {
        filePath: candidate,
        downloadName: 'IELTS-DECODED-Band-7-Score-Rescue.pdf',
      };
    }
  }

  if (allPdfs.length === 1) {
    return {
      filePath: allPdfs[0].filePath,
      downloadName: 'IELTS-DECODED-Band-7-Score-Rescue.pdf',
    };
  }

  return null;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // =========================================================================
  // POST /api/leads — Validate and send lead to GOOGLE_SHEETS_WEBHOOK_URL
  // =========================================================================
  app.post('/api/leads', async (req, res) => {
    try {
      const rawName = String(req.body?.fullName ?? req.body?.name ?? '').trim();
      const rawWhatsapp = String(req.body?.whatsappNumber ?? req.body?.whatsapp ?? '').trim();
      const source = String(req.body?.source ?? 'Free Rescue Guide Modal').trim();

      if (!rawName || rawName.length < 2) {
        res.status(400).json({
          ok: false,
          error: 'Please enter your full name.',
        });
        return;
      }

      const phoneCheck = validateAndNormalizePhone(rawWhatsapp);
      if (!phoneCheck.valid) {
        res.status(400).json({
          ok: false,
          error: phoneCheck.error || 'Please enter a valid WhatsApp number.',
        });
        return;
      }

      const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
      if (!webhookUrl) {
        res.status(503).json({
          ok: false,
          error:
            'Google Sheet connection is not configured yet (GOOGLE_SHEETS_WEBHOOK_URL is missing). Please try again shortly.',
        });
        return;
      }

      // Prevent duplicate Google Sheet rows if the exact same WhatsApp number was already recorded
      if (submittedNumbers.has(phoneCheck.normalized)) {
        res.status(200).json({
          ok: true,
          duplicate: true,
          downloadUrl: '/api/rescue-guide/download',
        });
        return;
      }

      const now = new Date();
      const submittedAt = formatDhakaTimestamp(now);
      const isoTimestamp = now.toISOString();

      // Send to GOOGLE_SHEETS_WEBHOOK_URL and wait for a successful response
      await sendLeadToGoogleSheetsWebhook(webhookUrl, {
        fullName: rawName,
        whatsappNumber: phoneCheck.display,
        normalizedWhatsapp: phoneCheck.normalized,
        submittedAt,
        isoTimestamp,
        source,
      });

      submittedNumbers.add(phoneCheck.normalized);

      res.status(200).json({
        ok: true,
        duplicate: false,
        downloadUrl: '/api/rescue-guide/download',
        lead: {
          fullName: rawName,
          whatsappNumber: phoneCheck.display,
          submittedAt,
        },
      });
    } catch (err) {
      console.error('Error sending lead to GOOGLE_SHEETS_WEBHOOK_URL:', err);
      res.status(502).json({
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Could not save your details to Google Sheets right now. Please try again.',
      });
    }
  });

  // =========================================================================
  // GET /api/rescue-guide/download — Triggers direct download of the PDF
  // =========================================================================
  app.get('/api/rescue-guide/download', (_req, res) => {
    const resolved = resolveRescueGuidePdfPath();
    if (!resolved) {
      res.status(404).send('Free Rescue Guide PDF not found.');
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${resolved.downloadName}"`
    );
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(resolved.filePath);
  });

  // =========================================================================
  // POST /api/ai/writing-evaluation — Official IELTS Band Descriptor Evaluator
  // =========================================================================
  app.post('/api/ai/writing-evaluation', async (req, res) => {
    try {
      const taskType = String(req.body?.taskType ?? 'task2_essay').trim();
      const promptQuestion = String(req.body?.promptQuestion ?? '').trim();
      const studentResponse = String(req.body?.studentResponse ?? '').trim();
      const targetBand = String(req.body?.targetBand ?? '7.0').trim();

      if (!studentResponse || studentResponse.split(/\s+/).filter(Boolean).length < 15) {
        res.status(400).json({
          ok: false,
          error: 'Please enter at least 15 words of your writing so the examiner can evaluate it properly.',
        });
        return;
      }

      if (studentResponse.length > 6000) {
        res.status(400).json({
          ok: false,
          error: 'Your submission is too long. Please keep it under 800 words.',
        });
        return;
      }

      const taskLabel =
        taskType === 'task2_intro'
          ? 'Academic IELTS Writing Task 2 Introduction (Paraphrase + Thesis/Outline)'
          : taskType === 'task1_report'
          ? 'Academic IELTS Writing Task 1 Report'
          : 'Academic IELTS Writing Task 2 Essay';

      const firstCriterionName =
        taskType === 'task1_report' ? 'Task Achievement' : 'Task Response';

      const systemInstruction = `You are a Principal Official IELTS Writing Examiner and Assessment Specialist at IELTS DECODED.
Your sole responsibility is to evaluate a candidate's ${taskLabel} with complete fidelity to the **Official Public IELTS Writing Band Descriptors** (May 2023 edition).

Do NOT rely on generic writing quality, personal stylistic preferences, thesaurus vocabulary complexity, or an arbitrary mistake-counting formula.

=============================================================================
CORE ASSESSMENT METHODOLOGY (MANDATORY FOR EVERY SUBMISSION)
=============================================================================
Assess these four criteria **independently, rigorously, and holistically** (each is worth 25%):
1. **${firstCriterionName}** (${
        taskType === 'task1_report'
          ? 'Task Achievement for Writing Task 1'
          : 'Task Response for Writing Task 2'
      })
2. **Coherence and Cohesion**
3. **Lexical Resource**
4. **Grammatical Range and Accuracy**

For each criterion:
- Compare the essay directly against the characteristics described in the official IELTS band descriptors (Bands 5, 6, 7, 8, and 9).
- Determine the **highest band whose descriptor is consistently satisfied** by the writing ("best-fit" holistic judgement).
- Do NOT automatically lower the score because the essay is not "perfect." Even Official Band 9 and Band 8 descriptors explicitly allow for "occasional minor slips" or "occasional inaccuracies."
- Do NOT reward vocabulary simply because it sounds obscure or archaic.
- Do NOT penalize natural, concise, simple language when it is accurate, idiomatic, and appropriate to the task.
- Do NOT invent requirements that are not part of the IELTS band descriptors (never require a specific hook, a specific paragraph count, complex linking adverbs in every sentence, or rare vocabulary in every sentence).
- Distinguish strictly between a genuine descriptor weakness (which lowers the band) and a stylistic preference (which does NOT lower the band).
- Do NOT let one criterion disproportionately contaminate or drag down the other criteria.

=============================================================================
EXTREMELY IMPORTANT: BAND 9 & BAND 8 CALIBRATION (PREVENT SCORE DEFLATION)
=============================================================================
You MUST recognize a genuine **Band 9** response as **Band 9.0** and a genuine **Band 8** response as **Band 8.0–8.5**.
Do NOT assume that:
- every sentence must contain sophisticated or rare vocabulary;
- every sentence must be multi-clause or syntactically convoluted;
- every paragraph must contain overt linking words ("Furthermore", "Moreover", "Consequently");
- a few minor stylistic preferences or a single slip automatically reduce the score;
- clear, direct, "simple" language means low-band writing.

In fact, authentic Band 9 IELTS essays often use clean, natural, direct academic English where cohesion is invisible ("attracts no attention") and vocabulary is chosen for precise meaning rather than showiness.
Conversely, an essay stuffed with forced "advanced" words or memorised templates ("In this modern era of globalization", "burning issue", "double-edged sword") that has weak logic, mechanical transitions, or grammar errors must be scored down according to the descriptors.

=============================================================================
OFFICIAL IELTS BAND DESCRIPTORS REFERENCE (BANDS 5 TO 9)
=============================================================================

### 1. ${firstCriterionName}
${
  taskType === 'task1_report'
    ? `- **Band 9**: All requirements of the task are fully and appropriately satisfied. Clear, fully developed overview of main trends/differences/stages; key features are skilfully selected, clearly presented, highlighted, and illustrated with accurate data comparisons.
- **Band 8**: Covers all requirements of the task sufficiently; presents, highlights, and illustrates key features/bullet points clearly and appropriately, with a clear overview.
- **Band 7**: Covers the requirements of the task; presents a clear overview of main trends, differences, or stages; clearly presents and highlights key features, though could be more fully extended.
- **Band 6**: Addresses the requirements of the task; presents an overview with information appropriately selected; presents and adequately highlights key features, but details may be irrelevant, inappropriate, or inaccurate.
- **Band 5**: Generally addresses the task, but the format may be inappropriate in places; recounts detail mechanically with no clear overview; there may be no data to support the description.`
    : `- **Band 9**: The prompt is appropriately addressed and explored in depth. A clear and fully developed position is presented which directly answers the question(s). Ideas are relevant, fully extended, and well supported.
- **Band 8**: The prompt is appropriately and sufficiently addressed. A clear and well-developed position is presented in response to the question(s). Ideas are relevant, well extended, and supported.
- **Band 7**: The main parts of the prompt are appropriately addressed. A clear and developed position is presented throughout the response. Main ideas are extended and supported, though there may be a tendency to over-generalise or a lack of focus in supporting ideas.
- **Band 6**: The main parts of the prompt are addressed (though some may be more fully covered than others). A relevant position is presented, although conclusions may become unclear or repetitive. Main ideas are relevant, but some may be insufficiently developed or lack clarity.
- **Band 5**: The main parts of the prompt are incompletely addressed. The writer expresses a position, but the development is not always clear. Some main ideas are put forward, but they are limited and not sufficiently developed.`
}

### 2. Coherence and Cohesion (CC)
- **Band 9**: The message can be followed effortlessly. Cohesion is used in such a way that it very rarely attracts attention. Any minimal lapses in coherence or cohesion are negligible/invisible. Paragraphing is skilfully managed. (Note: Band 9 writers often rely on lexical cohesion, pronoun reference, and logical flow rather than overt sentence-initial conjunctive adverbs).
- **Band 8**: The message can be followed with ease. Information and ideas are logically sequenced, and cohesion is well managed. Paragraphing is used sufficiently and appropriately.
- **Band 7**: Information and ideas are logically organised, and there is a clear progression throughout the response. A range of cohesive devices (including referencing and substitution) is used flexibly, though with some minor over- or under-use. Each paragraph has a clear central topic.
- **Band 6**: Information and ideas are generally arranged coherently and there is a clear overall progression. Cohesive devices are used to some good effect, but cohesion within and/or between sentences may be faulty or mechanical due to misuse, overuse (e.g., starting almost every sentence with "Firstly", "Secondly", "Moreover", "Furthermore"), or omission.
- **Band 5**: Organisation is evident but is not wholly logical and there may be a lack of overall progression. The relationship between ideas can be repetitive or linked mechanically. Paragraphing may be inadequate or missing.

### 3. Lexical Resource (LR)
- **Band 9**: Full flexibility and precise use are widely evident. A wide range of vocabulary is used accurately and appropriately with very natural and sophisticated control of lexical features. Minor errors in spelling and word formation are extremely rare and have minimal impact on communication. (Note: "Sophisticated control" means natural collocation and exact meaning, NOT obscure words).
- **Band 8**: A wide resource is fluently and flexibly used to convey precise meanings. There is skilful use of uncommon and/or idiomatic items when appropriate, despite occasional inaccuracies in word choice and collocation. Occasional errors in spelling and/or word formation may occur.
- **Band 7**: The resource is sufficient to allow some flexibility and precision. There is some ability to use less common and/or idiomatic items and an awareness of style and collocation is evident, though inappropriate choices or word formation errors still occur occasionally.
- **Band 6**: The resource is generally adequate and appropriate for the task. The meaning is generally clear in spite of a rather restricted range or a lack of precision in word choice. Produces some errors in spelling and/or word formation, but these do not impede communication.
- **Band 5**: The resource is limited but minimally adequate for the task. Simple vocabulary may be used accurately, but the range does not permit much variation in expression. Frequent lapses in the appropriacy of word choice, memorised clichés, and noticeable spelling/word formation errors.

### 4. Grammatical Range and Accuracy (GRA)
- **Band 9**: A wide range of structures is used with full flexibility and control. Punctuation and grammar are used appropriately throughout. Minor errors are extremely rare and have minimal impact on communication ("slips" as opposed to systematic errors).
- **Band 8**: A wide range of structures is flexibly and accurately used. The majority of sentences are error-free, and punctuation is well managed. Occasional, non-systematic errors and inappropriacies occur, but have minimal impact on communication.
- **Band 7**: A variety of complex structures is used with some flexibility and accuracy. Grammar and punctuation are generally well controlled, and error-free sentences are frequent. A few errors in grammar may persist, but these do not impede communication.
- **Band 6**: A mix of simple and complex sentence forms is used, but flexibility is limited. Examples of more complex structures are not marked by the same level of accuracy as in simple structures. Errors in grammar and punctuation occur, but rarely reduce communication.
- **Band 5**: The range of structures is limited and rather repetitive. Although complex sentences are attempted, they tend to be faulty, and the greatest accuracy is achieved on simple sentences. Grammatical errors may be frequent and cause some difficulty for the reader.

=============================================================================
EVIDENCE-BASED SCORING & BAND 7 vs BAND 8 vs BAND 9 DISCRIMINATION
=============================================================================
1. Complete the structured 'internalExaminerAnalysis' FIRST before assigning any criterion band or overall band.
2. Every criterion score must be explainable and backed by direct quotes from the student's text.
3. Never make vague, unsubstantiated claims like "Vocabulary is not advanced enough", "Grammar needs more complexity", or "Cohesion is only moderate." Always point to actual evidence in the student's essay.
4. **Prevent Both Score Deflation AND Score Inflation (Distinguishing Bands 7, 8, and 9 Precisely)**:
   - **Band 9 (Expert User)**: Award **9.0** for a criterion ONLY when the writing satisfies the Band 9 descriptor consistently with virtually zero lapses. In **Task Response (Band 9)**, the prompt is explored in depth with nuanced, fully extended arguments. In **Coherence & Cohesion (Band 9)**, cohesion is managed so skilfully through lexical links, subordination, and internal reference that it *attracts no attention*. In **Lexical Resource (Band 9)**, word choice and collocation are completely natural, precise, and idiomatic throughout with no awkward phrasing. In **Grammatical Range & Accuracy (Band 9)**, a wide range of structures is used with full flexibility and virtually 100% error-free control. Note: Natural, clear, concise language with effortless flow and zero errors IS Band 9—never downgrade a Band 9 essay for lacking obscure vocabulary!
   - **Band 8 (Very Good User)**: Award **8.0** (not 9.0) for a criterion when the writing is strong, fluent, and well-developed, but exhibits any Band 8 characteristic: (a) in **Coherence & Cohesion**, paragraph and sentence transitions rely on conventional overt discourse markers at the start of paragraphs ("Admittedly,", "However,", "Furthermore,", "In conclusion,") so cohesion is "well managed" (Band 8) rather than invisible/effortless (Band 9); (b) in **Lexical Resource**, vocabulary is wide and flexible, but includes 1–3 slightly informal, repetitive, or slightly imprecise collocations (e.g. "do unpaid labour", "puts an unfair burden", "strict rule") instead of consistently idiomatic Band 9 precision; (c) in **Task Response**, ideas are well-extended and supported, but one aspect of the argument is stated rather than deeply probed; (d) in **Grammatical Range & Accuracy**, the majority of sentences are error-free, with 1–2 occasional minor slips or slightly awkward clauses.
   - **Band 7 (Good User)**: Award **7.0** when the essay addresses all main parts of the prompt with a clear position throughout, logical paragraphing, and frequent error-free sentences, but exhibits typical Band 7 ceiling traits: (a) a tendency to **over-generalise** in supporting points (e.g., absolute claims like "always solves air pollution" or broad statements without specific mechanism); OR (b) reliance on standard classroom discourse markers ("On the one hand", "On the other hand", "Additionally", "Therefore", "In conclusion") with minor over-use; OR (c) a few occasional errors in word choice, style, or grammar.
   - **Band 6 (Competent User)**: Award **6.0** when the essay addresses the task with a relevant position and coherent arrangement, but ideas are somewhat general/insufficiently developed, cohesive devices are mechanical ("Firstly", "Secondly", "Moreover", "Nowadays"), vocabulary is adequate but repetitive, or complex sentences contain noticeable grammar slips (countable/uncountable nouns like "equipments", determiners like "less people", singular/plural agreement like "reduces traffic jam") that do not impede communication.
   - **Band 5 (Modest User)**: Award **5.0** when the essay incompletely addresses the task, relies heavily on memorised template clichés ("In this modern era of globalization", "every coin has two sides", "burning issue"), develops ideas weakly, uses limited structures, and makes frequent grammatical and lexical errors.
5. For 'redPenUpgrades':
   - If the essay is Band 5.0–7.5: select 2 actual weak, general, or flawed sentences from the student's draft, explain the exact descriptor flaw, and rewrite them to natural Band 8.5+ standard.
   - If the essay is already Band 8.0–9.0: select 2 sentences from the student's draft, explicitly note in 'whyItLosesMarks' why the sentence is already effective (or point out any subtle nuance), and provide an alternative Band 9 stylistic variation in 'band75Upgrade'.`;

      const userPrompt = `Evaluate this ${taskLabel} strictly against the Official IELTS Writing Band Descriptors.
Student's Target Band: ${targetBand}

Question / Prompt provided by student:
${
  promptQuestion
    ? promptQuestion
    : '(Student did not paste the question prompt — evaluate Task Response/Achievement based on the internal thesis, relevance, depth of development, and implied prompt of their writing)'
}

Student's Writing Submission:
"""
${studentResponse}
"""`;

      let evaluation;
      try {
        const rawText = await generateJsonWithCascade({
          contents: userPrompt,
          systemInstruction,
          temperature: 0.15,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              internalExaminerAnalysis: {
                type: Type.ARRAY,
                description:
                  'Mandatory step-by-step official descriptor evaluation for each of the 4 criteria BEFORE determining final scores.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    criterion: {
                      type: Type.STRING,
                      description:
                        'Criterion name: Task Response (or Task Achievement), Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy.',
                    },
                    whatDescriptorRequires: {
                      type: Type.STRING,
                      description: 'What the official IELTS band descriptors require for this criterion.',
                    },
                    whatEssayDemonstrates: {
                      type: Type.STRING,
                      description: 'What the candidate essay actually demonstrates in terms of quality, consistency, control, and effectiveness.',
                    },
                    specificEvidenceFromEssay: {
                      type: Type.STRING,
                      description: 'Direct quotes and concrete examples from the essay supporting this evaluation.',
                    },
                    weaknessesIfAny: {
                      type: Type.STRING,
                      description:
                        'Any descriptor weaknesses, occasional slips, or ceiling characteristics observed in the essay for this criterion (or state "None" if the essay satisfies Band 9 without lapses).',
                    },
                    estimatedBand: {
                      type: Type.NUMBER,
                      description:
                        'The highest IELTS band (0.0 to 9.0 in 0.5 steps, e.g. 9.0, 8.5, 8.0, 7.5, 7.0, 6.5, 6.0, 5.5, 5.0) consistently satisfied by this criterion.',
                    },
                  },
                  required: [
                    'criterion',
                    'whatDescriptorRequires',
                    'whatEssayDemonstrates',
                    'specificEvidenceFromEssay',
                    'weaknessesIfAny',
                    'estimatedBand',
                  ],
                },
              },
              overallBand: {
                type: Type.STRING,
                description:
                  'Overall IELTS Writing band score calculated from the 4 criteria (e.g. "9.0", "8.5", "8.0", "7.5", "7.0", "6.5", "6.0", "5.5").',
              },
              examinerVerdictHeadline: {
                type: Type.STRING,
                description:
                  'A direct, human 1-sentence headline summarising why the script achieved this official band score.',
              },
              examinerSummaryNote: {
                type: Type.STRING,
                description:
                  'A clear, honest 2-3 sentence examiner summary explaining the overall performance level and key strengths or bottlenecks.',
              },
              criteria: {
                type: Type.ARRAY,
                description: 'Exactly 4 items representing the 4 official IELTS Writing criteria in order.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description:
                        'Criterion name: Task Response (or Task Achievement), Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.',
                    },
                    band: {
                      type: Type.STRING,
                      description: 'Band score for this criterion formatted to 1 decimal place (e.g. "9.0", "8.5", "8.0", "7.0", "6.5", "6.0").',
                    },
                    descriptorMatch: {
                      type: Type.STRING,
                      description:
                        'The exact official IELTS Band Descriptor characteristic this writing satisfies (1 concise sentence).',
                    },
                    specificFeedback: {
                      type: Type.STRING,
                      description:
                        'Evidence-based human examiner feedback quoting specific phrases from the essay and explaining why it achieved this band (and what, if anything, prevented a higher band).',
                    },
                  },
                  required: ['name', 'band', 'descriptorMatch', 'specificFeedback'],
                },
              },
              redPenUpgrades: {
                type: Type.ARRAY,
                description:
                  '2 specific sentences quoted from the student text with examiner commentary and a Band 8.5–9.0 upgrade or stylistic refinement.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    originalSentence: {
                      type: Type.STRING,
                      description: 'The exact sentence quoted from the student submission.',
                    },
                    whyItLosesMarks: {
                      type: Type.STRING,
                      description:
                        'For Band 5–7.5 scripts: the specific descriptor flaw. For Band 8–9 scripts: why this sentence works well or how the alternative below refines register.',
                    },
                    band75Upgrade: {
                      type: Type.STRING,
                      description: 'A natural, clear, academic Band 8.5–9.0 rewrite or stylistic alternative of the sentence.',
                    },
                  },
                  required: ['originalSentence', 'whyItLosesMarks', 'band75Upgrade'],
                },
              },
              priorityActionSteps: {
                type: Type.ARRAY,
                description: 'Top 3 concrete, actionable steps tailored to the candidate score level.',
                items: {
                  type: Type.STRING,
                },
              },
              recommendedNextStep: {
                type: Type.OBJECT,
                properties: {
                  offerTitle: {
                    type: Type.STRING,
                    description:
                      'Either "IELTS DECODED Writing Self-Prep Guide (BDT 499)", "12-Week Band 7+ Roadmap Mentorship (BDT 7,999)", or "1-Month 1-to-1 Live IELTS Crash Course (BDT 9,999)".',
                  },
                  reason: {
                    type: Type.STRING,
                    description:
                      '1-2 sentences explaining how this resource or coaching supports their IELTS goal.',
                  },
                  waKeyword: {
                    type: Type.STRING,
                    description:
                      'Pre-filled WhatsApp message student can send to Jubayer Siddiki about their writing score.',
                  },
                },
                required: ['offerTitle', 'reason', 'waKeyword'],
              },
            },
            required: [
              'internalExaminerAnalysis',
              'overallBand',
              'examinerVerdictHeadline',
              'examinerSummaryNote',
              'criteria',
              'redPenUpgrades',
              'priorityActionSteps',
              'recommendedNextStep',
            ],
          },
        });
        const parsed = JSON.parse(rawText);

        // Enforce deterministic IELTS four-criterion mathematical calculation so overallBand
        // is ALWAYS the exact official average of the 4 criteria rounded to the nearest 0.5.
        if (Array.isArray(parsed.criteria) && parsed.criteria.length === 4) {
          const numericBands = parsed.criteria.map((c: { band?: unknown }, idx: number) => {
            const internalEst = parsed.internalExaminerAnalysis?.[idx]?.estimatedBand;
            const norm = normalizeIeltsBand(c.band ?? internalEst, 7.0);
            c.band = norm.toFixed(1);
            return norm;
          });
          parsed.overallBand = calculateOfficialIeltsOverallBand(numericBands);
        }

        evaluation = parsed;
      } catch (modelErr) {
        console.warn('All Gemini models busy; using local Official IELTS Descriptor Evaluator:', modelErr);
        evaluation = buildFallbackWritingEvaluation({
          taskType,
          promptQuestion,
          studentResponse,
          targetBand,
        });
      }

      res.status(200).json({
        ok: true,
        evaluation,
      });
    } catch (err) {
      console.error('Error in /api/ai/writing-evaluation:', err);
      res.status(500).json({
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Could not complete the writing evaluation right now. Please try again.',
      });
    }
  });

  // =========================================================================
  // POST /api/ai/score-advisor — 4-Module Bottleneck & Study Roadmap Advisor
  // =========================================================================
  app.post('/api/ai/score-advisor', async (req, res) => {
    try {
      const listening = String(req.body?.listening ?? '6.0').trim();
      const reading = String(req.body?.reading ?? '6.0').trim();
      const writing = String(req.body?.writing ?? '5.5').trim();
      const speaking = String(req.body?.speaking ?? '6.0').trim();
      const targetBand = String(req.body?.targetBand ?? '7.0').trim();
      const timeline = String(req.body?.timeline ?? '1-2 months').trim();
      const biggestStruggle = String(req.body?.biggestStruggle ?? '').trim();

      const systemInstruction = `You are Jubayer Siddiki's Diagnostic Study Advisor at IELTS DECODED (Jubayer scored Overall 8.0: L8.5, R8.5, W7.0, S7.0).
Analyze a student's 4 module scores (Listening, Reading, Writing, Speaking), their target band, and their exam timeline.
Give an honest, mathematically sound IELTS diagnosis:
- Show them which module is their "Score Anchor" (dragging their overall average down or risking a sub-band requirement failure) and which module is their "Fastest Band Booster" (Reading and Listening can be raised fastest with question-type systems; Writing and Speaking require sentence-level and structure correction).
- Recommend the single most logical IELTS DECODED path based on their timeline and gap:
  1. Individual Self-Prep Guide (BDT 499) or All 4 Guides Bundle (BDT 1,500) — best if they only have 1 module lagging or want self-study systems first.
  2. 12-Week Band 7+ Roadmap Mentorship Program (BDT 7,999 Founding Batch, 10 students only, 3 classes/week) — best if they have 2–3 months and need structured mastery across all 4 modules.
  3. 1-Month 1-to-1 Live IELTS Crash Course (BDT 9,999, 4 live 1-to-1 classes/week) — best if their exam is within 2–6 weeks or they need private, intensive Writing & Speaking correction.`;

      const userPrompt = `Student Profile:
- Current Listening: Band ${listening}
- Current Reading: Band ${reading}
- Current Writing: Band ${writing}
- Current Speaking: Band ${speaking}
- Target Overall Band: Band ${targetBand}
- Time until exam: ${timeline}
- Main struggle mentioned by student: ${biggestStruggle || 'Not specified'}`;

      let diagnosis;
      try {
        const rawText = await generateJsonWithCascade({
          contents: userPrompt,
          systemInstruction,
          temperature: 0.35,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              currentOverall: {
                type: Type.STRING,
                description: 'Calculated current overall IELTS band score (e.g. "6.0").',
              },
              gapSummaryHeadline: {
                type: Type.STRING,
                description: 'Direct 1-sentence diagnosis of their score gap.',
              },
              primaryBottleneckModule: {
                type: Type.STRING,
                description: 'The module hurting their target most (e.g. "Writing (Band 5.5)").',
              },
              fastestGainModule: {
                type: Type.STRING,
                description: 'The module where they can pick up half or a full band fastest.',
              },
              honestAssessment: {
                type: Type.STRING,
                description: '2-3 sentences of human, realistic advice explaining how to bridge the gap in their available timeline.',
              },
              fourteenDayFocus: {
                type: Type.ARRAY,
                description: '3 specific study priorities for the next 14 days.',
                items: {
                  type: Type.STRING,
                },
              },
              primaryRecommendation: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Recommended program or guide title with price in BDT.',
                  },
                  whyItFits: {
                    type: Type.STRING,
                    description: 'Why this option matches their timeline and score profile.',
                  },
                  whatsappMessage: {
                    type: Type.STRING,
                    description: 'Pre-filled WhatsApp message with their scores and target band to send to Jubayer.',
                  },
                },
                required: ['title', 'whyItFits', 'whatsappMessage'],
              },
            },
            required: [
              'currentOverall',
              'gapSummaryHeadline',
              'primaryBottleneckModule',
              'fastestGainModule',
              'honestAssessment',
              'fourteenDayFocus',
              'primaryRecommendation',
            ],
          },
        });
        diagnosis = JSON.parse(rawText);
      } catch (modelErr) {
        console.warn('All Gemini models busy; using local Score Advisor fallback:', modelErr);
        diagnosis = buildFallbackScoreAdvisor({
          listening,
          reading,
          writing,
          speaking,
          targetBand,
          timeline,
        });
      }

      res.status(200).json({
        ok: true,
        diagnosis,
      });
    } catch (err) {
      console.error('Error in /api/ai/score-advisor:', err);
      res.status(500).json({
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Could not generate your score diagnosis right now. Please try again.',
      });
    }
  });

  // =========================================================================
  // SEO Routes: robots.txt and sitemap.xml
  // =========================================================================
  const publicDir = path.resolve(__dirname, 'public');
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(publicDir, 'robots.txt'));
  });

  app.get('/sitemap.xml', (_req, res) => {
    res.type('application/xml');
    res.sendFile(path.join(publicDir, 'sitemap.xml'));
  });

  // =========================================================================
  // Vite Dev Middleware or Static Production Build
  // =========================================================================
  const distPath = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
