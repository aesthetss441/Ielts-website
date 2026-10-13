import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SEO_ROUTES,
  buildStructuredDataGraph,
  resolveSeoRouteFromPathname,
} from './src/seoRegistry.ts';

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
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalizes a band score string/number to a valid IELTS 0.5 increment between 1.0 and 9.0.
 */
function normalizeIeltsBand(raw: unknown, fallback = 6.0): number {
  const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(/[^0-9.]/g, ''));
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 9) {
    return fallback;
  }
  return Math.round(parsed * 2) / 2;
}

/**
 * Normalizes an individual criterion score (TA/TR, CC, LR, GRA) to a whole-number
 * IELTS band level (1 to 9), matching the official May 2023 IELTS Writing Band Descriptors
 * which define criterion descriptors exclusively at whole-number band intervals.
 */
function normalizeIeltsCriterionBand(raw: unknown, fallback = 6): number {
  const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(/[^0-9.]/g, ''));
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 9) {
    return fallback;
  }
  return Math.min(9, Math.max(1, Math.round(parsed)));
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
    return '6.0';
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
            temperature: options.temperature ?? 0.1,
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
 * Official May 2023 IELTS Band Descriptor fallback analyzer used ONLY if every
 * Gemini model in the cascade is simultaneously unreachable.
 * Uses whole-number criterion bands (1–9), equal weighting across the 4 criteria,
 * and avoids automatic word-blacklist caps or baseline score inflation.
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
    .filter((s) => s.length > 5);

  const sentenceCount = Math.max(1, sentences.length);
  const avgWordsPerSentence = wordCount / sentenceCount;

  // Check whether sentence-initial discourse markers are overused mechanically across many sentences
  const sentenceInitialMarkers =
    studentResponse.match(
      /(?:^|[.!?]\s+)(firstly|secondly|thirdly|lastly|moreover|furthermore|in addition|additionally|consequently|therefore|however|nevertheless|on the one hand|on the other hand|in conclusion|to sum up)\b/gi
    ) || [];
  const markerDensity = sentenceInitialMarkers.length / sentenceCount;

  // Check for internal referencing & substitution (pronoun/demonstrative cohesion)
  const referencingMatches =
    studentResponse.match(
      /\b(this|these|those|such|the former|the latter|doing so|as a result of this|in doing so|which in turn)\b/gi
    ) || [];

  // Check for genuine grammatical & syntactic errors
  const grammarErrorPatterns = [
    /\bevery (?:person|people|student|citizen|child|country) (?:are|have|were)\b/gi,
    /\bevery (?:person|student|child) life\b/gi,
    /\bless (?:people|students|cars|workers|citizens|problems|opportunities|countries)\b/gi,
    /\bmore (?:better|faster|easier|worse|higher)\b/gi,
    /\binformations\b|\badvices\b|\bequipments\b|\bresearches\b|\bknowledges\b|\btraffics\b|\bluggages\b|\bfurnitures\b/gi,
    /\bdepend to\b|\bdiscuss about\b|\bcomprise of\b|\bdespite of\b|\bmarried with\b/gi,
    /\bpeoples\b|\bchildrens\b|\bwomans\b|\bmans\b/gi,
    /\bcan able to\b|\bwill can\b|\bmust to\b|\bshould to\b|\bcould able to\b/gi,
    /\banother (?:people|countries|things|reasons|benefits|factors)\b/gi,
    /\bthere is many\b|\bthere are much\b|\bthere have many\b|\bthere has many\b/gi,
    /\bi am agree\b|\bit is depend\b|\bpeople is\b|\bchildren is\b/gi,
  ];
  let detectedGrammarErrors = 0;
  const matchedGrammarSamples: string[] = [];
  for (const pat of grammarErrorPatterns) {
    const m = studentResponse.match(pat);
    if (m) {
      detectedGrammarErrors += m.length;
      matchedGrammarSamples.push(...m.slice(0, 2));
    }
  }

  // Check for varied complex structures (subordination, relative clauses, conditionals, participial/concessive clauses)
  const complexGrammarMatches =
    studentResponse.match(
      /\b(although|even though|whereas|while|whilst|despite|in spite of|provided that|unless|whether|which|whose|whereby|not only|nevertheless|nonetheless|given that|so that)\b/gi
    ) || [];

  // Lexical variety & word length distribution
  const cleanTokens = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, '')).filter((w) => w.length > 2);
  const uniqueTokens = new Set(cleanTokens);
  const lexicalDiversity = cleanTokens.length > 0 ? uniqueTokens.size / cleanTokens.length : 0.5;
  const academicLengthWords = cleanTokens.filter((w) => w.length >= 7);
  const academicWordRatio = cleanTokens.length > 0 ? academicLengthWords.length / cleanTokens.length : 0;

  const hasOverview =
    /\b(overall|in general|generally speaking|main trend|most noticeable|it is clear that|broadly|as an overview|to summarise)\b/i.test(
      studentResponse
    );
  const hasDataFigures = /\b(\d+(\.\d+)?%?|percent|percentage|proportion|quarter|half|third|double|triple|million|thousand)\b/i.test(
    studentResponse
  );

  const firstCriterionName =
    taskType === 'task1_report' ? 'Task Achievement' : 'Task Response';

  const expectedMinWords =
    taskType === 'task2_intro' ? 35 : taskType === 'task1_report' ? 150 : 250;

  // 1. Task Achievement / Task Response (Whole-number anchor: start at Band 6)
  let trScore = 6;
  if (wordCount < expectedMinWords * 0.6) {
    trScore = 4;
  } else if (wordCount < expectedMinWords * 0.85) {
    trScore = 5;
  } else if (taskType === 'task1_report') {
    if (!hasOverview || !hasDataFigures) {
      trScore = 5;
    } else if (wordCount >= 165 && paragraphs.length >= 3 && hasOverview && hasDataFigures) {
      trScore = 7;
    }
  } else if (taskType === 'task2_intro') {
    if (wordCount >= 40 && sentences.length >= 2) {
      trScore = 7;
    }
  } else {
    // Task 2 Full Essay
    if (wordCount >= 260 && paragraphs.length >= 4 && avgWordsPerSentence >= 15) {
      trScore = 7;
      if (wordCount >= 290 && lexicalDiversity >= 0.52 && academicWordRatio >= 0.28 && detectedGrammarErrors === 0) {
        trScore = 8;
      }
    } else if (paragraphs.length < 3) {
      trScore = 5;
    }
  }

  // 2. Coherence and Cohesion (Whole-number anchor: start at Band 6)
  let ccScore = 6;
  if (paragraphs.length <= 1 && taskType !== 'task2_intro') {
    ccScore = 4;
  } else if (paragraphs.length === 2 && taskType === 'task2_essay') {
    ccScore = 5;
  } else if (markerDensity > 0.55) {
    // Over-reliance on mechanical sentence-initial linkers across most sentences
    ccScore = 6;
  } else if (
    paragraphs.length >= (taskType === 'task2_intro' ? 1 : 3) &&
    referencingMatches.length >= (taskType === 'task2_intro' ? 1 : 3) &&
    markerDensity <= 0.4
  ) {
    ccScore = 7;
    if (
      paragraphs.length >= (taskType === 'task2_intro' ? 1 : 4) &&
      referencingMatches.length >= 4 &&
      markerDensity <= 0.25 &&
      detectedGrammarErrors === 0
    ) {
      ccScore = 8;
    }
  }

  // 3. Lexical Resource (Whole-number anchor: start at Band 6)
  let lrScore = 6;
  if (wordCount < expectedMinWords * 0.65 || lexicalDiversity < 0.38) {
    lrScore = 5;
  } else if (lexicalDiversity >= 0.48 && academicWordRatio >= 0.24) {
    lrScore = 7;
    if (lexicalDiversity >= 0.54 && academicWordRatio >= 0.29 && detectedGrammarErrors === 0) {
      lrScore = 8;
    }
  }

  // 4. Grammatical Range and Accuracy (Whole-number anchor: start at Band 6)
  let graScore = 6;
  if (detectedGrammarErrors >= 4 || complexGrammarMatches.length <= 1) {
    graScore = 5;
  } else if (detectedGrammarErrors >= 1) {
    graScore = 6;
  } else if (detectedGrammarErrors === 0 && complexGrammarMatches.length >= (taskType === 'task2_intro' ? 1 : 4)) {
    graScore = 7;
    if (complexGrammarMatches.length >= (taskType === 'task2_intro' ? 2 : 7) && avgWordsPerSentence >= 16) {
      graScore = 8;
    }
  }

  trScore = normalizeIeltsCriterionBand(trScore, 6);
  ccScore = normalizeIeltsCriterionBand(ccScore, 6);
  lrScore = normalizeIeltsCriterionBand(lrScore, 6);
  graScore = normalizeIeltsCriterionBand(graScore, 6);

  const overallBand = calculateOfficialIeltsOverallBand([trScore, ccScore, lrScore, graScore]);
  const overallNumeric = parseFloat(overallBand);

  const firstSentence = sentences[0] || studentResponse.slice(0, 120).trim();
  const secondSentence = sentences[1] || sentences[sentences.length - 1] || firstSentence;
  const isHighBand = overallNumeric >= 8.0;

  return {
    internalExaminerAnalysis: [
      {
        criterion: firstCriterionName,
        supportingEvidenceForAwardedBand: `Word count is ${wordCount} words across ${paragraphs.length} paragraph(s). Opening statement: "${firstSentence.slice(0, 90)}..."`,
        evidenceContradictingHigherBand:
          trScore >= 8
            ? 'Ideas are well extended and supported, though deeper nuance is needed for Band 9.'
            : taskType === 'task1_report' && !hasOverview
            ? 'No explicit overview of main trends/differences was detected, which restricts Task Achievement.'
            : 'Supporting points require fuller extension and more specific illustration to satisfy the next higher band descriptor.',
        adjacentBandComparison: `Compared Band ${trScore} vs Band ${Math.min(9, trScore + 1)}: satisfies Band ${trScore} task coverage, whereas Band ${Math.min(9, trScore + 1)} requires more thoroughly developed and precise support.`,
        estimatedBand: trScore,
      },
      {
        criterion: 'Coherence and Cohesion',
        supportingEvidenceForAwardedBand: `Organised into ${paragraphs.length} paragraph(s) with ${referencingMatches.length} internal reference/substitution ties and ${sentenceInitialMarkers.length} overt discourse markers.`,
        evidenceContradictingHigherBand:
          markerDensity > 0.4
            ? `High density of sentence-initial transitions (${sentenceInitialMarkers.slice(0, 3).join(', ')}) creates somewhat mechanical linkage.`
            : 'Cohesion is clear, though transitions between clauses could be more seamless to reach the next band.',
        adjacentBandComparison: `Compared Band ${ccScore} vs Band ${Math.min(9, ccScore + 1)}: progression matches Band ${ccScore}, while Band ${Math.min(9, ccScore + 1)} requires more flexible and unobtrusive cohesion.`,
        estimatedBand: ccScore,
      },
      {
        criterion: 'Lexical Resource',
        supportingEvidenceForAwardedBand: `Lexical diversity ratio is ${lexicalDiversity.toFixed(2)} with ${(academicWordRatio * 100).toFixed(0)}% extended academic vocabulary items.`,
        evidenceContradictingHigherBand:
          lrScore >= 8
            ? 'Vocabulary is wide and accurate, though slightly below effortless Band 9 idiomatic precision.'
            : 'Range and collocation precision are adequate for communication but show occasional repetition or general phrasing.',
        adjacentBandComparison: `Compared Band ${lrScore} vs Band ${Math.min(9, lrScore + 1)}: vocabulary satisfies Band ${lrScore}, whereas Band ${Math.min(9, lrScore + 1)} requires wider flexibility and more consistent collocation control.`,
        estimatedBand: lrScore,
      },
      {
        criterion: 'Grammatical Range and Accuracy',
        supportingEvidenceForAwardedBand: `Contains ${complexGrammarMatches.length} subordinate/complex clause markers across ${sentenceCount} sentences.`,
        evidenceContradictingHigherBand:
          matchedGrammarSamples.length > 0
            ? `Detected grammatical inaccuracies (${matchedGrammarSamples.join('; ')}) which reduce the proportion of error-free sentences.`
            : 'Sentence structures are controlled, though wider syntactic variety is needed for the next higher band.',
        adjacentBandComparison: `Compared Band ${graScore} vs Band ${Math.min(9, graScore + 1)}: fits Band ${graScore} based on complex sentence variety and error-free sentence ratio.`,
        estimatedBand: graScore,
      },
    ],
    overallBand,
    examinerVerdictHeadline: isHighBand
      ? `Your response demonstrates Band ${overallBand} control across the official IELTS descriptors—clear task fulfilment, logical progression, and accurate syntax.`
      : `Your draft aligns with Band ${overallBand} on the official May 2023 IELTS rubric, with primary bottlenecks in ${
          graScore <= lrScore ? 'grammatical accuracy' : 'lexical precision'
        } and idea extension.`,
    examinerSummaryNote: isHighBand
      ? `This script satisfies the Band ${overallBand} descriptors: your position is coherent and well developed, and the majority of your sentences are error-free.`
      : `You address the prompt topic and organise your response into readable paragraphs. To move from Band ${overallBand} to Band ${targetBand}, focus on extending your supporting arguments with specific evidence, using natural referencing for cohesion, and increasing your proportion of error-free complex sentences.`,
    criteria: [
      {
        name: firstCriterionName,
        band: trScore.toFixed(1),
        descriptorMatch:
          trScore >= 8
            ? 'Prompt is appropriately and sufficiently addressed; a clear and well-developed position is presented with relevant, well-extended support.'
            : trScore === 7
            ? 'Main parts of the prompt are appropriately addressed; presents a clear and developed position throughout the response.'
            : trScore === 6
            ? 'Main parts of the prompt are addressed with a relevant position, though some ideas are insufficiently developed.'
            : 'Main parts of the prompt are incompletely addressed or detail is recounted mechanically without a clear overview.',
        specificFeedback:
          trScore >= 8
            ? `Your opening ("${firstSentence.slice(0, 80)}...") frames the task clearly, and your main ideas are well extended and supported.`
            : `Your opening ("${firstSentence.slice(0, 80)}...") addresses the topic, but reaching Band ${Math.min(9, trScore + 1)}.0 requires fuller extension and more specific support for your main claims.`,
      },
      {
        name: 'Coherence & Cohesion',
        band: ccScore.toFixed(1),
        descriptorMatch:
          ccScore >= 8
            ? 'The message can be followed with ease; information and ideas are logically sequenced, and cohesion is well managed.'
            : ccScore === 7
            ? 'Information and ideas are logically organised with clear progression throughout; a range of cohesive devices is used flexibly.'
            : ccScore === 6
            ? 'Information and ideas are generally arranged coherently with clear overall progression, though some cohesion may be mechanical.'
            : 'Organisation is evident but not wholly logical, or paragraphing and linking are limited.',
        specificFeedback:
          ccScore >= 8
            ? 'Your ideas progress logically from sentence to sentence using well-managed referencing and paragraphing.'
            : markerDensity > 0.4
            ? `Several sentences rely on overt sentence-initial connectors (${sentenceInitialMarkers
                .slice(0, 3)
                .join(', ')}). Combine these with internal pronoun/demonstrative referencing ("This trend...", "Such measures...") for more flexible Band 7+ cohesion.`
            : 'Your overall progression is clear; strengthening internal referencing and ensuring each paragraph develops a single unified topic will raise this criterion.',
      },
      {
        name: 'Lexical Resource',
        band: lrScore.toFixed(1),
        descriptorMatch:
          lrScore >= 8
            ? 'A wide resource is fluently and flexibly used to convey precise meanings, with skilful use of less common items.'
            : lrScore === 7
            ? 'The resource is sufficient to allow some flexibility and precision, with awareness of style and collocation.'
            : lrScore === 6
            ? 'The resource is generally adequate and appropriate for the task, despite some restricted range or lack of precision.'
            : 'The resource is limited and minimally adequate for the task, with frequent lapses in word choice or spelling.',
        specificFeedback:
          lrScore >= 8
            ? 'Your vocabulary is wide, accurate, and appropriate to the academic register.'
            : 'Your meaning is clear, but moving to the next whole band requires more precise topic-specific collocations and fewer repetitive general words.',
      },
      {
        name: 'Grammatical Range & Accuracy',
        band: graScore.toFixed(1),
        descriptorMatch:
          graScore >= 8
            ? 'A wide range of structures is flexibly and accurately used, and the majority of sentences are error-free.'
            : graScore === 7
            ? 'A variety of complex structures is used with some flexibility and accuracy; error-free sentences are frequent.'
            : graScore === 6
            ? 'A mix of simple and complex sentence forms is used, though complex structures are less accurate than simple structures.'
            : 'The range of structures is limited and repetitive, and complex sentences tend to be faulty.',
        specificFeedback:
          graScore >= 8
            ? 'Your syntactic control is strong, balancing multi-clause sentences and punctuation accurately.'
            : matchedGrammarSamples.length > 0
            ? `You attempt complex structures, but grammatical slips (such as "${matchedGrammarSamples.join('", "')}") prevent a higher band. Increasing your ratio of error-free sentences is essential for Band 7+.`
            : 'You use a mix of simple and complex structures; improving accuracy in subordinate clauses will help make error-free sentences more frequent.',
      },
    ],
    redPenUpgrades: [
      {
        originalSentence: firstSentence,
        whyItLosesMarks: isHighBand
          ? 'Already effective and grammatically accurate. Shown below is an alternative Band 9 stylistic variation:'
          : 'Can be tightened for stronger academic precision and clearer clause structure.',
        band75Upgrade: firstSentence,
      },
      {
        originalSentence: secondSentence,
        whyItLosesMarks: isHighBand
          ? 'Already well-controlled in your script. Here is an alternative Band 9 syntactic phrasing:'
          : 'Upgrading clause linkage and lexical precision strengthens both LR and GRA.',
        band75Upgrade: secondSentence,
      },
    ],
    priorityActionSteps: isHighBand
      ? [
          'Maintain this balance of clear argument extension and natural collocation under timed exam conditions.',
          'Ensure every body paragraph probes the underlying cause and consequence of your main claims.',
          'Reserve 2 minutes at the end of the test to check for any minor slips in spelling or punctuation.',
        ]
      : [
          'Extend every main claim with a concrete explanation and specific evidence rather than leaving statements general.',
          'Balance overt linking adverbs with internal pronoun and demonstrative referencing ("This policy...", "Such measures...").',
          'Review subject-verb agreement, countable/uncountable nouns, and article usage to increase your proportion of error-free sentences.',
        ],
    recommendedNextStep: {
      offerTitle: 'IELTS DECODED Writing Self-Prep Guide (BDT 499)',
      reason: isHighBand
        ? `Your writing is currently at Band ${overallBand}. To ensure your other modules (Reading, Listening, Speaking) match this standard on test day, review our complete module frameworks.`
        : `Since your draft is currently at Band ${overallBand}, applying the Task 1 & Task 2 paragraph frameworks and sentence upgrades will help you reach Band ${targetBand}.`,
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
 * Strict Bangladeshi WhatsApp Phone Number Validator & Normalizer (Method 1).
 * Restricts input strictly to authentic Bangladeshi mobile numbers (013–019).
 * Permanently rejects non-BD entries (e.g. 9876543211) and fake/dummy patterns
 * (e.g. +8801700000000, 01712345678, sequential runs, repeating digits, low-entropy numbers).
 */
const BD_OPERATOR_PREFIXES = new Set(['013', '014', '015', '016', '017', '018', '019']);
const DUMMY_SEQUENCES_SET = new Set([
  '01234567',
  '12345678',
  '23456789',
  '34567890',
  '98765432',
  '87654321',
  '76543210',
  '65432109',
  '11223344',
  '22334455',
  '00112233',
  '12121212',
  '21212121',
  '01010101',
  '10101010',
  '12341234',
  '00001111',
  '11110000',
  '11112222',
  '22221111',
]);

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

  let digitsOnly = trimmed.replace(/\D/g, '');

  // Strip international prefix '88' if user typed 8801...
  if (digitsOnly.startsWith('8801')) {
    digitsOnly = digitsOnly.slice(2);
  } else if (digitsOnly.startsWith('88') && digitsOnly.length >= 12) {
    digitsOnly = digitsOnly.slice(2);
  }

  // If user entered 1XXXXXXXXX (10 digits, omitted leading 0)
  if (digitsOnly.length === 10 && /^[3-9]/.test(digitsOnly)) {
    digitsOnly = '0' + digitsOnly;
  } else if (digitsOnly.length === 10 && digitsOnly.startsWith('1')) {
    digitsOnly = '0' + digitsOnly;
  }

  // Reject non-Bangladeshi numbers immediately
  if (!digitsOnly.startsWith('01')) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error:
        'Only Bangladeshi WhatsApp numbers are accepted. Please enter an 11-digit number starting with 013–019 (e.g. 017XXXXXXXX).',
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
      error: `Invalid operator prefix "${prefix}". Valid Bangladeshi operators are 013, 014, 015, 016, 017, 018, or 019.`,
    };
  }

  const subscriber = digitsOnly.slice(3);

  // 1. All identical digits in subscriber part (catches e.g. +8801700000000, 01811111111)
  if (/^(\d)\1{7}$/.test(subscriber)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Dummy or repeated number detected. Please enter your real active WhatsApp number.',
    };
  }

  // 2. Six or more consecutive identical digits
  if (/(\d)\1{5,}/.test(subscriber)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Invalid number (too many repeated digits). Please enter your real WhatsApp number.',
    };
  }

  // 3. Known sequential dummy runs (e.g. 12345678, 87654321)
  if (DUMMY_SEQUENCES_SET.has(subscriber)) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Sequential dummy number detected. Please enter your real active WhatsApp number.',
    };
  }

  // 4. Low entropy check: subscriber must have at least 3 distinct unique digits
  const uniqueSubscriberDigits = new Set(subscriber.split('')).size;
  if (uniqueSubscriberDigits < 3) {
    return {
      valid: false,
      normalized: '',
      display: '',
      error: 'Please enter a genuine, active WhatsApp number (dummy numbers not accepted).',
    };
  }

  // 5. Total number entropy check: entire number must have at least 4 unique digits
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
    guide?: string;
    targetBand?: string;
    currentBand?: string;
    weakestSkill?: string;
    examDate?: string;
    email?: string;
    src?: string;
    door?: string;
    sheetTab?: string;
    trxId?: string;
    product?: string;
    beforeBand?: string;
    afterBand?: string;
    quote?: string;
    consent?: boolean;
    taskType?: string;
    essayPrompt?: string;
    essayResponse?: string;
    wordCount?: number;
    paymentMethod?: string;
    availability?: string;
    notes?: string;
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
    guide: lead.guide || 'IELTS Band 7+ Score Rescue',
    targetBand: lead.targetBand || '',
    currentBand: lead.currentBand || '',
    weakestSkill: lead.weakestSkill || '',
    examDate: lead.examDate || '',
    email: lead.email || '',
    src: lead.src || 'direct',
    door: lead.door || lead.source,
    sheetTab: lead.sheetTab || 'leads',
    tab: lead.sheetTab || 'leads',
    trxId: lead.trxId || '',
    product: lead.product || '',
    beforeBand: lead.beforeBand || '',
    afterBand: lead.afterBand || '',
    quote: lead.quote || '',
    consent: lead.consent ?? true,
    taskType: lead.taskType || '',
    essayPrompt: lead.essayPrompt || '',
    essayResponse: lead.essayResponse || '',
    wordCount: lead.wordCount || 0,
    paymentMethod: lead.paymentMethod || '',
    availability: lead.availability || '',
    notes: lead.notes || '',
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
  // POST /api/leads — Validate and send lead/submission to GOOGLE_SHEETS_WEBHOOK_URL
  // Supports sheetTab: 'leads' | 'results_submissions' | 'payments' | 'batch_applications' | 'waitlist'
  // =========================================================================
  app.post('/api/leads', async (req, res) => {
    try {
      const rawName = String(req.body?.fullName ?? req.body?.name ?? '').trim();
      const rawWhatsapp = String(req.body?.whatsappNumber ?? req.body?.whatsapp ?? '').trim();
      const source = String(req.body?.source ?? 'Free Rescue Guide Modal').trim();
      const guide = String(req.body?.guide ?? 'IELTS Band 7+ Score Rescue').trim();
      const targetBand = String(req.body?.targetBand ?? '').trim();
      const currentBand = String(req.body?.currentBand ?? '').trim();
      const weakestSkill = String(req.body?.weakestSkill ?? '').trim();
      const examDate = String(req.body?.examDate ?? '').trim();
      const email = String(req.body?.email ?? '').trim();
      const src = String(req.body?.src ?? 'direct').trim();
      const door = String(req.body?.door ?? source).trim();
      const sheetTab = String(req.body?.sheetTab ?? 'leads').trim();
      const trxId = String(req.body?.trxId ?? '').trim();
      const product = String(req.body?.product ?? '').trim();
      const beforeBand = String(req.body?.beforeBand ?? '').trim();
      const afterBand = String(req.body?.afterBand ?? '').trim();
      const quote = String(req.body?.quote ?? '').trim();
      const consent = req.body?.consent !== false;
      const taskType = String(req.body?.taskType ?? '').trim();
      const essayPrompt = String(req.body?.essayPrompt ?? '').trim();
      const essayResponse = String(req.body?.essayResponse ?? '').trim();
      const wordCount = Number(req.body?.wordCount) || 0;
      const paymentMethod = String(req.body?.paymentMethod ?? '').trim();
      const availability = String(req.body?.availability ?? '').trim();
      const notes = String(req.body?.notes ?? '').trim();

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
      const dedupeKey = `${sheetTab}:${phoneCheck.normalized}:${guide}:${trxId}`;

      // Prevent duplicate Google Sheet rows if the exact same submission was already recorded
      if (sheetTab === 'leads' && submittedNumbers.has(dedupeKey)) {
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

      submittedNumbers.add(dedupeKey);

      if (webhookUrl) {
        // Send to GOOGLE_SHEETS_WEBHOOK_URL in background so user receives instant zero-delay response
        sendLeadToGoogleSheetsWebhook(webhookUrl, {
          fullName: rawName,
          whatsappNumber: phoneCheck.display,
          normalizedWhatsapp: phoneCheck.normalized,
          submittedAt,
          isoTimestamp,
          source,
          guide,
          targetBand,
          currentBand,
          weakestSkill,
          examDate,
          email,
          src,
          door,
          sheetTab,
          trxId,
          product,
          beforeBand,
          afterBand,
          quote,
          consent,
          taskType,
          essayPrompt,
          essayResponse,
          wordCount,
          paymentMethod,
          availability,
          notes,
        }).catch((webhookErr) => {
          console.error('Background Google Sheets webhook submission error:', webhookErr);
        });
      }

      res.status(200).json({
        ok: true,
        duplicate: false,
        downloadUrl: '/api/rescue-guide/download',
        lead: {
          fullName: rawName,
          whatsappNumber: phoneCheck.display,
          submittedAt,
          targetBand,
          weakestSkill,
        },
      });
    } catch (err) {
      console.error('Error sending lead to GOOGLE_SHEETS_WEBHOOK_URL:', err);
      res.status(502).json({
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Could not save your details right now. Please try again.',
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
      const rawName = String(req.body?.fullName ?? req.body?.name ?? '').trim();
      const rawWhatsapp = String(req.body?.whatsappNumber ?? req.body?.whatsapp ?? '').trim();
      const taskType = String(req.body?.taskType ?? 'task2_essay').trim();
      const promptQuestion = String(req.body?.promptQuestion ?? '').trim();
      const studentResponse = String(req.body?.studentResponse ?? '').trim();
      const targetBand = String(req.body?.targetBand ?? '7.0').trim();

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
          error: phoneCheck.error || 'Please enter a valid WhatsApp number (e.g. 017XXXXXXXX).',
        });
        return;
      }

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

      // Save student details in the same Google Sheet as the PDF download
      const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
      if (webhookUrl) {
        const now = new Date();
        const submittedAt = formatDhakaTimestamp(now);
        const isoTimestamp = now.toISOString();

        // Send lead to Google Sheets asynchronously in background without delaying AI evaluation
        sendLeadToGoogleSheetsWebhook(webhookUrl, {
          fullName: rawName,
          whatsappNumber: phoneCheck.display,
          normalizedWhatsapp: phoneCheck.normalized,
          submittedAt,
          isoTimestamp,
          source: `Writing Checker (${taskType === 'task2_intro' ? 'Task 2 Intro' : taskType === 'task1_report' ? 'Task 1' : 'Task 2 Essay'})`,
          guide: `Writing Evaluation (${targetBand} Target)`,
        }).catch((sheetErr) => {
          console.error('Error logging writing evaluation lead to Google Sheet:', sheetErr);
        });
      }

      const firstCriterionName =
        taskType === 'task1_report' ? 'Task Achievement' : 'Task Response';

      const systemInstruction = `You are a Principal Official IELTS Writing Examiner and Assessment Specialist at IELTS DECODED.
Your sole responsibility is to evaluate a candidate's ${taskLabel} with strict, objective fidelity to the **Official IELTS Writing Band Descriptors (Updated May 2023)**.

=============================================================================
1. CORE CALIBRATION & WHOLE-NUMBER BAND ANCHORING (MANDATORY)
=============================================================================
Assess the four official IELTS Writing criteria **independently and equally (25% each)**:
1. **${firstCriterionName}** (${
        taskType === 'task1_report'
          ? 'Task Achievement for Writing Task 1'
          : 'Task Response for Writing Task 2'
      })
2. **Coherence and Cohesion**
3. **Lexical Resource**
4. **Grammatical Range and Accuracy**

- **Use Whole-Number Band Anchors Only (1 to 9)**: The official published IELTS Writing Band Descriptors define performance exclusively at **whole-number band levels** (Bands 1, 2, 3, 4, 5, 6, 7, 8, 9). Do NOT invent half-band scores (such as 5.5, 6.5, 7.5, or 8.5) for individual criteria. Each criterion MUST be assigned a whole-number integer band (e.g., 4, 5, 6, 7, 8, or 9). Half-bands occur ONLY when the four whole-number criterion bands are averaged into the overall score.
- **Official May 2023 Best-Fit & Limiting Feature Calibration (No Over-Scoring, No Artificial Deflation)**:
  - Match each criterion to the whole-number band descriptor that **best describes the overall performance** across the response.
  - Within the May 2023 official descriptors, **bolded negative descriptors** indicate limiting weaknesses that keep a criterion at that band if those weaknesses are characteristic of the script. However, **do NOT treat Band 6, Band 7, or Band 8 as requiring zero errors**:
    - **Band 8 explicitly allows** *"occasional omissions or lapses in content"*, *"occasional lapses in coherence and cohesion"*, *"occasional inaccuracies in word choice and collocation"*, *"occasional errors in spelling and/or word formation"*, and *"occasional, non-systematic errors and inappropriacies"* in grammar—provided that ideas are well extended and supported, the message is followed with ease, a wide resource is flexibly used, and the **majority of sentences are error-free**. Do NOT downgrade a genuine Band 8 script to Band 6 or 7 because of a few non-systematic slips (e.g. a spelling slip like *"belief"* for *"believe"* or occasional missing articles/prepositions).
    - **Band 7 explicitly allows** *"a few omissions or lapses"*, *"a tendency to over-generalise"*, *"some inaccuracies or some over/under use"* of cohesive devices, *"inappropriacies"* in style/collocation, *"a few errors in spelling and/or word formation"*, and *"a few errors in grammar"*—provided that error-free sentences are frequent and key requirements are covered.
    - **Band 6 explicitly allows** *"some errors in spelling and/or word formation"* and *"errors in grammar and punctuation"*—provided meaning is clear, a mix of simple and complex structures is used, and the main parts of the task are addressed. Do NOT downgrade a Band 6 response to Band 5 unless errors are **frequent and cause some difficulty for the reader** or there is **no clear overview / incomplete task coverage**.
    - **Band 5 vs Band 3/4**: Award **Band 5** when the writer expresses a position and puts forward relevant ideas with a sense of underlying coherence, even if grammatical errors are frequent and complex sentences tend to be faulty. Reserve **Band 4** for responses that are tangential/minimal or where simple sentences predominate and errors impede meaning; reserve **Band 3** ONLY when **errors predominate so severely that most meaning is prevented from coming through**.
- **Compare Adjacent Band Descriptors Before Finalising**: For every criterion, explicitly compare the essay against the awarded band and the adjacent bands (e.g., Band 5 vs Band 6, Band 6 vs Band 7, Band 7 vs Band 8) before finalising the whole-number score.
- **Keep All Four Criteria Independent**: Do not let a weakness in one criterion (e.g., an omitted overview in Task Achievement) automatically drag down Lexical Resource or Grammatical Range and Accuracy unless those criteria independently exhibit descriptor weaknesses.

=============================================================================
2. STRICT BAND 6 vs. BAND 7 vs. BAND 8 vs. BAND 9 DIFFERENTIATION
=============================================================================
Do NOT award high scores (Band 7, 8, or 9) simply because an essay sounds fluent, contains advanced vocabulary, or has few grammar mistakes. Require clear, verifiable textual evidence that the writing satisfies the target band descriptor, while equally ensuring you **DO NOT artificially deflate genuinely strong Band 7, Band 8, or Band 9 writing**:

- **Band 6 vs. Band 7 Boundary (Where +0.5 Over-Scoring Most Commonly Occurs)**:
  - **Award Band 6 (NOT Band 7)** for a criterion when:
    - *${firstCriterionName}*: ${
        taskType === 'task1_report'
          ? 'An overview is present and key features are highlighted, but **some key features are inadequately covered**, data support is missing for main categories, or **details are irrelevant, inappropriate, or inaccurate**.'
          : 'The main parts of the prompt are addressed and a relevant position is presented, but **some parts are covered more fully than others**, conclusions become unclear/repetitive, or **some main ideas are insufficiently developed, repetitive, or lack clarity/relevant support**.'
      }
    - *Coherence and Cohesion*: Information is arranged coherently with a clear overall progression, but **cohesion within and/or between sentences is faulty or mechanical** due to misuse, overuse, or omission, or referencing is not always clear.
    - *Lexical Resource*: Vocabulary is adequate and meaning is generally clear, but the range is somewhat restricted or lacks precision, with **some noticeable errors in word choice, collocation, spelling, and/or word formation** (e.g. inaccurate collocations like *"slight increased"*, *"reaching to their peaks"*, or *"this arguments"*).
    - *Grammatical Range and Accuracy*: Uses a mix of simple and complex sentence forms, but **complex structures are not marked by the same level of accuracy as simple structures**, and grammar/punctuation errors occur regularly enough across the script that error-free complex sentences are not frequent.
  - **Award Band 7 (Do NOT deflate to Band 6)** when the essay clearly satisfies the Band 7 descriptor:
    - *${firstCriterionName}*: ${
        taskType === 'task1_report'
          ? 'Covers the requirements of the task, presents a **clear overview** of main trends/differences/stages (whether in the opening, embedded as the main trend sentences of the body paragraphs, or in the conclusion), and clearly highlights and illustrates key features with accurate data (even if content could be more fully extended).'
          : 'Appropriately addresses all main parts of the prompt, presents a clear and developed position throughout, and extends and supports main ideas with relevant arguments/examples (even if there is a minor tendency to over-generalise or lack focus/precision in supporting material).'
      }
    - *Coherence and Cohesion*: Organises ideas logically with clear progression throughout, uses paragraphing effectively with a clear central topic, and uses a range of cohesive devices (including referencing/substitution) flexibly, **even if there are a few lapses or some minor over/under-use**.
    - *Lexical Resource*: Uses a sufficient lexical resource to allow some flexibility and precision, uses less common items (e.g. *"impulsively"*, *"disposable income"*, *"allocate their budgets"*, *"be swayed by"*, *"stemming from"*), and shows awareness of style and collocation, **even though occasional inappropriacies and a few spelling/word-formation errors occur**.
    - *Grammatical Range and Accuracy*: Uses a variety of complex structures (relative clauses, conditionals, concessive clauses, comparatives) with good control where **error-free sentences are frequent** (i.e. at least half of the sentences are error-free), **even though a few errors in grammar or punctuation persist**.

- **Band 7 vs. Band 8 Boundary (Do NOT deflate genuine Band 8 to Band 6 or 7)**:
  - **Award Band 8** when there is clear evidence of Band 8 performance:
    - *${firstCriterionName}*: ${
        taskType === 'task1_report'
          ? 'Covers all requirements of the task sufficiently; key features and clear trends across the chart(s) are appropriately selected, clearly presented, highlighted, and well integrated with figures (with at most occasional omissions, such as omitting a general introductory rephrasing sentence when trends are immediately and clearly synthesised).'
          : 'All requirements of the prompt are **sufficiently and appropriately** addressed; position is **clear and well-developed**; ideas are relevant, **well extended, and supported** (analyzing the topic thoughtfully from multiple angles or models, with at most occasional omissions or minor lapses in extension).'
      }
    - *Coherence and Cohesion*: The message can be **followed with ease**; information and ideas are logically sequenced; cohesion is **well managed** across sentences and paragraphs; paragraphing is used sufficiently and appropriately (**occasional lapses in paragraphing or a slight shift in the final sentence are explicitly permitted at Band 8**).
    - *Lexical Resource*: A **wide resource** is **fluently and flexibly used to convey precise meanings**; there is **skilful use of uncommon and/or idiomatic items** when appropriate (e.g. *"nourishes the self-esteem"*, *"come out of their shells"*, *"competitive prices"*, *"stemming from"*, *"late adulthood"*), **despite occasional inaccuracies in word choice/collocation or occasional spelling slips**.
    - *Grammatical Range and Accuracy*: A **wide range of structures is flexibly and accurately used**; **the majority of sentences (e.g. >65–70%) are error-free**, and punctuation is well managed, **despite occasional, non-systematic errors and inappropriacies** (such as 1–2 participial or article slips across the whole response).

- **Band 8 vs. Band 9 Boundary**:
  - **Award Band 9** ONLY when performance is exceptionally strong across the relevant criterion—not merely because an essay sounds polished:
    - *${firstCriterionName}*: Prompt is explored **in depth** (Task 2) or all requirements are **fully and appropriately satisfied** (Task 1); ideas are **fully extended and well supported**; lapses in content are extremely rare.
    - *Coherence and Cohesion*: The message can be followed **effortlessly**; cohesion is used in such a way that it **very rarely attracts attention**; any minimal lapses are negligible; paragraphing is **skilfully managed**.
    - *Lexical Resource*: **Full flexibility and precise use** are widely evident with **very natural and sophisticated control of lexical features**; minor slips in spelling/word formation are extremely rare.
    - *Grammatical Range and Accuracy*: A wide range of structures is used with **full flexibility and control**; punctuation and grammar are appropriate throughout; minor errors are **extremely rare** ("slips" only).

=============================================================================
3. REMOVE MISLEADING SCORING SHORTCUTS & CLASSROOM MYTHS (MANDATORY)
=============================================================================
- **No "Standalone Overview Paragraph" Myth in Task 1**: In Official IELTS Academic Task 1 (May 2023 descriptors), an overview does **NOT** have to be a separate standalone paragraph. If a candidate clearly states the overall trends at the start of the body paragraphs (e.g., *"The first graph shows that there is a gradual decrease in study for career reasons with age... Conversely, the first graph also shows that study stemming from interest increases with age"*) or in a concluding summary sentence (e.g., *"In conclusion, the underground railway systems in different cities vary a lot in the size of the system, the number of passengers served per year and in the age of the system"*), that **fully satisfies the "clear overview" requirement for Band 7 and Band 8**.
- **No Penalty for Concise Synthesis of Multi-Chart Relationships in Task 1**: If a candidate notes how two charts relate (e.g., noting that highest employer support aligns with the age group studying for career purposes), treat that as strong data integration, NOT "speculation".
- **No Automatic Discourse-Marker Caps**: Do NOT impose automatic band caps or score deductions simply because an essay contains words such as *"Firstly"*, *"Secondly"*, *"Moreover"*, *"Furthermore"*, *"Additionally"*, *"However"*, or *"In conclusion"*. Many genuine Band 7, 8, and 9 scripts use standard discourse markers accurately. Penalise cohesive devices ONLY when their actual use in the essay demonstrates **mechanical cohesion**, **overuse** (e.g., signposting nearly every sentence instead of using natural referencing), **misuse** (illogical connector choice), or repetition.
- **No Automatic Blacklist Caps**: Do NOT impose automatic band caps merely because a phrase resembles a common classroom expression. Penalise formulaic or memorised language ONLY when its actual use in context is inappropriate to the specific prompt, substitutes cliché for substantive argument development, or demonstrates restricted lexical control.
- **Zero Nationality or L1 Assumptions**: Never assume grammatical errors, lexical weaknesses, or rhetorical patterns based on the candidate's name, nationality, or language background. Evaluate strictly the text submitted.

=============================================================================
4. OFFICIAL IELTS WRITING BAND DESCRIPTORS (MAY 2023 EDITION — BANDS 3 TO 9)
=============================================================================

### Criterion 1: ${firstCriterionName}
${
  taskType === 'task1_report'
    ? `- **Band 9**: All the requirements of the task are fully and appropriately satisfied. There may be extremely rare lapses in content. Clear, fully developed overview; key features are skilfully selected, clearly presented, highlighted and illustrated.
- **Band 8**: Covers all the requirements of the task sufficiently. Key features are appropriately selected, clearly presented, highlighted and illustrated. There may be occasional omissions or lapses in content.
- **Band 7**: Covers the requirements of the task. The content is relevant and accurate – there may be a few omissions or lapses. The format is appropriate. Key features which are selected are covered and clearly highlighted, **but could be more fully extended**. It presents a **clear overview** of main trends, differences or stages. Data are appropriately categorised and support the description.
- **Band 6**: Addresses the requirements of the task. An overview is presented with information appropriately selected. The format is generally appropriate. Key features which are selected are covered and adequately highlighted. Data are generally relevant and appropriate, **though some key features may be inadequately covered** and **details may be irrelevant, inappropriate or inaccurate**.
- **Band 5**: Generally addresses the task, **the format may be inappropriate in places**. Recounts detail mechanically with **no clear overview**. **There may be no data to support the description**, or **key features which are selected are not adequately covered**. **The inclusion of irrelevant, inappropriate or inaccurate material in key areas detracts from the task achievement**.
- **Band 4**: Attempts to address the task. **Few key features have been selected**. **The format may be inappropriate**. Key features which are presented may be **irrelevant, repetitive, inaccurate or inappropriate**.
- **Band 3**: **Does not adequately address any of the task requirements** (possibly due to misunderstanding of the data/diagram/situation). **Key features which are presented may be largely irrelevant**. Limited information is presented, and this may be used repetitively.`
    : `- **Band 9**: The prompt is appropriately addressed and explored in depth. A clear and fully developed position is presented which directly answers the question(s). Ideas are relevant, fully extended and well supported. Any lapses in content or support are extremely rare.
- **Band 8**: The prompt is appropriately and sufficiently addressed. A clear and well-developed position is presented in response to the question(s). Ideas are relevant, well extended and supported. There may be occasional omissions or lapses in content.
- **Band 7**: The main parts of the prompt are appropriately addressed. A clear and developed position is presented. Main ideas are extended and supported, **but there may be a tendency to over-generalise or there may be a lack of focus and precision in supporting ideas/material**.
- **Band 6**: The main parts of the prompt are addressed (**though some may be more fully covered than others**). An appropriate format is used. A position is presented that is directly relevant to the prompt, **although the conclusions drawn may be unclear, unjustified or repetitive**. Main ideas are relevant, **but some may be insufficiently developed or may lack clarity, while some supporting arguments and evidence may be less relevant or inadequate**.
- **Band 5**: **The main parts of the prompt are incompletely addressed**. The format may be inappropriate in places. The writer expresses a position, **but the development is not always clear**. **Some main ideas are put forward, but they are limited and are not sufficiently developed and/or there may be irrelevant detail**. **There may be some repetition**.
- **Band 4**: **The prompt is tackled in a minimal way, or the answer is tangential**, possibly due to some misunderstanding of the prompt. The format may be inappropriate. **A position is discernible, but the reader has to read carefully to find it**. **Main ideas are difficult to identify and such ideas that are identifiable may lack relevance, clarity and/or support**. Large parts of the response may be repetitive.
- **Band 3**: **No part of the prompt is adequately addressed**, or the prompt has been misunderstood. **No relevant position can be identified**, and/or there is little direct response to the question(s). **There are few ideas, and these may be irrelevant or insufficiently developed**.`
}

### Criterion 2: Coherence and Cohesion (CC)
- **Band 9**: The message can be followed effortlessly. Cohesion is used in such a way that it very rarely attracts attention. Any minimal lapses in coherence or cohesion are negligible. Paragraphing is skilfully managed.
- **Band 8**: The message can be followed with ease. Information and ideas are logically sequenced, and cohesion is well managed. Occasional lapses in coherence and cohesion may occur. Paragraphing is used sufficiently and appropriately.
- **Band 7**: Information and ideas are logically organised, and there is a clear progression throughout the response (a few lapses may occur). A range of cohesive devices including reference and substitution is used flexibly, **but with some inaccuracies or some over/under use**. Paragraphing is generally used effectively to support overall coherence, and the sequencing of ideas within a paragraph is generally logical.
- **Band 6**: Information and ideas are generally arranged coherently and there is a clear overall progression. Cohesive devices are used to some good effect, **but cohesion within and/or between sentences may be faulty or mechanical due to misuse, overuse or omission**. Reference and substitution may be used, **but not always clearly or appropriately, causing some repetition or error**. Paragraphing may not always be logical and/or the central topic may not always be clear.
- **Band 5**: Organisation is evident **but is not wholly logical and there may be a lack of overall progression**. Nevertheless, there is a sense of underlying coherence to the response. **The relationship of ideas can be followed but the sentences are not fluently linked to each other**. **There may be limited/overuse of cohesive devices with some inaccuracy**. **The writing may be repetitive due to inadequate and/or inaccurate use of reference and substitution**. **Paragraphing may be inadequate or missing**.
- **Band 4**: **Information and ideas are evident, but not arranged coherently, and there is no clear progression within the response**. **Relationships between ideas can be unclear and/or inadequately marked**. There is some use of basic cohesive devices, **which may be inaccurate or repetitive**. **There is inaccurate use or a lack of substitution or referencing**. **There may be no paragraphing and/or no clear main topic within paragraphs**.
- **Band 3**: **There is no apparent logical organisation. Ideas are discernible but difficult to relate to each other**. **Minimal use of sequencers or cohesive devices**. Those used do not necessarily indicate a logical relationship between ideas. **There is difficulty in identifying referencing**. Any attempts at paragraphing are unhelpful.

### Criterion 3: Lexical Resource (LR)
- **Band 9**: Full flexibility and precise use are widely evident. A wide range of vocabulary is used accurately and appropriately with very natural and sophisticated control of lexical features. Minor errors in spelling and word formation are extremely rare and have minimal impact on communication.
- **Band 8**: A wide resource is fluently and flexibly used to convey precise meanings. There is skilful use of uncommon and/or idiomatic items when appropriate, **despite occasional inaccuracies in word choice and collocation**. **Occasional errors in spelling and/or word formation may occur**, but have minimal impact on communication.
- **Band 7**: The resource is sufficient to allow some flexibility and precision. There is some ability to use less common and/or idiomatic items. An awareness of style and collocation is evident, **though inappropriacies occur**. **There are only a few errors in spelling and/or word formation** and they do not detract from overall clarity.
- **Band 6**: The resource is generally adequate and appropriate for the task. The meaning is generally clear **in spite of a rather restricted range or a lack of precision in word choice**. If the writer is a risk-taker, there will be a wider range of vocabulary used but **higher degrees of inaccuracy or inappropriacy**. **There are some errors in spelling and/or word formation**, but these do not impede communication.
- **Band 5**: The resource is **limited but minimally adequate for the task**. Simple vocabulary may be used accurately **but the range does not permit much variation in expression**. **There may be frequent lapses in the appropriacy of word choice and a lack of flexibility is apparent in frequent simplifications and/or repetitions**. **Errors in spelling and/or word formation may be noticeable and may cause some difficulty for the reader**.
- **Band 4**: The resource is **limited and inadequate for or unrelated to the task**. Vocabulary is basic and may be used repetitively. **There may be inappropriate use of lexical chunks (e.g. memorised phrases, formulaic language and/or language from the input material)**. **Inappropriate word choice and/or errors in word formation and/or in spelling may impede meaning**.
- **Band 3**: The resource is **inadequate** (which may be due to the response being significantly underlength). Possible over-dependence on input material or memorised language. **Control of word choice and/or word formation is very limited, and errors predominate**. These errors may severely impede meaning.

### Criterion 4: Grammatical Range and Accuracy (GRA)
- **Band 9**: A wide range of structures is used with full flexibility and control. Punctuation and grammar are used appropriately throughout. Minor errors are extremely rare and have minimal impact on communication.
- **Band 8**: A wide range of structures is flexibly and accurately used. The majority of sentences are error-free, and punctuation is well managed. **Occasional, non-systematic errors and inappropriacies occur**, but have minimal impact on communication.
- **Band 7**: A variety of complex structures is used with some flexibility and accuracy. Grammar and punctuation are generally well controlled, and **error-free sentences are frequent**. **A few errors in grammar may persist**, but these do not impede communication.
- **Band 6**: A mix of simple and complex sentence forms is used **but flexibility is limited**. **Examples of more complex structures are not marked by the same level of accuracy as in simple structures**. **Errors in grammar and punctuation occur**, but rarely reduce communication.
- **Band 5**: **The range of structures is limited and rather repetitive**. Although complex sentences are attempted, **they tend to be faulty, and the greatest accuracy is achieved on simple sentences**. **Grammatical errors may be frequent and cause some difficulty for the reader**. **Punctuation may be faulty**.
- **Band 4**: **A very limited range of structures is used**. Subordinate clauses are rare and **simple sentences predominate**. Some structures are produced accurately **but grammatical errors are frequent and may impede meaning**. **Punctuation is often faulty or inadequate**.
- **Band 3**: Sentence forms are attempted, **but errors in grammar and punctuation predominate** (except in memorised phrases or those taken from the input material). This prevents most meaning from coming through. Length may be insufficient to provide evidence of control of sentence forms.

=============================================================================
5. MANDATORY EVIDENCE & WORKFLOW INSTRUCTIONS
=============================================================================
1. Complete 'internalExaminerAnalysis' FIRST for all 4 criteria before deciding 'overallBand'.
2. For each criterion in 'internalExaminerAnalysis', you MUST provide:
   - 'supportingEvidenceForAwardedBand': Direct quotations and specific features from the essay that satisfy the awarded whole-number band descriptor.
   - 'evidenceContradictingHigherBand': Specific quotations, grammatical/lexical errors, underdeveloped ideas, or descriptor limitations from the essay that prevent awarding the next higher whole-number band (or state "None — satisfies Band 9 descriptor across the response" if awarding Band 9).
   - 'adjacentBandComparison': Explicit comparison between the awarded whole-number band and the adjacent band(s) (e.g., Band 6 vs Band 7, or Band 7 vs Band 8) explaining why the essay fits the awarded band.
   - 'estimatedBand': Whole-number integer band (1, 2, 3, 4, 5, 6, 7, 8, or 9).
3. Ensure 'criteria[i].band' matches the whole-number 'estimatedBand' formatted to one decimal place (e.g., "6.0", "7.0", "8.0") and that 'criteria[i].specificFeedback' cites both the supporting evidence and the exact descriptor limitation preventing the next higher band.
4. For 'redPenUpgrades':
   - If the essay is below Band 8.0: select 2 actual weak, general, or flawed sentences from the student's draft, explain the exact descriptor flaw in 'whyItLosesMarks', and rewrite them to natural Band 8.5+ standard in 'band75Upgrade'.
   - If the essay is Band 8.0–9.0: select 2 sentences from the student's draft, explain why they work well (or any subtle nuance) in 'whyItLosesMarks', and provide a Band 9 stylistic alternative in 'band75Upgrade'.`;

      const userPrompt = `Evaluate this ${taskLabel} strictly against the Official IELTS Writing Band Descriptors (May 2023 edition).
Student's Target Band: ${targetBand}
Submission Word Count: ${studentResponse.split(/\s+/).filter(Boolean).length} words

Question / Prompt provided by student:
${
  promptQuestion
    ? promptQuestion
    : '(Student did not paste the question prompt — evaluate Task Response/Achievement based on internal task fulfilment, clarity of position/overview, depth of extension, and support within their writing)'
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
          temperature: 0.1,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              internalExaminerAnalysis: {
                type: Type.ARRAY,
                description:
                  'Mandatory step-by-step official May 2023 descriptor evaluation for each of the 4 criteria BEFORE determining final scores.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    criterion: {
                      type: Type.STRING,
                      description:
                        'Criterion name: Task Response (or Task Achievement), Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy.',
                    },
                    supportingEvidenceForAwardedBand: {
                      type: Type.STRING,
                      description:
                        'Specific direct quotations and concrete features from the essay that satisfy the awarded whole-number band descriptor.',
                    },
                    evidenceContradictingHigherBand: {
                      type: Type.STRING,
                      description:
                        'Specific direct quotations, errors, omissions, or descriptor ceiling features from the essay that contradict awarding the next higher band (or "None" if Band 9).',
                    },
                    adjacentBandComparison: {
                      type: Type.STRING,
                      description:
                        'Explicit comparison of adjacent whole-number band descriptors (e.g. Band 6 vs Band 7, or Band 7 vs Band 8) justifying the final integer score.',
                    },
                    estimatedBand: {
                      type: Type.INTEGER,
                      description:
                        'The whole-number IELTS band (integer 1 to 9: e.g. 4, 5, 6, 7, 8, 9) satisfied by this criterion according to the published May 2023 descriptors.',
                    },
                  },
                  required: [
                    'criterion',
                    'supportingEvidenceForAwardedBand',
                    'evidenceContradictingHigherBand',
                    'adjacentBandComparison',
                    'estimatedBand',
                  ],
                },
              },
              overallBand: {
                type: Type.STRING,
                description:
                  'Overall IELTS Writing band score calculated as the average of the 4 whole-number criterion bands rounded to the nearest 0.5 (e.g. "9.0", "8.5", "8.0", "7.5", "7.0", "6.5", "6.0", "5.5", "5.0").',
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
                      description:
                        'Whole-number band score for this criterion formatted to 1 decimal place (e.g. "9.0", "8.0", "7.0", "6.0", "5.0", "4.0").',
                    },
                    descriptorMatch: {
                      type: Type.STRING,
                      description:
                        'The exact official May 2023 IELTS Band Descriptor characteristic this writing satisfies (1 concise sentence).',
                    },
                    specificFeedback: {
                      type: Type.STRING,
                      description:
                        'Evidence-based human examiner feedback quoting specific phrases from the essay, explaining why it achieved this whole-number band, and stating what prevented the next higher band.',
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
                        'For Band 4–7.5 scripts: the specific descriptor flaw. For Band 8–9 scripts: why this sentence works well or how the alternative below refines register.',
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

        // Enforce official IELTS whole-number criterion anchoring (1 to 9) and deterministic
        // four-criterion mathematical calculation so overallBand is ALWAYS the exact official
        // average of the 4 criteria (25% each) rounded to the nearest 0.5.
        if (Array.isArray(parsed.criteria) && parsed.criteria.length === 4) {
          const numericBands = parsed.criteria.map((c: { band?: unknown }, idx: number) => {
            const internalEst = parsed.internalExaminerAnalysis?.[idx]?.estimatedBand;
            const wholeBand = normalizeIeltsCriterionBand(internalEst ?? c.band, 6);
            c.band = wholeBand.toFixed(1);
            if (parsed.internalExaminerAnalysis?.[idx]) {
              parsed.internalExaminerAnalysis[idx].estimatedBand = wholeBand;
            }
            return wholeBand;
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
  1. Individual Self-Prep Guide (BDT 499) or All 4 Guides Bundle (BDT 1,499) — best if they only have 1 module lagging or want self-study systems first.
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
  // POST /api/ai/study-plan — Personalized Day-by-Day IELTS Study Plan Builder
  // =========================================================================
  app.post('/api/ai/study-plan', async (req, res) => {
    try {
      const { buildDeterministicStudyPlan, calculateDaysUntilExam } = await import(
        './src/studyPlanEngine.ts'
      );
      const rawInput = req.body?.input ?? req.body ?? {};
      const examDateStr = String(rawInput.examDate ?? '').trim();
      const examDays = calculateDaysUntilExam(examDateStr);

      const durationDays =
        examDays !== null
          ? examDays
          : Math.max(1, Math.min(120, Number(rawInput.durationDays) || 30));
      const daysPerWeek = Math.max(
        2,
        Math.min(7, Number(rawInput.daysPerWeek) || 6)
      );

      const normalizedInput = {
        testType: (rawInput.testType === 'general' ? 'general' : 'academic') as 'academic' | 'general',
        prepStatus: (['beginner', 'preparing', 'retaker'].includes(rawInput.prepStatus)
          ? rawInput.prepStatus
          : 'preparing') as 'beginner' | 'preparing' | 'retaker',
        currentOverallBand: String(rawInput.currentOverallBand ?? '').trim(),
        targetOverallBand: String(rawInput.targetOverallBand || '7.0').trim(),
        targetListeningBand: String(rawInput.targetListeningBand ?? '').trim(),
        targetReadingBand: String(rawInput.targetReadingBand ?? '').trim(),
        targetWritingBand: String(rawInput.targetWritingBand ?? '').trim(),
        targetSpeakingBand: String(rawInput.targetSpeakingBand ?? '').trim(),
        examDate: examDateStr,
        durationDays,
        daysPerWeek,
        focusPreference: (rawInput.focusPreference === 'balanced'
          ? 'balanced'
          : 'weakness-priority') as 'weakness-priority' | 'balanced',
        availableResources: Array.isArray(rawInput.availableResources)
          ? rawInput.availableResources.map(String)
          : ['cambridge_books', 'ielts_decoded_free_rescue'],
        currentListeningBand: String(rawInput.currentListeningBand ?? '').trim(),
        currentReadingBand: String(rawInput.currentReadingBand ?? '').trim(),
        currentWritingBand: String(rawInput.currentWritingBand ?? '').trim(),
        currentSpeakingBand: String(rawInput.currentSpeakingBand ?? '').trim(),
        notSureWeaknesses: Boolean(rawInput.notSureWeaknesses),
        listeningWeaknesses: Array.isArray(rawInput.listeningWeaknesses)
          ? rawInput.listeningWeaknesses.map(String)
          : [],
        readingWeaknesses: Array.isArray(rawInput.readingWeaknesses)
          ? rawInput.readingWeaknesses.map(String)
          : [],
        writingWeaknesses: Array.isArray(rawInput.writingWeaknesses)
          ? rawInput.writingWeaknesses.map(String)
          : [],
        speakingWeaknesses: Array.isArray(rawInput.speakingWeaknesses)
          ? rawInput.speakingWeaknesses.map(String)
          : [],
        additionalNotes: String(rawInput.additionalNotes ?? '').trim(),
      };

      // Build the complete Day 1..Day N structured foundation plan
      const plan = buildDeterministicStudyPlan(normalizedInput);

      // Enhance the curriculum with Gemini AI personalization in simple, everyday teacher English
      try {
        const systemInstruction = `You are a friendly, experienced IELTS teacher at IELTS DECODED explaining to a student how to follow their ${durationDays}-day study plan.
Write in VERY SIMPLE, everyday, beginner-friendly English that any student can understand immediately.
Rules:
- Use short, clear sentences and familiar everyday words.
- NEVER use fancy academic words, complicated headings, or technical jargon (do NOT use words like "remediation", "consolidate", "lexical resource development", "distractor analysis", "post-mortem", "diagnostics", or "calibrate").
- Instead, use plain words like "find out why your answers were wrong", "learn and use new words", "organise your ideas", "check how well you did", and "practise the areas you find difficult".
- Never assign hours or minutes to daily tasks.
- Never promise or guarantee a band score.`;

        const day1Title = plan.days[0]?.title || 'Getting Started';
        const day2Title = plan.days[1]?.title || 'Focused Practice';
        const day2Tag = plan.days[1]?.questionTypeTag || '';

        const promptSummary = `Student Profile:
- Test Type: ${normalizedInput.testType === 'academic' ? 'IELTS Academic' : 'IELTS General Training'}
- Experience: ${normalizedInput.prepStatus === 'beginner' ? 'Complete beginner starting from scratch' : normalizedInput.prepStatus}
- Current Overall Band: ${normalizedInput.currentOverallBand || 'Not taken yet (starting from scratch)'}
- Module Current Scores: Listening:${normalizedInput.currentListeningBand || 'not sure'}, Reading:${normalizedInput.currentReadingBand || 'not sure'}, Writing:${normalizedInput.currentWritingBand || 'not sure'}, Speaking:${normalizedInput.currentSpeakingBand || 'not sure'}
- Target Overall Band: ${normalizedInput.targetOverallBand}
- Plan Length: ${durationDays} days (${daysPerWeek} study days per week)
- Listening Difficult Areas: ${normalizedInput.listeningWeaknesses.join('; ') || 'None selected'}
- Reading Difficult Areas: ${normalizedInput.readingWeaknesses.join('; ') || 'None selected'}
- Writing Difficult Areas: ${normalizedInput.writingWeaknesses.join('; ') || 'None selected'}
- Speaking Difficult Areas: ${normalizedInput.speakingWeaknesses.join('; ') || 'None selected'}
- Day 1 Lesson Title: ${day1Title}
- Day 2 Lesson Title: ${day2Title} (${day2Tag})`;

        const rawAiJson = await generateJsonWithCascade({
          contents: promptSummary,
          systemInstruction,
          temperature: 0.25,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              personalizedRealisticNote: {
                type: Type.STRING,
                description:
                  '2 to 3 short, friendly sentences in very simple English welcoming the student and explaining how to follow their plan step by step without feeling overwhelmed.',
              },
              customPhaseFocuses: {
                type: Type.ARRAY,
                description:
                  '4 short, simple 1-sentence descriptions for the 4 stages of their study plan, written in everyday beginner-friendly English.',
                items: {
                  type: Type.STRING,
                },
              },
            },
            required: [
              'personalizedRealisticNote',
              'customPhaseFocuses',
            ],
          },
        });

        const parsedAi = JSON.parse(rawAiJson);
        if (parsedAi.personalizedRealisticNote) {
          plan.realisticExpectationNote = parsedAi.personalizedRealisticNote;
        }
        if (Array.isArray(parsedAi.customPhaseFocuses) && parsedAi.customPhaseFocuses.length === 4) {
          plan.phases.forEach((p, idx) => {
            if (parsedAi.customPhaseFocuses[idx]) {
              p.focusSummary = parsedAi.customPhaseFocuses[idx];
            }
          });
        }
      } catch (aiErr) {
        console.warn('Study plan AI enhancement skipped (using full deterministic curriculum):', aiErr);
      }

      res.status(200).json({
        ok: true,
        plan,
      });
    } catch (err) {
      console.error('Error in /api/ai/study-plan:', err);
      res.status(500).json({
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Could not generate your study plan right now. Please try again.',
      });
    }
  });

  // =========================================================================
  // SEO Routes: Dynamic Origin Helper, robots.txt, sitemap.xml, and llms.txt
  // =========================================================================
  const publicDir = path.resolve(__dirname, 'public');

  const getRequestOrigin = (req: express.Request): string => {
    const proto =
      (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() ||
      req.protocol ||
      'https';
    const host =
      (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim() ||
      req.get('host');
    if (!host || host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('0.0.0.0')) {
      return (process.env.APP_URL || 'https://ielts-decoded.ai.studio').replace(/\/+$/, '');
    }
    return `${proto}://${host}`.replace(/\/+$/, '');
  };

  const escapeHtmlAttr = (str: string): string =>
    str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  app.get('/robots.txt', (req, res) => {
    const origin = getRequestOrigin(req);
    res.type('text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(
      [
        'User-agent: *',
        'Allow: /',
        'Allow: /guides',
        'Allow: /diagnostic',
        'Allow: /writing-checker',
        'Allow: /band-calculator',
        'Allow: /study-plan',
        'Allow: /tips',
        'Allow: /case-study',
        'Allow: /llms.txt',
        '',
        '# Sitemaps',
        `Sitemap: ${origin}/sitemap.xml`,
        '',
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const origin = getRequestOrigin(req);
    const today = new Date().toISOString().split('T')[0];
    const routeList = Object.values(SEO_ROUTES);
    const urlsXml = routeList
      .map((route) => {
        const loc = `${origin}${route.path === '/' ? '/' : route.path}`;
        const imageBlock =
          route.path === '/'
            ? `
    <image:image>
      <image:loc>${origin}/og-image.jpg</image:loc>
      <image:title>IELTS DECODED — Official Website by Jubayer Siddiki (Overall Band 8.0)</image:title>
      <image:caption>Stuck on the same band? Find exactly why you're losing marks with IELTS DECODED.</image:caption>
    </image:image>
    <image:image>
      <image:loc>${origin}/1.jpg</image:loc>
      <image:title>Jubayer Siddiki — Founder of IELTS DECODED (Overall Band 8.0, CLB 9)</image:title>
    </image:image>`
            : '';
        return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>${imageBlock}
  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>
`;
    res.type('application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  });

  app.get('/llms.txt', (req, res) => {
    const origin = getRequestOrigin(req);
    const llmsFile = path.join(publicDir, 'llms.txt');
    res.type('text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (fs.existsSync(llmsFile)) {
      const content = fs
        .readFileSync(llmsFile, 'utf-8')
        .replace(/https:\/\/(ielts-decoded\.ai\.studio|ieltsdecoded\.com)/g, origin);
      res.send(content);
    } else {
      res.send(`# IELTS DECODED (${origin})\nOfficial Academic IELTS Diagnostic & Mentorship Platform by Jubayer Siddiki (Band 8.0).\n`);
    }
  });

  // Lightweight route aliases for testimonial videos & social preview images
  app.get('/testimonial-1.mp4', (_req, res) => {
    res.sendFile(path.join(publicDir, 'testimonial.mp4'));
  });
  app.get(['/testimonial2.mp4', '/testimonial 2.mp4'], (_req, res) => {
    res.sendFile(path.join(publicDir, 'testimonial-2.mp4'));
  });
  app.get(['/og-image.jpg', '/og-image.png', '/1.png'], (_req, res) => {
    const ogFile = path.join(publicDir, 'og-image.jpg');
    if (fs.existsSync(ogFile)) {
      res.type('image/jpeg');
      res.sendFile(ogFile);
    } else {
      res.type('image/jpeg');
      res.sendFile(path.join(publicDir, '1.jpg'));
    }
  });

  // Serve static public assets directly (supports HTTP Range video streaming for Safari/iOS/Chrome)
  app.use(
    express.static(publicDir, {
      acceptRanges: true,
    })
  );

  // Server-Side SEO Pre-Renderer: Injects route-specific Title, Description, Canonical URL,
  // OpenGraph tags, Google/Bing Verification tags, JSON-LD @graph, and Semantic Crawlable HTML
  const renderSeoHtmlForRequest = (rawHtml: string, req: express.Request): string => {
    const origin = getRequestOrigin(req);
    const routeData = resolveSeoRouteFromPathname(req.originalUrl || req.path || '/');
    const canonicalUrl = `${origin}${routeData.path === '/' ? '/' : routeData.path}`;
    const ogImageUrl = `${origin}/og-image.jpg`;

    let html = rawHtml;

    // 1. Replace <title> and primary meta tags
    html = html.replace(
      /<title>[\s\S]*?<\/title>/i,
      `<title>${escapeHtmlAttr(routeData.title)}</title>`
    );
    html = html.replace(
      /<meta name="title" content="[^"]*"\s*\/?>/i,
      `<meta name="title" content="${escapeHtmlAttr(routeData.title)}" />`
    );
    html = html.replace(
      /<meta name="description" content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtmlAttr(routeData.description)}" />`
    );
    html = html.replace(
      /<meta name="keywords" content="[^"]*"\s*\/?>/i,
      `<meta name="keywords" content="${escapeHtmlAttr(routeData.keywords)}" />`
    );
    html = html.replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />`
    );

    // 2. Replace OpenGraph & Twitter tags with route-specific copy & active origin
    html = html.replace(
      /<meta property="og:url" content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}" />`
    );
    html = html.replace(
      /<meta property="og:title" content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${escapeHtmlAttr(routeData.ogTitle)}" />`
    );
    html = html.replace(
      /<meta property="og:description" content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${escapeHtmlAttr(routeData.ogDescription)}" />`
    );
    html = html.replace(
      /<meta name="twitter:url" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:url" content="${escapeHtmlAttr(canonicalUrl)}" />`
    );
    html = html.replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${escapeHtmlAttr(routeData.ogTitle)}" />`
    );
    html = html.replace(
      /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${escapeHtmlAttr(routeData.ogDescription)}" />`
    );
    html = html.replace(
      /https:\/\/(ielts-decoded\.ai\.studio|ieltsdecoded\.com)\/og-image\.jpg/g,
      ogImageUrl
    );

    // 3. Inject additional Google Search Console & Bing Webmaster verification tags if configured via env
    const googleVerify = process.env.GOOGLE_SITE_VERIFICATION?.trim();
    const bingVerify = process.env.BING_SITE_VERIFICATION?.trim();
    const verificationTags: string[] = [];
    if (googleVerify && !html.includes(googleVerify)) {
      verificationTags.push(
        `<meta name="google-site-verification" content="${escapeHtmlAttr(googleVerify)}" />`
      );
    }
    if (bingVerify) {
      verificationTags.push(
        `<meta name="msvalidate.01" content="${escapeHtmlAttr(bingVerify)}" />`
      );
    }
    if (verificationTags.length > 0) {
      html = html.replace(
        '</head>',
        `    ${verificationTags.join('\n    ')}\n  </head>`
      );
    }

    // 4. Inject full route-aware Schema.org JSON-LD @graph
    const jsonLdGraph = JSON.stringify(buildStructuredDataGraph(origin, routeData));
    html = html.replace(
      /<script id="ielts-decoded-jsonld" type="application\/ld\+json">[\s\S]*?<\/script>/i,
      `<script id="ielts-decoded-jsonld" type="application/ld+json">${jsonLdGraph}</script>`
    );

    const isSearchBot =
      /Googlebot|Google-InspectionTool|Google-Site-Verification|bingbot|Baiduspider|YandexBot|DuckDuckBot|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Applebot|crawlers|bot|spider|crawl/i.test(
        req.get('user-agent') || ''
      );

    // 5. Inject route-specific semantic HTML inside #root ONLY for search engine crawlers/bots.
    // Real human browser users get a clean #root so they never see unstyled HTML flash during page load.
    if (isSearchBot) {
      const highlightsListHtml = routeData.highlights
        .map((item) => `            <li>${escapeHtmlAttr(item)}</li>`)
        .join('\n');
      const routeMainHtml = `<header>
        <nav aria-label="IELTS DECODED Primary Navigation">
          <a href="/"><strong>IELTS DECODED</strong></a> |
          <a href="/study-plan">Free IELTS Study Plan Generator</a> |
          <a href="/diagnostic">Free IELTS Writing Checker &amp; Examiner Desk</a> |
          <a href="/guides">IELTS Self-Prep Module Guides (PDF Books)</a> |
          <a href="/tips">Most Common IELTS Mistakes &amp; Tips</a> |
          <a href="/case-study">Band 6.0 to 7.5+ Essay Case Study</a> |
          <a href="/band-calculator">IELTS Band Score Calculator</a>
        </nav>
      </header>
      <main>
        <h1>${escapeHtmlAttr(routeData.h1)}</h1>
        <p><strong>IELTS DECODED</strong> (<a href="${escapeHtmlAttr(origin)}/">${escapeHtmlAttr(origin)}</a>) is the official Academic IELTS diagnostic platform, 4-module self-prep guide series, and live mentorship program founded by <strong>Jubayer Siddiki</strong> (IELTS Overall Band 8.0 · CLB 9 · Listening 8.5 · Reading 8.5 · Writing 7.0 · Speaking 7.0). ${escapeHtmlAttr(routeData.leadParagraph)}</p>
        <section>
          <h2>Key Highlights — ${escapeHtmlAttr(routeData.breadcrumbName)} (IELTS DECODED)</h2>
          <ul>
${highlightsListHtml}
          </ul>
        </section>
        <section>
          <h2>Explore All IELTS DECODED Tools &amp; Guides</h2>
          <ul>
            <li><a href="/"><strong>IELTS DECODED Official Homepage</strong></a> — Free 38-Page IELTS Band 7+ Score Rescue Guide &amp; Live Mentorship by Jubayer Siddiki (Overall Band 8.0).</li>
            <li><a href="/diagnostic"><strong>Free IELTS Writing Task 1 &amp; Task 2 Examiner Desk</strong></a> — Instant scoring across TR/TA, CC, LR, and GRA with red-pen line fixes.</li>
            <li><a href="/study-plan"><strong>Free Personalized IELTS Study Plan Generator</strong></a> — Custom 7 to 90-day daily IELTS preparation schedule PDF.</li>
            <li><a href="/guides"><strong>IELTS DECODED 4-Module Self-Prep PDF Guides</strong></a> — Listening (50pp), Reading (48pp), Writing (65pp), and Speaking (59pp) books with free 5-page sample previews.</li>
            <li><a href="/tips"><strong>Most Common IELTS Mistakes &amp; Band 7.5+ Tips</strong></a> — Side-by-side Band 6.0 vs. Band 7.5+ fixes.</li>
            <li><a href="/case-study"><strong>Band 6.0 to 7.5+ IELTS Writing Essay Case Study</strong></a> — Line-by-line examiner red-pen breakdown.</li>
            <li><a href="/band-calculator"><strong>Official IELTS Band Score Calculator</strong></a> — Calculate Overall IELTS Academic band &amp; CLB equivalents.</li>
          </ul>
        </section>
      </main>`;

      html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${routeMainHtml}</div>`);
    } else {
      // Clear out any server-side placeholder inside #root for human browsers
      html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, '<div id="root"></div>');
    }

    return html;
  };

  // =========================================================================
  // Vite Dev Middleware or Static Production Build
  // =========================================================================
  const distPath = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProd) {
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      try {
        const rawHtml = fs.readFileSync(indexFile, 'utf-8');
        res.type('text/html').send(renderSeoHtmlForRequest(rawHtml, req));
      } catch {
        res.sendFile(indexFile);
      }
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.method !== 'GET' || req.originalUrl.startsWith('/api/')) {
        return next();
      }
      try {
        const indexFile = path.resolve(__dirname, 'index.html');
        const rawHtml = fs.readFileSync(indexFile, 'utf-8');
        const seoHtml = renderSeoHtmlForRequest(rawHtml, req);
        const transformedHtml = await vite.transformIndexHtml(req.originalUrl, seoHtml);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
