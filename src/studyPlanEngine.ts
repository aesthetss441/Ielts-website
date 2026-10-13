export type TestType = 'academic' | 'general';
export type PrepStatus = 'beginner' | 'preparing' | 'retaker';
export type StudyFocusPreference = 'weakness-priority' | 'balanced';
export type ModuleId = 'listening' | 'reading' | 'writing' | 'speaking';

export interface StudyPlanQuestionnaireInput {
  // Step A: IELTS goal
  testType: TestType;
  prepStatus: PrepStatus;
  currentOverallBand: string; // '' if unknown/beginner
  targetOverallBand: string; // e.g., '6.5', '7.0', '7.5', '8.0'
  targetListeningBand: string;
  targetReadingBand: string;
  targetWritingBand: string;
  targetSpeakingBand: string;
  examDate: string; // YYYY-MM-DD or ''

  // Step B: Preparation duration and study habits
  durationDays: number; // Exact days requested (7 to 120)
  daysPerWeek: number; // 3, 4, 5, 6, 7
  focusPreference: StudyFocusPreference;
  availableResources: string[]; // e.g. ['cambridge_books', 'official_samples', 'ielts_decoded_free_rescue', 'ielts_decoded_guides', 'none']

  // Step C: Current skills and weaknesses
  currentListeningBand: string; // '' if unknown
  currentReadingBand: string;
  currentWritingBand: string;
  currentSpeakingBand: string;
  notSureWeaknesses: boolean;
  listeningWeaknesses: string[];
  readingWeaknesses: string[];
  writingWeaknesses: string[];
  speakingWeaknesses: string[];
  additionalNotes: string;
}

export interface StudyPlanDayTask {
  dayNumber: number;
  phaseIndex: number; // 1 to 4
  phaseName: string; // e.g. 'Stage 1: Learn the Basics'
  isConsolidationDay: boolean; // True if weekly review day
  title: string;
  primaryModule: ModuleId | 'mixed' | 'mock';
  secondaryModule?: ModuleId;
  questionTypeTag: string; // e.g. 'Reading'
  primaryObjective: string;
  specificStudyTasks: string[];
  practiceMaterial: string;
  stepByStepMethod: string[];
  completionMethod: string;
  reviewAndErrorAnalysis: string[];
  targetWeaknessAddressed: string;
  upgradeExample?: {
    contextLabel: string;
    band6Sample: string;
    band75Upgrade: string;
    whyItWorks: string;
  };
  successCriteria: string[];
  nextDayBridge: string;
}

export interface StudyPlanPhaseOverview {
  phaseIndex: number;
  phaseName: string;
  dayRangeLabel: string; // e.g. 'Days 1–5'
  focusSummary: string;
  keyMilestone: string;
}

export interface GeneratedStudyPlan {
  id: string;
  createdAt: string;
  input: StudyPlanQuestionnaireInput;
  planTitle: string;
  studentProfileSummary: string;
  realisticExpectationNote: string;
  ambitiousTargetWarning: string | null;
  examDateConflictNote: string | null;
  primaryBottleneckModule: ModuleId;
  moduleAllocationPercent: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
  };
  phases: StudyPlanPhaseOverview[];
  days: StudyPlanDayTask[];
  recommendedDecodeOffer: {
    primaryTitle: string;
    primaryBadge: string;
    primaryReason: string;
    primaryCtaText: string;
    primaryWaMessage: string;
    secondaryGuideIds: ModuleId[];
    secondaryReason: string;
  };
}

export interface StudyPlanDayProgress {
  completed: boolean;
  completedTasks: number[]; // indices of specificStudyTasks completed
  userNotes: string;
  updatedAt?: string;
}

export type StudyPlanProgressMap = Record<number, StudyPlanDayProgress>;

export const LISTENING_WEAKNESS_OPTIONS = [
  'Multiple-choice questions',
  'Map and diagram labelling',
  'Form, note, table, and sentence completion',
  'Matching questions',
  'Spelling, distractors, and losing track of the audio',
] as const;

export const READING_WEAKNESS_OPTIONS = [
  'True / False / Not Given',
  'Yes / No / Not Given',
  'Matching headings',
  'Matching information and features',
  'Multiple choice',
  'Sentence, summary, and note completion',
  'Vocabulary in context, locating evidence, and managing accuracy',
] as const;

export const WRITING_WEAKNESS_OPTIONS_ACADEMIC = [
  'Task 1: understanding the question and selecting key features',
  'Task 1: overview, comparisons, data reporting, or process and map descriptions',
  'Task 2: understanding the prompt, planning, developing arguments, and writing relevant examples',
  'Task Response / Task Achievement',
  'Coherence and Cohesion',
  'Lexical Resource',
  'Grammatical Range and Accuracy',
] as const;

export const WRITING_WEAKNESS_OPTIONS_GENERAL = [
  'Task 1: understanding the letter prompt, tone (formal/semi-formal/informal), and bullet coverage',
  'Task 1: opening purpose, developing bullet points naturally, and appropriate sign-off',
  'Task 2: understanding the prompt, planning, developing arguments, and writing relevant examples',
  'Task Response / Task Achievement',
  'Coherence and Cohesion',
  'Lexical Resource',
  'Grammatical Range and Accuracy',
] as const;

export const SPEAKING_WEAKNESS_OPTIONS = [
  'Part 1 answers and extending responses naturally',
  'Part 2 cue-card organization and idea development',
  'Part 3 abstract questions and deeper explanations',
  'Fluency and Coherence',
  'Lexical Resource',
  'Grammatical Range and Accuracy',
  'Pronunciation and intelligibility',
] as const;

export const RESOURCE_OPTIONS = [
  {
    id: 'cambridge_books',
    label: 'Cambridge IELTS Official Practice Books',
    shortLabel: 'Cambridge Practice Books',
  },
  {
    id: 'official_samples',
    label: 'Free official sample questions (IELTS.org, British Council, or IDP)',
    shortLabel: 'Official Sample Tests',
  },
  {
    id: 'ielts_decoded_free_rescue',
    label: 'IELTS DECODED Free 38-Page Score Rescue Guide',
    shortLabel: 'Score Rescue PDF',
  },
  {
    id: 'ielts_decoded_guides',
    label: 'IELTS DECODED 4-Module Self-Prep Guides',
    shortLabel: 'IELTS DECODED Guides',
  },
] as const;

// ============================================================================
// SIMPLE, EVERYDAY TEACHER LESSONS ACROSS ALL 4 SKILLS
// ============================================================================

interface CurriculumUnitTemplate {
  module: ModuleId;
  questionTypeTag: string;
  matchingWeaknessKeywords: string[];
  academicOnly?: boolean;
  generalOnly?: boolean;
  foundationalTitle: string;
  targetedTitle: string;
  advancedTitle: string;
  primaryObjective: string;
  beginnerTasks: string[];
  regularTasks: string[];
  advancedTasks: string[];
  whatYouNeed: string;
  stepByStepMethod: string[];
  completionMethod: string;
  reviewAndErrorAnalysis: string[];
  upgradeExample?: {
    contextLabel: string;
    band6Sample: string;
    band75Upgrade: string;
    whyItWorks: string;
  };
  successCriteria: string[];
}

const CURRICULUM_UNITS: CurriculumUnitTemplate[] = [
  // ================= READING LESSONS =================
  {
    module: 'reading',
    questionTypeTag: 'Reading · True / False / Not Given',
    matchingWeaknessKeywords: ['True / False / Not Given', 'locating evidence'],
    foundationalTitle: 'Reading: True, False, or Not Given?',
    targetedTitle: 'Reading: Tell the Difference Between False and Not Given',
    advancedTitle: 'Reading: Practise True / False / Not Given Questions',
    primaryObjective:
      'Learn how to answer True / False / Not Given questions by checking what the passage actually says.',
    beginnerTasks: [
      '1. Learn what the three answers mean: True means the passage agrees with the statement. False means the passage says the opposite. Not Given means the passage does not give enough information to decide.',
      '2. Find one Reading passage with True / False / Not Given questions.',
      '3. Answer 6 to 8 questions without looking at the answer key.',
      '4. Check your answers using the answer key.',
      '5. For every question you got wrong, find the relevant sentence in the passage.',
      '6. Write down why the correct answer is right.',
    ],
    regularTasks: [
      '1. Find one Reading passage with True / False / Not Given questions.',
      '2. Read each question statement and underline the main words (such as names, dates, or places).',
      '3. Answer all the questions in that passage without looking at the answer key.',
      '4. Check your answers using the answer key.',
      '5. For every question you got wrong, find the matching sentence in the passage and write down why your answer was wrong.',
    ],
    advancedTasks: [
      '1. Choose one full Reading passage that includes True / False / Not Given questions.',
      '2. Answer all the questions in the passage without using a dictionary.',
      '3. Pay close attention to small words like "all", "only", "always", or "more than" before choosing your answer.',
      '4. Check your answers using the answer key.',
      '5. For any question you missed, find the sentence in the passage and write down what tricked you.',
    ],
    whatYouNeed: 'One suitable Reading passage and its answer key.',
    stepByStepMethod: [
      'Read the statement carefully and underline the main topic words.',
      'Find the part of the passage that talks about the same topic. These answers come in the same order as the text.',
      'Check if the passage agrees with the statement (True), says the opposite (False), or does not say (Not Given).',
      'Do not guess based on what seems likely. Only use the information written in the passage.',
    ],
    completionMethod:
      'Focus on finding the exact sentence in the passage for every question before you choose your answer.',
    reviewAndErrorAnalysis: [
      'Check the questions you got wrong using the answer key.',
      'Find the sentence in the passage that proves the correct answer.',
      'Write down why you made each mistake so you can avoid it next time.',
    ],
    upgradeExample: {
      contextLabel: 'Example: True, False, or Not Given?',
      band6Sample:
        'Statement: "The museum opened in 1990." — Passage: "The museum was first planned in 1990 and opened to the public in 1993."',
      band75Upgrade:
        'Answer: False. The passage says the museum opened in 1993, not 1990. (If the passage did not say when it opened, the answer would be Not Given.)',
      whyItWorks:
        'Do not pick True just because you see the year 1990 in the passage. Always check what happened in that year.',
    },
    successCriteria: [
      'You should understand why each of your answers is right or wrong.',
    ],
  },
  {
    module: 'reading',
    questionTypeTag: 'Reading · Matching Headings',
    matchingWeaknessKeywords: ['Matching headings', 'locating evidence'],
    foundationalTitle: 'Reading: Find the Main Idea of a Paragraph',
    targetedTitle: 'Reading: Match Headings to Paragraphs',
    advancedTitle: 'Reading: Practise Matching Headings Without Falling for Traps',
    primaryObjective:
      'Learn how to find what a whole paragraph is about so you can choose the right heading.',
    beginnerTasks: [
      '1. Find one Reading passage with Matching Headings questions (where you match short titles to paragraphs).',
      '2. Cover the list of headings first so they do not confuse you.',
      '3. Read the first four paragraphs one by one. Next to each paragraph, write a few simple words saying what that paragraph is mostly about.',
      '4. Uncover the list of headings and choose the best heading for each paragraph.',
      '5. Check your answers using the answer key.',
      '6. For any wrong answer, read the paragraph again to see why the correct heading fits better.',
    ],
    regularTasks: [
      '1. Find one Reading passage with Matching Headings questions.',
      '2. Read each paragraph first before looking at the list of headings.',
      '3. Write a short note (4 to 5 words) beside each paragraph to sum up its main point.',
      '4. Match each paragraph to the best heading in the list.',
      '5. Check your answers using the answer key and write down why any wrong answer confused you.',
    ],
    advancedTasks: [
      '1. Choose one full Reading passage that includes Matching Headings questions.',
      '2. Read each paragraph, sum up its main idea in a few words, and match it to the correct heading.',
      '3. Answer the remaining questions in that passage without using a dictionary.',
      '4. Check your answers using the answer key and review any heading where you picked a small detail instead of the main idea.',
    ],
    whatYouNeed: 'One Reading passage with Matching Headings questions and its answer key.',
    stepByStepMethod: [
      'Do not look at the list of headings first.',
      'Read one paragraph from start to finish and ask: "What is the main point of this whole paragraph?"',
      'Look at the list of headings and find the one that matches the whole paragraph.',
      'Be careful: a wrong heading often repeats one word from the paragraph, even though the paragraph is mainly about something else.',
    ],
    completionMethod:
      'Read each paragraph and write a short note about its main idea before choosing a heading.',
    reviewAndErrorAnalysis: [
      'Check the questions you got wrong using the answer key.',
      'Look at the wrong heading you chose and see if it only matched one small sentence instead of the whole paragraph.',
    ],
    upgradeExample: {
      contextLabel: 'Example: Main Idea vs Small Detail',
      band6Sample:
        'A paragraph mentions a storm in 1995 in the first sentence, and then spends five sentences explaining how farmers saved water. — Wrong choice: "Bad weather in 1995".',
      band75Upgrade:
        'Right choice: "How farmers found new ways to save water". The storm in 1995 was only a small detail at the start; the whole paragraph is about saving water.',
      whyItWorks:
        'The right heading always describes the main idea of the whole paragraph, not just one sentence.',
    },
    successCriteria: [
      'You should have a short note for each paragraph and understand why each correct heading fits.',
    ],
  },
  {
    module: 'reading',
    questionTypeTag: 'Reading · Fill in the Blanks',
    matchingWeaknessKeywords: [
      'Sentence, summary, and note completion',
      'Vocabulary in context, locating evidence, and managing accuracy',
    ],
    foundationalTitle: 'Reading: Fill in the Missing Words',
    targetedTitle: 'Reading: Complete Sentences and Summaries Accurately',
    advancedTitle: 'Reading: Practise Summary and Sentence Completion',
    primaryObjective:
      'Learn how to find the right word in the passage to fill in a blank without making spelling or word-limit mistakes.',
    beginnerTasks: [
      '1. Find one Reading passage with fill-in-the-blank questions (Sentence Completion or Summary Completion).',
      '2. Read the instructions at the top to see how many words you are allowed to write (such as "ONE WORD ONLY").',
      '3. Read each sentence with a blank and guess what kind of word is missing (such as a person, a place, a number, or an action).',
      '4. Find the matching part of the passage and copy the exact word into the blank.',
      '5. Check your answers using the answer key.',
      '6. Check your spelling and write down any mistakes you made.',
    ],
    regularTasks: [
      '1. Choose one Reading passage that includes Sentence Completion or Summary Completion questions.',
      '2. Underline the word limit in the instructions before you begin.',
      '3. Answer all the questions in that section by finding the matching sentences in the passage.',
      '4. Check your answers using the answer key.',
      '5. Write down the words in the question and the matching words in the passage that had the same meaning.',
    ],
    advancedTasks: [
      '1. Complete one full Reading passage containing Summary Completion and other question types.',
      '2. Check that every word you write fits the grammar of the sentence and obeys the word limit.',
      '3. Check your answers using the answer key and write down any new words you learned.',
    ],
    whatYouNeed: 'One Reading passage with fill-in-the-blank questions, its answer key, and a notebook.',
    stepByStepMethod: [
      'Check the word limit first (for example, "ONE WORD ONLY"). If you write two words when the limit is one word, your answer will be marked wrong.',
      'Look at the words before and after the blank to see what kind of word is needed.',
      'Find the sentence in the passage that talks about the same idea.',
      'Copy the word carefully from the passage and check your spelling.',
    ],
    completionMethod:
      'Always read the completed sentence one more time to make sure the word makes sense and fits the grammar.',
    reviewAndErrorAnalysis: [
      'Check the questions you got wrong using the answer key.',
      'See if you picked the wrong word, wrote too many words, or made a spelling mistake.',
    ],
    upgradeExample: {
      contextLabel: 'Example: Checking What Kind of Word Fits the Blank',
      band6Sample:
        'Question: "Scientists found several new _______ in the forest." (ONE WORD ONLY). Passage: "In the forest, the team discovered a number of rare birds."',
      band75Upgrade:
        'Answer: "birds". After the words "several new", we need a plural noun. In the passage, "discovered" means "found", and the plural noun is "birds".',
      whyItWorks:
        'Looking at the words right before the blank helps you pick the exact word that fits.',
    },
    successCriteria: [
      'You should have all blanks filled within the word limit and know why any wrong answer happened.',
    ],
  },
  {
    module: 'reading',
    questionTypeTag: 'Reading · Multiple Choice & Matching',
    matchingWeaknessKeywords: [
      'Yes / No / Not Given',
      'Multiple choice',
      'Matching information and features',
    ],
    foundationalTitle: 'Reading: Choose the Right Answer in Multiple Choice',
    targetedTitle: 'Reading: Avoid Wrong Options in Multiple Choice and Matching',
    advancedTitle: 'Reading: Practise Passage 2 and Passage 3 Questions',
    primaryObjective:
      'Learn how to find the right part of the passage first and cross out wrong options that try to confuse you.',
    beginnerTasks: [
      '1. Find one Reading passage with Multiple Choice questions (where you choose A, B, C, or D).',
      '2. Read the question first, before looking at options A, B, C, and D.',
      '3. Find the paragraph in the passage that answers the question and read it carefully.',
      '4. Now read options A, B, C, and D. Cross out the options that do not match the passage and choose the right one.',
      '5. Answer 5 to 6 questions this way, then check your answers using the answer key.',
      '6. For every mistake, find the sentence in the passage that shows why the correct answer is right.',
    ],
    regularTasks: [
      '1. Choose one Reading passage with Multiple Choice or Yes / No / Not Given questions.',
      '2. Find the matching part of the passage for each question and cross out wrong options before choosing your answer.',
      '3. Check your answers using the answer key.',
      '4. For every wrong answer, write down why the option you picked was wrong.',
    ],
    advancedTasks: [
      '1. Complete one full Passage 2 or Passage 3 section containing Multiple Choice or Yes / No / Not Given questions.',
      '2. For each question, find the exact sentences in the passage that prove your choice and rule out the other options.',
      '3. Check your answers using the answer key and review any question that slowed you down.',
    ],
    whatYouNeed: 'One suitable Reading passage and its answer key.',
    stepByStepMethod: [
      'Read the main question first and underline the topic words.',
      'Find the matching part of the passage and read what the writer says.',
      'Compare options A, B, C, and D against the passage.',
      'Cross out options that say the opposite of the text or talk about something not mentioned in the text.',
    ],
    completionMethod:
      'Read the passage paragraph first before choosing between A, B, C, and D.',
    reviewAndErrorAnalysis: [
      'Check the questions you got wrong using the answer key.',
      'Find the sentence in the passage that proves the right answer and see how the wrong option tricked you.',
    ],
    successCriteria: [
      'You should know why the correct letter is right and why the other options are wrong.',
    ],
  },

  // ================= LISTENING LESSONS =================
  {
    module: 'listening',
    questionTypeTag: 'Listening · Catching Details',
    matchingWeaknessKeywords: [
      'Form, note, table, and sentence completion',
      'Spelling, distractors, and losing track of the audio',
    ],
    foundationalTitle: 'Listening: Catch the Right Answer',
    targetedTitle: 'Listening: Fill in Notes and Check Your Spelling',
    advancedTitle: 'Listening: Practise Part 1 and Part 4 Note Completion',
    primaryObjective:
      'Get better at hearing important information in a recording, such as names, dates, numbers, and key words.',
    beginnerTasks: [
      '1. Choose one Listening practice section with questions about names, dates, numbers, places, or other details.',
      '2. Read the questions before playing the recording.',
      '3. Underline the information you need to listen for.',
      '4. Play the recording and answer the questions.',
      '5. Check your answers using the answer key.',
      '6. Listen again to the questions you got wrong. When available, read the recording’s written transcript to find the words you missed.',
      '7. Write down the reason for each mistake.',
    ],
    regularTasks: [
      '1. Choose one Listening Part 1 section and one Part 4 section (where you fill in missing words in notes).',
      '2. Read the notes before playing the recording and guess what kind of word belongs in each blank.',
      '3. Play the recording once and write your answers.',
      '4. Check that your words are spelled correctly and check if any word needs an "-s" at the end.',
      '5. Check your answers using the answer key, then listen again to any question you missed.',
    ],
    advancedTasks: [
      '1. Complete Part 1 and Part 4 of a Listening practice test without pausing the recording.',
      '2. Pay close attention to plural endings ("-s"), spelling, and how the speaker uses different words with the same meaning as the notes.',
      '3. Check your answers using the answer key and transcript, and write down any words you spelled wrong.',
    ],
    whatYouNeed: 'One Listening practice section, its answer key, and a transcript if available.',
    stepByStepMethod: [
      'Check how many words you are allowed to write (such as "ONE WORD AND/OR A NUMBER").',
      'Before the recording starts, look at each blank and see if you need a number, a date, a place, or a normal word.',
      'Listen carefully in case the speaker says one answer first and then changes it.',
      'Check your spelling carefully when you finish.',
    ],
    completionMethod:
      'Read the questions before you press play, and listen once from start to finish.',
    reviewAndErrorAnalysis: [
      'Check your answers using the answer key.',
      'Listen again to the questions you got wrong and look at the transcript if you have one.',
      'Write down why you missed each answer (for example: missed a word, speaker changed their mind, or spelling mistake).',
    ],
    upgradeExample: {
      contextLabel: 'Example: When the Speaker Changes Their Answer',
      band6Sample:
        'The question asks for a meeting day. You hear the speaker first say "Tuesday" and you stop listening to that question.',
      band75Upgrade:
        'The speaker says "Tuesday," but then corrects themselves and says "Thursday." The correct answer is Thursday because that is the speaker’s final answer.',
      whyItWorks:
        'Speakers in IELTS Listening often say one detail and then change it. Keep listening until they finish the point.',
    },
    successCriteria: [
      'You should know which answers you missed and what you need to listen for next time.',
    ],
  },
  {
    module: 'listening',
    questionTypeTag: 'Listening · Multiple Choice & Matching',
    matchingWeaknessKeywords: [
      'Multiple-choice questions',
      'Matching questions',
      'Spelling, distractors, and losing track of the audio',
    ],
    foundationalTitle: 'Listening: Avoid Wrong Options in Multiple Choice',
    targetedTitle: 'Listening: Follow Conversations in Part 2 and Part 3',
    advancedTitle: 'Listening: Practise Part 2 and Part 3 Questions',
    primaryObjective:
      'Learn how to spot the wrong options that try to confuse you when two people are talking in a recording.',
    beginnerTasks: [
      '1. Choose one Listening practice section that has Multiple Choice (A, B, or C) or Matching questions.',
      '2. Read the questions before playing the recording and underline the main words.',
      '3. Play the recording and answer the questions.',
      '4. Check your answers using the answer key.',
      '5. Listen again to the questions you got wrong and read the transcript if one is available.',
      '6. Write down why the option you chose was wrong and why the correct answer is right.',
    ],
    regularTasks: [
      '1. Choose one Listening Part 2 or Part 3 section with Multiple Choice and Matching questions.',
      '2. Read the questions during the pause and underline important words like "now", "first", or "both agree".',
      '3. Play the recording once and cross out options as you hear the speakers reject them.',
      '4. Check your answers using the answer key and transcript, and note down what confused you.',
    ],
    advancedTasks: [
      '1. Complete both Part 2 and Part 3 of a Listening practice test without pausing the audio.',
      '2. Keep your eyes on the next question as you listen so you do not lose your place.',
      '3. Check your answers with the answer key and transcript, and review every wrong option that tried to trick you.',
    ],
    whatYouNeed: 'One Listening practice section, its answer key, and a transcript if available.',
    stepByStepMethod: [
      'Read the question before the recording starts.',
      'Remember that the speaker will often mention words from all three options (A, B, and C). Do not pick an option just because you hear one word from it.',
      'Listen for words like "but", "however", or "not anymore" that show an option is wrong.',
    ],
    completionMethod:
      'Play the recording once to answer the questions, then replay any part you got wrong while reading the transcript.',
    reviewAndErrorAnalysis: [
      'Check the questions you got wrong using the answer key.',
      'Find the exact sentence in the recording or transcript where the speaker gave the real answer.',
    ],
    upgradeExample: {
      contextLabel: 'Example: Two Speakers Deciding Together',
      band6Sample:
        'Question: "What will the students work on first?" — The first student says: "Let’s start with the book review." (Wrong if you stop listening here.)',
      band75Upgrade:
        'The second student replies: "We should finish the interview questions first," and the first student says: "Yes, let’s do that." The answer is the interview questions.',
      whyItWorks:
        'When two people are talking, wait to hear what they finally agree on.',
    },
    successCriteria: [
      'You should understand why each wrong option did not match what the speakers decided.',
    ],
  },
  {
    module: 'listening',
    questionTypeTag: 'Listening · Maps & Plans',
    matchingWeaknessKeywords: ['Map and diagram labelling'],
    foundationalTitle: 'Listening: Follow Directions on a Map',
    targetedTitle: 'Listening: Label Maps and Floor Plans Step by Step',
    advancedTitle: 'Listening: Practise Map and Diagram Questions',
    primaryObjective:
      'Learn how to follow directions on a map or plan without losing track of the speaker.',
    beginnerTasks: [
      '1. Choose one Listening Part 2 exercise that has a map or floor plan.',
      '2. Before playing the recording, find the starting point on the map (such as "Entrance" or "You are here") and circle it.',
      '3. Read all the place names that are already written on the map.',
      '4. Play the recording and move your pencil on the map to follow the speaker’s directions.',
      '5. Check your answers using the answer key.',
      '6. Listen again while looking at the map and write down any direction words you missed (like "opposite", "next to", or "past the bridge").',
    ],
    regularTasks: [
      '1. Choose one Listening Part 2 section with a map, plan, or diagram.',
      '2. Circle the starting point and check Left/Right or North/South/East/West before the audio begins.',
      '3. Play the recording once and answer the questions.',
      '4. Check your answers using the answer key and write down useful direction phrases in your notebook.',
    ],
    advancedTasks: [
      '1. Complete a full Listening Part 2 section with map or diagram questions under normal test conditions.',
      '2. Check your answers with the answer key and transcript, and review any direction phrase that confused you.',
    ],
    whatYouNeed: 'One Listening map or plan exercise, its answer key, and a notebook.',
    stepByStepMethod: [
      'Circle the starting point on the map before the recording starts.',
      'Look at the labels already printed on the map (like "Road", "Cafe", or "Trees"). The speaker will use these names to guide you.',
      'Move your pencil tip on the map as the speaker talks so you always know where you are.',
    ],
    completionMethod:
      'Look over the map first, then follow the speaker’s voice with your pencil on the page.',
    reviewAndErrorAnalysis: [
      'Check your answers using the answer key.',
      'Replay the recording while looking at the map so you can see the exact path to any answer you missed.',
    ],
    successCriteria: [
      'You should have the map completed and a short list of direction words in your notebook.',
    ],
  },

  // ================= WRITING LESSONS =================
  {
    module: 'writing',
    questionTypeTag: 'Writing Task 2 · Planning Your Answer',
    matchingWeaknessKeywords: [
      'Task 2: understanding the prompt, planning, developing arguments, and writing relevant examples',
      'Task Response / Task Achievement',
    ],
    foundationalTitle: 'Writing Task 2: Understand the Question Before You Write',
    targetedTitle: 'Writing Task 2: Plan Your Ideas and Write a Clear Introduction',
    advancedTitle: 'Writing Task 2: Plan Clear Arguments and Introductions',
    primaryObjective:
      'Learn how to understand an IELTS essay question, plan two clear ideas, and write a simple introduction.',
    beginnerTasks: [
      '1. Find one IELTS Writing Task 2 question.',
      '2. Read it carefully and underline the main topic.',
      '3. Identify exactly what the question asks you to do. Does it ask for your opinion, both sides of an argument, or the causes and solutions of a problem?',
      '4. Write down your main answer in one sentence.',
      '5. Write two main ideas that support your answer.',
      '6. Add one simple example to support each idea.',
      '7. Check that all your ideas answer the question.',
    ],
    regularTasks: [
      '1. Find two IELTS Writing Task 2 questions.',
      '2. For each question, write down your main opinion and two supporting ideas with a simple example for each.',
      '3. Write a short 2-sentence introduction for each question: Sentence 1 explains the topic in your own words; Sentence 2 gives your clear answer.',
      '4. Read your introductions and check that they answer the question directly without using memorised phrases.',
    ],
    advancedTasks: [
      '1. Choose two different Writing Task 2 questions (for example, an opinion question and a "Discuss both views" question).',
      '2. Spend 4 minutes writing a clear plan for each question, then write the introduction and first body paragraph.',
      '3. Check that your opinion is clear from the start and every idea directly answers the question.',
    ],
    whatYouNeed: 'One Task 2 question and a notebook.',
    stepByStepMethod: [
      'Read the essay question twice so you do not miss any part of it.',
      'Decide your main opinion before you start writing.',
      'Choose two simple ideas that are easy for you to explain in English.',
      'When writing your introduction, use plain, natural English instead of memorised phrases like "In this modern era".',
    ],
    completionMethod:
      'You do not need to write a full essay when practising planning. Focus on making sure your opinion and two ideas are clear and answer the question.',
    reviewAndErrorAnalysis: [
      'Read the question again and check your plan.',
      'Ask yourself: Does Idea 1 and Idea 2 directly answer what the question asked?',
      'Check that your examples are simple, real-life examples (never make up fake survey numbers).',
    ],
    upgradeExample: {
      contextLabel: 'Example Question & Simple Plan',
      band6Sample:
        'Question: "Some people believe that students should study online instead of going to school. To what extent do you agree or disagree?"',
      band75Upgrade:
        'My opinion: Online learning is useful, but schools are still important.\n• Idea 1: Students can learn from home and save travel time.\n• Idea 2: Students at school can talk to teachers and learn with classmates.',
      whyItWorks:
        'Planning two simple ideas before you write keeps your essay clear and stops you from getting stuck halfway through.',
    },
    successCriteria: [
      'You should have one clear opinion and two ideas with simple examples to support it.',
    ],
  },
  {
    module: 'writing',
    questionTypeTag: 'Writing Task 2 · Writing Clear Paragraphs',
    matchingWeaknessKeywords: [
      'Task 2: understanding the prompt, planning, developing arguments, and writing relevant examples',
      'Task Response / Task Achievement',
      'Coherence and Cohesion',
    ],
    foundationalTitle: 'Writing Task 2: Organise Your Ideas and Connect Your Sentences',
    targetedTitle: 'Writing Task 2: Write Clear Main Paragraphs with Examples',
    advancedTitle: 'Writing Task 2: Write a Complete, Well-Organised Essay',
    primaryObjective:
      'Learn how to turn your plan into clear paragraphs where each sentence connects naturally to the next.',
    beginnerTasks: [
      '1. Look at the Task 2 question and plan you made earlier (or choose one new Task 2 question and write a quick 2-idea plan).',
      '2. Write your first main body paragraph using 4 clear sentences: (Sentence 1) State your first main idea. (Sentences 2 & 3) Explain why this idea is true. (Sentence 4) Give one simple example.',
      '3. Write your second main body paragraph following the same steps for your second idea.',
      '4. Write a short 2-sentence conclusion that repeats your main opinion in different words.',
      '5. Read your paragraphs aloud and fix any grammar or spelling mistakes you notice.',
    ],
    regularTasks: [
      '1. Find one IELTS Writing Task 2 question.',
      '2. Spend 4 minutes writing a simple plan (your opinion + 2 main ideas + examples).',
      '3. Write a complete 4-paragraph essay (at least 250 words: Introduction, Body Paragraph 1, Body Paragraph 2, and Conclusion).',
      '4. Read your essay carefully and check the self-check list below.',
    ],
    advancedTasks: [
      '1. Choose one unseen Writing Task 2 question and write a complete essay (at least 250 words) in one sitting.',
      '2. Check how you connect your sentences: avoid starting every sentence with "Firstly", "Secondly", "Moreover", and "Furthermore".',
      '3. Choose your weakest paragraph and rewrite it so your explanation is clearer.',
    ],
    whatYouNeed: 'One Task 2 question and paper or a document for writing.',
    stepByStepMethod: [
      'Put only ONE main idea in each body paragraph so your writing is easy to follow.',
      'Start the paragraph with a clear first sentence that states your main idea.',
      'Explain why that idea happens, and then give a simple real-life example.',
      'Connect your sentences naturally with words like "This means that...", "Because of this...", or "For example,...".',
    ],
    completionMethod:
      'Use 4 clear paragraphs (Introduction, Main Idea 1, Main Idea 2, Conclusion) and leave a blank line between paragraphs.',
    reviewAndErrorAnalysis: [
      'Check that you answered all parts of the question.',
      'Check that each body paragraph explains one main idea and includes a clear example.',
      'Underline any sentence that feels confusing or too long, and rewrite it more simply.',
    ],
    upgradeExample: {
      contextLabel: 'Example: Explaining an Idea Step by Step',
      band6Sample:
        'Weak paragraph: "Firstly, public transport is good. Moreover, people can go to work fast. Furthermore, it reduces traffic." (Just a list of short sentences.)',
      band75Upgrade:
        'Clear paragraph: "Good buses and trains help a city because they save workers time every day. When people can travel to work easily without sitting in traffic, they arrive on time and feel less tired. In busy cities like Dhaka, for example, new metro lines help thousands of office workers travel much faster than by car."',
      whyItWorks:
        'Instead of listing short points with "Firstly, Moreover, Furthermore", it explains one idea clearly and gives a real example.',
    },
    successCriteria: [
      'You should have well-organised paragraphs that explain your ideas clearly and use simple examples.',
    ],
  },
  {
    module: 'writing',
    questionTypeTag: 'Writing Task 1 (Academic) · Charts & Graphs',
    matchingWeaknessKeywords: [
      'Task 1: understanding the question and selecting key features',
      'Task 1: overview, comparisons, data reporting, or process and map descriptions',
      'Task Response / Task Achievement',
    ],
    academicOnly: true,
    foundationalTitle: 'Writing Task 1: Describe a Chart',
    targetedTitle: 'Writing Task 1: Write a Clear Overview and Compare Figures',
    advancedTitle: 'Writing Task 1: Describe Charts, Tables, Maps, and Processes',
    primaryObjective:
      'Learn how to describe the main information in an IELTS Academic chart, graph, table, or diagram clearly.',
    beginnerTasks: [
      '1. Find one IELTS Academic Writing Task 1 bar chart or line graph.',
      '2. Read the title and labels to understand what the chart shows.',
      '3. Find two or three important things you notice. Look for the highest and lowest figures, large changes, or important differences.',
      '4. Write one or two sentences explaining the main points.',
      '5. Add a few sentences comparing the figures.',
      '6. Check that your sentences describe what the chart actually shows.',
      '7. Correct any spelling or grammar mistakes you notice.',
    ],
    regularTasks: [
      '1. Find one IELTS Academic Writing Task 1 chart, graph, or table.',
      '2. Look for the 2 or 3 biggest trends (what went up, what went down, and what was highest or lowest).',
      '3. Write a complete report (at least 150 words) using 4 short paragraphs: (1) One sentence saying what the chart shows, (2) An "Overall," paragraph describing the main trends without numbers, and (3 & 4) Two paragraphs comparing the important figures.',
      '4. Check your tense (past vs present) and fix any spelling or grammar mistakes.',
    ],
    advancedTasks: [
      '1. Choose one Academic Writing Task 1 chart, table, map, or process diagram.',
      '2. Write a complete 160–185 word report in one sitting.',
      '3. Check that your "Overall," paragraph sums up the main points clearly and your detail paragraphs compare figures rather than listing numbers one by one.',
    ],
    whatYouNeed: 'One Academic Task 1 chart and paper or a document for writing.',
    stepByStepMethod: [
      'Read the chart title, axes, and units (such as % or millions) carefully before writing.',
      'Write a short paragraph starting with "Overall," to explain the 2 or 3 biggest changes or differences in the chart.',
      'Group similar items together and compare them using simple words like "while", "whereas", "higher than", or "increased from X to Y".',
      'Do not give your personal opinion in Task 1—only describe what the chart shows.',
    ],
    completionMethod:
      'Focus on describing the main points and comparing the numbers clearly rather than trying to use complicated words.',
    reviewAndErrorAnalysis: [
      'Check that your sentences match the numbers on the chart.',
      'Check that you included a clear "Overall," paragraph explaining the main points.',
      'Check that you used the past tense (such as "rose" and "fell") if the chart shows past years.',
    ],
    upgradeExample: {
      contextLabel: 'Example: Comparing Numbers Clearly',
      band6Sample:
        'A chart shows that bus use went from 20% to 35%, and car use went from 60% to 45%.',
      band75Upgrade:
        'You can write: "Overall, bus use increased over the period, while car use went down. Specifically, bus use rose from 20% to 35%, whereas car use fell from 60% to 45%."',
      whyItWorks:
        'The goal is to describe the main changes and compare the numbers clearly in simple, accurate English.',
    },
    successCriteria: [
      'You should have a clear description of the chart’s main points and important changes.',
    ],
  },
  {
    module: 'writing',
    questionTypeTag: 'Writing Task 1 (General) · Writing a Letter',
    matchingWeaknessKeywords: [
      'Task 1: understanding the letter prompt, tone (formal/semi-formal/informal), and bullet coverage',
      'Task 1: opening purpose, developing bullet points naturally, and appropriate sign-off',
      'Task Response / Task Achievement',
    ],
    generalOnly: true,
    foundationalTitle: 'Writing Task 1: Write a Clear Letter',
    targetedTitle: 'Writing Task 1: Answer All Three Bullet Points in a Letter',
    advancedTitle: 'Writing Task 1: Write Formal and Informal Letters Smoothly',
    primaryObjective:
      'Learn how to write a clear General Training Task 1 letter that answers all three bullet points in the right tone.',
    beginnerTasks: [
      '1. Find one IELTS General Training Writing Task 1 letter question.',
      '2. Read the question and see who you are writing to (a friend, or someone you do not know like a manager or company).',
      '3. Look at the three bullet points in the question and write one or two ideas for each bullet point.',
      '4. Write your letter (at least 150 words), using one short paragraph for each of the three bullet points.',
      '5. Check that your greeting and ending match the person you are writing to.',
      '6. Read your letter and fix any spelling or grammar mistakes you find.',
    ],
    regularTasks: [
      '1. Find one General Training Writing Task 1 letter question.',
      '2. Decide whether the letter needs a friendly tone (to a friend) or a polite formal tone (to a company or manager).',
      '3. Write a complete letter of at least 150 words covering all three bullet points in separate paragraphs.',
      '4. Check your letter to make sure every bullet point is explained clearly.',
    ],
    advancedTasks: [
      '1. Choose one Formal letter question and one Informal letter question.',
      '2. Write a complete 165-word letter for the first question in one sitting, and write a detailed plan for the second question.',
      '3. Check that your tone is consistent from the greeting to the sign-off.',
    ],
    whatYouNeed: 'One General Training Task 1 letter question and paper or a document for writing.',
    stepByStepMethod: [
      'If the letter is to a friend, use a friendly style ("Dear Sam," ... "Best wishes,"). If it is to a company or person you do not know, use a polite formal style ("Dear Sir or Madam," ... "Yours faithfully,").',
      'In your first sentence, say clearly why you are writing the letter.',
      'Write one separate short paragraph for each of the three bullet points in the question.',
    ],
    completionMethod:
      'Make sure you answer all three bullet points clearly and write at least 150 words.',
    reviewAndErrorAnalysis: [
      'Check that you answered all three bullet points.',
      'Check that your greeting and ending match the right style (formal vs friendly).',
      'Correct any spelling or grammar mistakes you notice.',
    ],
    successCriteria: [
      'You should have a complete letter that covers all three bullet points clearly.',
    ],
  },
  {
    module: 'writing',
    questionTypeTag: 'Writing · Useful Words & Correct Sentences',
    matchingWeaknessKeywords: [
      'Lexical Resource',
      'Grammatical Range and Accuracy',
    ],
    foundationalTitle: 'Writing: Learn Useful Words and Practise Writing Correct Sentences',
    targetedTitle: 'Writing: Fix Common Grammar Mistakes in Your Essays',
    advancedTitle: 'Writing: Write Clear, Accurate Sentences Without Mistakes',
    primaryObjective:
      'Learn how to spot and fix common grammar mistakes and use clear, natural words in your writing.',
    beginnerTasks: [
      '1. Look at a paragraph or essay you wrote recently (or write one new paragraph on a familiar topic like education, work, or health).',
      '2. Read your sentences one by one and check for common mistakes: missing "a / an / the", singular vs plural words ("one student is", "many students are"), and spelling.',
      '3. Check that you did not add an "-s" to words that never take a plural "-s" in English, such as "information", "advice", "homework", "equipment", or "traffic".',
      '4. Choose 4 sentences from your writing and rewrite them so they are clearer and 100% correct.',
      '5. Write down 5 useful word pairs (such as "public transport", "healthy diet", or "save time") in your notebook.',
    ],
    regularTasks: [
      '1. Take an essay you wrote earlier (or write two paragraphs on a new Task 2 question).',
      '2. Check every sentence for grammar mistakes, especially verb tenses, singular/plural verbs, and missing articles ("a", "an", "the").',
      '3. Practice joining two short ideas together using words like "because", "although", "if", or "while".',
      '4. Rewrite 5 sentences from your work to fix any mistakes and make the meaning clearer.',
    ],
    advancedTasks: [
      '1. Write a full Task 2 essay or review your most recent full essay.',
      '2. Spend 5 minutes checking every sentence for grammar accuracy and natural word choice.',
      '3. Rewrite your 5 weakest sentences so they are completely clear, natural, and free of mistakes.',
    ],
    whatYouNeed: 'Your notebook and your previous writing practice.',
    stepByStepMethod: [
      'You do not need difficult dictionary words to get a good score in IELTS Writing. Using clear words correctly is much better than using big words in the wrong way.',
      'Watch out for words that never have an "-s" at the end: write "useful information" and "good advice" (never "informations" or "advices").',
      'Keep your sentences at a sensible length (around 15 to 25 words). If a sentence is 4 lines long, split it into two clearer sentences.',
    ],
    completionMethod:
      'Read your writing slowly aloud—when you read aloud, it is much easier to hear where a word is missing or a sentence sounds strange.',
    reviewAndErrorAnalysis: [
      'Write down the 2 or 3 grammar mistakes you make most often in your notebook.',
      'Next time you write an essay, check for those exact mistakes at the end.',
    ],
    upgradeExample: {
      contextLabel: 'Example: Clear and Correct Sentences',
      band6Sample:
        'With mistakes: "Government should give more informations to peoples about healthy food, because it is very good for health."',
      band75Upgrade:
        'Corrected: "Governments should give people clear information about healthy food because a balanced diet prevents many illnesses."',
      whyItWorks:
        'Fixing "informations" and "peoples" and using simple, natural words ("balanced diet", "prevents many illnesses") immediately raises your score.',
    },
    successCriteria: [
      'You should have 4 to 5 rewritten sentences with all grammar and spelling mistakes corrected.',
    ],
  },

  // ================= SPEAKING LESSONS =================
  {
    module: 'speaking',
    questionTypeTag: 'Speaking Part 1 · Everyday Questions',
    matchingWeaknessKeywords: [
      'Part 1 answers and extending responses naturally',
      'Fluency and Coherence',
    ],
    foundationalTitle: 'Speaking: Give Better Answers in Part 1',
    targetedTitle: 'Speaking Part 1: Answer Clearly with a Reason or Example',
    advancedTitle: 'Speaking Part 1: Speak Smoothly and Naturally',
    primaryObjective:
      'Learn how to give clear, natural 2-to-3 sentence answers instead of replying with only one or two words.',
    beginnerTasks: [
      '1. Find five common IELTS Speaking Part 1 questions about topics such as your hometown, hobbies, studies, or food.',
      '2. Answer each question aloud.',
      '3. For every answer, give your main answer and then add a reason or a simple example.',
      '4. Record yourself answering the questions on your phone.',
      '5. Listen to the recording.',
      '6. Check whether you answered each question properly and whether your meaning was clear.',
      '7. Choose your two weakest answers and try answering them again.',
    ],
    regularTasks: [
      '1. Find 6 to 8 Speaking Part 1 questions on two everyday topics (such as work/studies, daily routine, weather, or reading).',
      '2. Record yourself on your phone answering each question aloud in 2 to 3 sentences (main answer + reason + short example).',
      '3. Listen to your recording and check if you paused for a long time or gave answers that were too short.',
      '4. Answer your 3 weakest questions again aloud to make them smoother.',
    ],
    advancedTasks: [
      '1. Choose 8 Speaking Part 1 questions across two or three topics and record yourself answering them straight through without stopping.',
      '2. Listen back to check that your answers sound natural, conversational, and clear.',
      '3. Re-record any answer where you hesitated or repeated the same words.',
    ],
    whatYouNeed: 'Five to eight Speaking Part 1 questions and a phone to record yourself.',
    stepByStepMethod: [
      'Do not reply with only "Yes" or "No".',
      'First, give a clear direct answer to the question.',
      'Second, add one sentence explaining why ("because...") or giving a simple example from your life ("for example, last week I...").',
      'Use words you already know well so you can speak without stopping.',
    ],
    completionMethod:
      'Speak aloud and record yourself on your phone—do not write down memorised speeches to read aloud.',
    reviewAndErrorAnalysis: [
      'Listen to your recording.',
      'Check if your answer was clear and easy to understand.',
      'Try answering your weakest two questions one more time.',
    ],
    upgradeExample: {
      contextLabel: 'Example Question: "Do you enjoy reading?"',
      band6Sample:
        'A very short answer: "Yes, I do."',
      band75Upgrade:
        'A more developed answer: "Yes, I enjoy reading because it helps me learn new things. I usually read about technology and science in the evening."',
      whyItWorks:
        'You do not need to memorise fancy answers. Simply add a reason and a small detail from your own life.',
    },
    successCriteria: [
      'You should have recorded your spoken answers and practised a better version of your weakest answers.',
    ],
  },
  {
    module: 'speaking',
    questionTypeTag: 'Speaking Part 2 · 2-Minute Topic Card',
    matchingWeaknessKeywords: [
      'Part 2 cue-card organization and idea development',
      'Fluency and Coherence',
    ],
    foundationalTitle: 'Speaking Part 2: Plan and Speak About a Topic for Two Minutes',
    targetedTitle: 'Speaking Part 2: Keep Speaking Smoothly Without Running Out of Ideas',
    advancedTitle: 'Speaking Part 2: Tell Clear, Engaging 2-Minute Stories',
    primaryObjective:
      'Learn how to use your 1 minute of preparation time to make simple notes and speak about a topic for up to two minutes.',
    beginnerTasks: [
      '1. Find one IELTS Speaking Part 2 topic card (for example: describe a person, a place you visited, or a useful gift).',
      '2. Set a timer for 1 minute and write down 6 to 8 simple key words on paper to help you remember what to say (who/where, what happened, and why you remember it).',
      '3. Speak about the topic for up to 2 minutes and record yourself on your phone.',
      '4. Listen to your recording.',
      '5. Check whether your answer is clear, stays on topic, and uses the right tense (such as past tense for a past story).',
      '6. Try speaking about the same topic card a second time to see how much smoother it sounds.',
    ],
    regularTasks: [
      '1. Find two Speaking Part 2 topic cards.',
      '2. For each card, take 1 minute to write a few key words on paper, then record yourself speaking for up to 2 minutes on your phone.',
      '3. Listen to both recordings and check where you paused or ran out of things to say.',
      '4. Repeat the harder topic card once more aloud, adding a short example or story to reach the full 2 minutes.',
    ],
    advancedTasks: [
      '1. Choose two unseen Speaking Part 2 topic cards.',
      '2. Use strictly 1 minute to plan your notes and record yourself speaking for a full 2 minutes on each card.',
      '3. Listen back to check your past-tense verbs, clear pronunciation, and smooth transitions between ideas, then re-record one topic.',
    ],
    whatYouNeed: 'One or two Speaking Part 2 topic cards, a notebook for short notes, and a phone to record yourself.',
    stepByStepMethod: [
      'In Part 2, the examiner gives you a topic card and 1 minute to write short notes before you speak for up to 2 minutes.',
      'During the 1 minute, do NOT write full sentences. Just write key words for: (1) Background, (2) What happened / Main details, and (3) How you felt and why.',
      'If you finish the points on the card after 1 minute, tell a short story or example connected to the topic so you keep speaking.',
    ],
    completionMethod:
      'Use 1 minute for notes, then record yourself speaking aloud on your phone.',
    reviewAndErrorAnalysis: [
      'Listen to your recording.',
      'Check if you spoke for close to 2 minutes or stopped too early.',
      'If your topic was about the past, check if you used past tense verbs (like "went", "saw", and "helped").',
    ],
    upgradeExample: {
      contextLabel: 'Example: Making Simple 1-Minute Notes',
      band6Sample:
        'Trying to write full sentences during the 1-minute prep time, running out of time after writing only one sentence, and then getting stuck while speaking.',
      band75Upgrade:
        'Writing short notes in 3 steps:\n• Who/When: My uncle · gave me a watch · high school exam\n• Details: Wore it every day · helped me manage time\n• Why special: Reminds me of his support · still keep it safe',
      whyItWorks:
        'Short key words take only 30 seconds to write and give you a clear path to follow for the whole 2 minutes.',
    },
    successCriteria: [
      'You should have 1-minute notes and a recorded Part 2 answer that you practised twice.',
    ],
  },
  {
    module: 'speaking',
    questionTypeTag: 'Speaking Part 3 · Sharing Opinions',
    matchingWeaknessKeywords: [
      'Part 3 abstract questions and deeper explanations',
      'Lexical Resource',
      'Grammatical Range and Accuracy',
      'Pronunciation and intelligibility',
    ],
    foundationalTitle: 'Speaking Part 3: Share Your Opinion, Compare Ideas, and Speak Naturally',
    targetedTitle: 'Speaking Part 3: Explain Your Ideas with General Examples',
    advancedTitle: 'Speaking Part 3: Answer Discussion Questions Clearly and Confidently',
    primaryObjective:
      'Learn how to answer general discussion questions in Part 3 by giving your opinion, explaining why, and giving an example.',
    beginnerTasks: [
      '1. Find four IELTS Speaking Part 3 discussion questions.',
      '2. Answer each question aloud and record yourself on your phone.',
      '3. In each answer, follow three simple steps: (1) Say what you think, (2) Explain why, and (3) Give an example about people in general (such as students, parents, or workers).',
      '4. Listen to your recording.',
      '5. Check whether your meaning was clear and whether you spoke at a comfortable, natural speed.',
      '6. Choose two questions and answer them again to make your explanation clearer.',
    ],
    regularTasks: [
      '1. Find five Speaking Part 3 questions.',
      '2. Record yourself answering all five questions aloud on your phone.',
      '3. Practice talking about people in general (for example, comparing young people and older people) rather than only telling stories about yourself.',
      '4. Listen to your recording, write down one of your answers on paper, improve two sentences, and say it aloud again.',
    ],
    advancedTasks: [
      '1. Choose six Speaking Part 3 questions and record yourself answering them aloud without pausing.',
      '2. Listen to your recording and write down two of your answers word for word.',
      '3. Check your grammar and word choice, improve any weak sentences, and record those two answers again.',
    ],
    whatYouNeed: 'Four to six Speaking Part 3 questions and a phone to record yourself.',
    stepByStepMethod: [
      'In Part 3, the examiner asks general questions about society, education, work, or daily life.',
      'Step 1: Give your opinion clearly ("I think...", "In my view,...").',
      'Step 2: Explain why you think that ("because...", "the main reason is...").',
      'Step 3: Give a general example or compare two groups ("For example, many young people..., whereas older people...").',
    ],
    completionMethod:
      'Speak at a calm, steady speed and use words you know how to use naturally.',
    reviewAndErrorAnalysis: [
      'Listen to your recording.',
      'Check if you explained the reason behind your opinion.',
      'Check if you spoke clearly without rushing.',
    ],
    upgradeExample: {
      contextLabel: 'Example Question: "Why do many people prefer working from home?"',
      band6Sample:
        'Too short / too personal: "Because my brother works from home and he likes waking up late."',
      band75Upgrade:
        'Clear Part 3 answer: "I think the main reason is that working from home saves a lot of travel time and money. In big cities, office workers often spend two hours a day stuck in traffic. When they work from home, they can use that extra time to rest or spend time with their families."',
      whyItWorks:
        'It gives a clear reason and talks about people in general ("office workers in big cities") instead of only talking about one family member.',
    },
    successCriteria: [
      'You should have recorded your Part 3 answers and re-practised two of them after listening back.',
    ],
  },
];

// ============================================================================
// SIMPLE, REALISTIC STUDY PLAN BUILDER ENGINE
// ============================================================================

function parseBand(val: string, fallback: number): number {
  if (!val || val.trim() === '') return fallback;
  const n = parseFloat(val);
  if (Number.isNaN(n) || n < 3.0 || n > 9.0) return fallback;
  return Math.round(n * 2) / 2;
}

export function calculateDaysUntilExam(examDateStr?: string): number | null {
  if (!examDateStr || examDateStr.trim() === '') return null;
  const parts = examDateStr.trim().split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [year, month, day] = parts;
  const examLocal = new Date(year, month - 1, day);
  examLocal.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((examLocal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return null;
  return Math.max(1, Math.min(120, diffDays));
}

export function buildDeterministicStudyPlan(input: StudyPlanQuestionnaireInput): GeneratedStudyPlan {
  const examDaysRemaining = calculateDaysUntilExam(input.examDate);
  const durationDays =
    examDaysRemaining !== null
      ? examDaysRemaining
      : Math.max(1, Math.min(120, Math.round(input.durationDays || 30)));
  const daysPerWeek = Math.max(2, Math.min(7, Math.round(input.daysPerWeek || 6)));
  const isBeginner =
    input.prepStatus === 'beginner' ||
    (!input.currentOverallBand &&
      !input.currentListeningBand &&
      !input.currentReadingBand &&
      !input.currentWritingBand &&
      !input.currentSpeakingBand);

  const targetOverall = parseBand(input.targetOverallBand, 7.0);
  const currentOverall = isBeginner ? 5.5 : parseBand(input.currentOverallBand, 6.0);

  const lCurrent = parseBand(input.currentListeningBand, currentOverall);
  const rCurrent = parseBand(input.currentReadingBand, currentOverall);
  const wCurrent = parseBand(input.currentWritingBand, Math.max(5.0, currentOverall - 0.5));
  const sCurrent = parseBand(input.currentSpeakingBand, currentOverall);

  const lTarget = parseBand(input.targetListeningBand, targetOverall);
  const rTarget = parseBand(input.targetReadingBand, targetOverall);
  const wTarget = parseBand(input.targetWritingBand, targetOverall);
  const sTarget = parseBand(input.targetSpeakingBand, targetOverall);

  // Calculate module priority weighting based on score gap and selected trouble spots
  const moduleGaps: Record<ModuleId, number> = {
    listening: Math.max(0.5, lTarget - lCurrent) + input.listeningWeaknesses.length * 0.25,
    reading: Math.max(0.5, rTarget - rCurrent) + input.readingWeaknesses.length * 0.25,
    writing: Math.max(0.5, wTarget - wCurrent) + input.writingWeaknesses.length * 0.3 + 0.25,
    speaking: Math.max(0.5, sTarget - sCurrent) + input.speakingWeaknesses.length * 0.25 + 0.15,
  };

  if (input.focusPreference === 'balanced') {
    moduleGaps.listening = 1.0 + (input.listeningWeaknesses.length > 0 ? 0.2 : 0);
    moduleGaps.reading = 1.0 + (input.readingWeaknesses.length > 0 ? 0.2 : 0);
    moduleGaps.writing = 1.1 + (input.writingWeaknesses.length > 0 ? 0.2 : 0);
    moduleGaps.speaking = 1.0 + (input.speakingWeaknesses.length > 0 ? 0.2 : 0);
  }

  const totalWeight =
    moduleGaps.listening + moduleGaps.reading + moduleGaps.writing + moduleGaps.speaking;

  const rawPercents = {
    listening: Math.round((moduleGaps.listening / totalWeight) * 100),
    reading: Math.round((moduleGaps.reading / totalWeight) * 100),
    writing: Math.round((moduleGaps.writing / totalWeight) * 100),
    speaking: 0,
  };
  rawPercents.speaking = Math.max(
    15,
    100 - (rawPercents.listening + rawPercents.reading + rawPercents.writing)
  );

  const sortedModules = (['writing', 'reading', 'speaking', 'listening'] as ModuleId[]).sort(
    (a, b) => moduleGaps[b] - moduleGaps[a]
  );
  const primaryBottleneckModule: ModuleId = sortedModules[0];

  // Note when exam date automatically set the number of days
  let examDateConflictNote: string | null = null;
  if (input.examDate && examDaysRemaining !== null) {
    examDateConflictNote = `Your exam date is ${input.examDate}, so we built a ${durationDays}-day study plan covering the exact days remaining until your test.`;
  }

  // Honest, friendly note if target band jump is large
  const bandJump = targetOverall - currentOverall;
  let ambitiousTargetWarning: string | null = null;
  if (!isBeginner && bandJump >= 1.5 && durationDays <= 30) {
    ambitiousTargetWarning = `A friendly note about your goal: Moving from Band ${currentOverall.toFixed(1)} to Band ${targetOverall.toFixed(1)} in ${durationDays} days is a big step. No study plan can promise a guaranteed score in a short time. Take it one day at a time, focus on understanding why you get answers wrong, and practise your weak areas steadily.`;
  } else if (!isBeginner && bandJump >= 2.0 && durationDays <= 60) {
    ambitiousTargetWarning = `A friendly note about your goal: Raising your score by ${bandJump.toFixed(1)} bands takes regular practice and patience. Focus on completing each day’s steps carefully rather than rushing through practice tests.`;
  }

  const realisticExpectationNote = isBeginner
    ? `Welcome to your ${durationDays}-day IELTS study plan! You do not need to do everything at once. Each day gives you one clear, manageable task in simple English so you can learn the test step by step.`
    : `Here is your ${durationDays}-day study plan for ${
        input.testType === 'academic' ? 'IELTS Academic' : 'IELTS General Training'
      } (Target Band ${targetOverall.toFixed(
        1
      )}). Each day focuses on one main skill, shows you how to check your answers, and helps you improve step by step.`;

  // Stage boundaries based on durationDays
  const p1End = Math.min(durationDays, Math.max(1, Math.round(durationDays * 0.25)));
  const p2End = Math.min(durationDays, Math.max(p1End + 1, Math.round(durationDays * 0.6)));
  const p3End = Math.min(durationDays, Math.max(p2End + 1, Math.round(durationDays * 0.85)));

  const phases: StudyPlanPhaseOverview[] = [
    {
      phaseIndex: 1,
      phaseName: 'Stage 1 · Understand the Test & Learn the Basics',
      dayRangeLabel: `Days 1–${p1End}`,
      focusSummary:
        'Learn how the IELTS test works, try key question types one by one, and start keeping notes on your mistakes.',
      keyMilestone: 'Understand the main question types and start your study notebook.',
    },
    {
      phaseIndex: 2,
      phaseName: 'Stage 2 · Practise the Areas You Find Difficult',
      dayRangeLabel: `Days ${p1End + 1}–${p2End}`,
      focusSummary: `Practise ${primaryBottleneckModule} and your other chosen areas step by step, checking why any answer is wrong.`,
      keyMilestone: 'Know how to approach your hardest question types and check your own work.',
    },
    {
      phaseIndex: 3,
      phaseName: 'Stage 3 · Build Confidence & Review Earlier Lessons',
      dayRangeLabel: `Days ${p2End + 1}–${p3End}`,
      focusSummary:
        'Practise full passages, full essays, and spoken answers while reviewing the lessons you studied earlier.',
      keyMilestone: 'Complete full practice exercises comfortably.',
    },
    {
      phaseIndex: 4,
      phaseName: 'Stage 4 · Practice Tests & Final Review',
      dayRangeLabel: `Days ${p3End + 1}–${durationDays}`,
      focusSummary:
        'Try full practice sections, review your mistakes carefully, and look over your notes calmly before your test.',
      keyMilestone: 'Understand what has improved and feel ready for test day.',
    },
  ];

  // Filter curriculum lessons by testType
  const applicableUnits = CURRICULUM_UNITS.filter((u) => {
    if (input.testType === 'academic' && u.generalOnly) return false;
    if (input.testType === 'general' && u.academicOnly) return false;
    return true;
  });

  const allSelectedWeaknesses = [
    ...input.listeningWeaknesses,
    ...input.readingWeaknesses,
    ...input.writingWeaknesses,
    ...input.speakingWeaknesses,
  ];

  const getUnitsForModule = (mod: ModuleId): CurriculumUnitTemplate[] => {
    const modUnits = applicableUnits.filter((u) => u.module === mod);
    return [...modUnits].sort((a, b) => {
      const aMatch = a.matchingWeaknessKeywords.some((kw) => allSelectedWeaknesses.includes(kw))
        ? 1
        : 0;
      const bMatch = b.matchingWeaknessKeywords.some((kw) => allSelectedWeaknesses.includes(kw))
        ? 1
        : 0;
      return bMatch - aMatch;
    });
  };

  // For beginners (or balanced mode), ensure the first week introduces Reading, Listening, Writing Task 2, Speaking Part 1, and Writing Task 1 gently before rotating by priority
  const moduleRotation: ModuleId[] = [];
  if (isBeginner || input.focusPreference === 'balanced') {
    moduleRotation.push('reading', 'listening', 'writing', 'speaking', 'writing');
  } else {
    moduleRotation.push(
      sortedModules[0],
      sortedModules[1],
      sortedModules[0],
      sortedModules[2],
      sortedModules[1],
      sortedModules[3]
    );
  }

  const moduleUnitCounters: Record<ModuleId, number> = {
    listening: 0,
    reading: 0,
    writing: 0,
    speaking: 0,
  };

  const days: StudyPlanDayTask[] = [];

  for (let d = 1; d <= durationDays; d++) {
    const phaseObj =
      d <= p1End
        ? phases[0]
        : d <= p2End
        ? phases[1]
        : d <= p3End
        ? phases[2]
        : phases[3];

    const dayOfWeekIndex = ((d - 1) % 7) + 1; // 1..7
    const isWeeklyReviewDay =
      (dayOfWeekIndex === 7 || dayOfWeekIndex > daysPerWeek) && d !== 1 && d !== durationDays;

    // =========================================================================
    // DAY 1: Understand IELTS and Find Out Your Starting Level (Light & Manageable)
    // =========================================================================
    if (d === 1) {
      days.push({
        dayNumber: 1,
        phaseIndex: 1,
        phaseName: phaseObj.phaseName,
        isConsolidationDay: false,
        title: isBeginner
          ? 'Understand IELTS and Find Out Your Starting Level'
          : 'Check Your Starting Level and Start Your Study Notebook',
        primaryModule: 'listening',
        questionTypeTag: 'Getting Started · Listening',
        primaryObjective:
          'Understand what the IELTS test looks like and find out which skills need the most practice.',
        specificStudyTasks: isBeginner
          ? [
              '1. Learn the basic format of IELTS. Find out what happens in Listening, Reading, Writing, and Speaking.',
              '2. Complete one short Listening practice section using a practice test you can access.',
              '3. Check your answers using the answer key.',
              '4. Write down the questions you got wrong. For each one, note the reason if you can. For example, you may have missed a word or misunderstood what the speaker said.',
              '5. Keep your results in a notebook so you can compare them with your later practice.',
            ]
          : [
              '1. Open a notebook to keep a simple record of your practice scores and the questions you get wrong.',
              '2. Complete one short Listening practice section using a practice test you can access.',
              '3. Check your answers using the answer key.',
              '4. Write down the questions you got wrong and note why each mistake happened (for example: missed a word, misunderstood the speaker, or made a spelling mistake).',
              '5. Keep your results in your notebook so you can compare them with your later practice.',
            ],
        practiceMaterial: 'An IELTS practice test, its answer key, and a notebook.',
        stepByStepMethod: [
          'Do not try to complete a full test on your first day. Start with one short Listening section.',
          'When you check your answers, look closely at the questions you missed instead of only looking at your score.',
          'Write down the reason for each mistake in simple words in your notebook.',
        ],
        completionMethod:
          'Work at a calm pace without worrying about the clock.',
        reviewAndErrorAnalysis: [
          'Check your answers using the answer key.',
          'Write down which questions you got wrong and why.',
        ],
        targetWeaknessAddressed: 'Understanding the IELTS test and starting your study notebook',
        successCriteria: [
          'You should know the four parts of IELTS and have a record of your first Listening practice.',
        ],
        nextDayBridge:
          'Tomorrow you will practise your first specific question type step by step.',
      });
      continue;
    }

    // =========================================================================
    // WEEKLY REVIEW DAY (e.g., Day 7, Day 14...) ORFinal Day (for 7-day plan)
    // =========================================================================
    if (isWeeklyReviewDay || (d === durationDays && durationDays <= 10)) {
      days.push({
        dayNumber: d,
        phaseIndex: phaseObj.phaseIndex,
        phaseName: phaseObj.phaseName,
        isConsolidationDay: true,
        title: 'Review What You Learned This Week',
        primaryModule: 'mixed',
        questionTypeTag: 'Weekly Review · All Skills',
        primaryObjective:
          'Review your work and find out what you need to practise next.',
        specificStudyTasks: [
          '1. Read your notes from the last six days.',
          '2. Choose the three things you found most difficult.',
          '3. Repeat one short Reading exercise and one short Listening exercise using suitable practice materials.',
          '4. Check your answers and compare them with your earlier results.',
          '5. Look at your Writing work from earlier this week. Choose three sentences and correct any mistakes you can find.',
          '6. Answer three Speaking questions again and compare your answers with your earlier recording.',
          '7. Write down three things you learned and two things you still find difficult.',
        ],
        practiceMaterial: 'Your notebook, previous answers, and practice materials.',
        stepByStepMethod: [
          'Look over your notebook first so you remember the mistakes you spotted earlier this week.',
          'Keep your practice exercises short today and focus on doing them more carefully than before.',
          'Remember, you do not need to be perfect after one week. The goal is to learn, practise, and improve step by step.',
        ],
        completionMethod:
          'Review your notes calmly and compare today’s work with your earlier practice.',
        reviewAndErrorAnalysis: [
          'Compare today’s answers with your earlier results.',
          'Write down three things that improved and two things you want to practise more.',
        ],
        targetWeaknessAddressed: 'Reviewing your progress and fixing mistakes from this week',
        successCriteria: [
          'You should understand what has improved, what still needs work, and which skills you should focus on next.',
        ],
        nextDayBridge:
          d === durationDays
            ? 'You have completed your study plan! Keep practising step by step.'
            : 'Tomorrow you will start the next week of practice.',
      });
      continue;
    }

    // =========================================================================
    // FINAL DAY FOR LONGER PLANS (Day N when durationDays > 10)
    // =========================================================================
    if (d === durationDays) {
      days.push({
        dayNumber: d,
        phaseIndex: 4,
        phaseName: phaseObj.phaseName,
        isConsolidationDay: false,
        title: 'Review Your Notes and Prepare Calmly for Your Test',
        primaryModule: 'mixed',
        questionTypeTag: 'Final Review · Test Readiness',
        primaryObjective:
          'Look over the lessons and mistakes in your notebook so you feel calm and ready.',
        specificStudyTasks: [
          '1. Do not start a heavy new practice test today.',
          '2. Read through your notebook and review the mistakes you made most often.',
          '3. Review the useful words and spellings you wrote down during your study plan.',
          '4. Read one or two of your best Writing answers and answer three easy Speaking Part 1 questions aloud.',
          '5. Write down three simple reminders for yourself for test day (for example: check word limits, plan your essay before writing, and never leave a blank answer).',
        ],
        practiceMaterial: 'Your notebook and your previous practice work.',
        stepByStepMethod: [
          'Keep today’s study light and calm so you feel rested.',
          'Focus on remembering the simple steps you already practised rather than trying to learn something brand new.',
        ],
        completionMethod: 'A short, calm review of your notebook.',
        reviewAndErrorAnalysis: [
          'Check that you have your three simple test-day reminders written down.',
        ],
        targetWeaknessAddressed: 'Staying calm and avoiding common mistakes on test day',
        successCriteria: [
          'You should feel clear on what to do in each part of the test and get a good night’s rest.',
        ],
        nextDayBridge:
          'You have completed your ' + durationDays + '-day study plan!',
      });
      continue;
    }

    // =========================================================================
    // STAGE 4 PRACTICE TEST + NEXT-DAY REVIEW PAIRS (For plans >= 14 days)
    // =========================================================================
    const isPhase4MockDay =
      durationDays >= 14 &&
      d > p3End &&
      d < durationDays - 1 &&
      (d - p3End) % 3 === 1 &&
      !isWeeklyReviewDay;
    const isPhase4ReviewDay =
      durationDays >= 14 &&
      d > p3End &&
      d < durationDays &&
      (d - p3End) % 3 === 2 &&
      days[days.length - 1]?.primaryModule === 'mock';

    if (isPhase4MockDay) {
      days.push({
        dayNumber: d,
        phaseIndex: phaseObj.phaseIndex,
        phaseName: phaseObj.phaseName,
        isConsolidationDay: false,
        title: 'Complete a Full Practice Test Section',
        primaryModule: 'mock',
        questionTypeTag: 'Practice Test · Listening, Reading & Writing',
        primaryObjective:
          'Practise completing Listening, Reading, and Writing under real test conditions.',
        specificStudyTasks: [
          '1. Choose one full IELTS practice test that you have not done before.',
          '2. Complete the Listening section and the Reading section without using a dictionary or pausing the recording.',
          '3. Complete Writing Task 1 and Writing Task 2.',
          '4. Check your Listening and Reading answers using the answer key and write your score in your notebook.',
          '5. Save the detailed review of your wrong answers for tomorrow.',
        ],
        practiceMaterial: 'One full IELTS practice test, its answer key, and your notebook.',
        stepByStepMethod: [
          'Work in a quiet place and put away your dictionary while doing the test.',
          'Always check how many words you can write in Listening and Reading blanks.',
          'Spend a few minutes planning your ideas before you start writing Task 2.',
        ],
        completionMethod:
          'Complete the test sections, record your score, and save the mistake review for tomorrow.',
        reviewAndErrorAnalysis: [
          'Count how many answers you got right in Listening and Reading.',
          'Circle the questions you got wrong so you can review them tomorrow.',
        ],
        targetWeaknessAddressed: 'Practising a full test sitting without dictionary help',
        successCriteria: [
          'You should have completed the practice test and recorded your score in your notebook.',
        ],
        nextDayBridge:
          'Tomorrow you will check the questions you got wrong and see why each mistake happened.',
      });
      continue;
    }

    if (isPhase4ReviewDay) {
      days.push({
        dayNumber: d,
        phaseIndex: phaseObj.phaseIndex,
        phaseName: phaseObj.phaseName,
        isConsolidationDay: false,
        title: 'Find Out Why Your Answers Were Wrong on Yesterday’s Test',
        primaryModule: 'mixed',
        questionTypeTag: 'Test Review · Check Your Mistakes',
        primaryObjective:
          'Check the questions you missed on yesterday’s practice test and improve your writing.',
        specificStudyTasks: [
          '1. Look at the Reading questions you got wrong yesterday. Find the sentence in the passage that proves the correct answer.',
          '2. Listen again to the Listening questions you got wrong yesterday, and read the transcript if available.',
          '3. Write down why you missed each question in your notebook.',
          '4. Read your Writing Task 1 and Task 2 answers from yesterday.',
          '5. Choose five sentences from your writing and correct any grammar or spelling mistakes you can find.',
        ],
        practiceMaterial:
          'Yesterday’s practice test, its answer key, a transcript if available, and your notebook.',
        stepByStepMethod: [
          'Take your time looking at each wrong answer—understanding your mistakes is the best way to improve.',
          'In Reading and Listening, find the exact words in the passage or recording that gave the right answer.',
          'In Writing, check whether your ideas were clear and answered the question.',
        ],
        completionMethod:
          'Review each mistake one by one and write what you learned in your notebook.',
        reviewAndErrorAnalysis: [
          'Look at your list of mistakes from yesterday.',
          'Note which question type gave you the most trouble so you can practise it carefully.',
        ],
        targetWeaknessAddressed: 'Learning from your practice test mistakes',
        successCriteria: [
          'You should understand why each wrong answer happened and have five corrected sentences from your writing.',
        ],
        nextDayBridge:
          'Tomorrow you will continue practising your priority skills.',
      });
      continue;
    }

    // =========================================================================
    // STANDARD DAILY LESSON (Focused on ONE clear skill with matching tasks)
    // =========================================================================
    const mod = moduleRotation[(d - 2) % moduleRotation.length];
    const modUnits = getUnitsForModule(mod);
    const unitIdx = moduleUnitCounters[mod] % modUnits.length;
    const cycleCount = Math.floor(moduleUnitCounters[mod] / modUnits.length);
    moduleUnitCounters[mod] += 1;

    const unit = modUnits[unitIdx];

    const useBeginnerLevel =
      (isBeginner && phaseObj.phaseIndex <= 2) ||
      (currentOverall <= 5.5 && phaseObj.phaseIndex === 1);
    const useAdvancedLevel =
      !isBeginner &&
      (phaseObj.phaseIndex >= 3 || (targetOverall >= 7.5 && phaseObj.phaseIndex >= 2));

    const dayTitle = useBeginnerLevel
      ? unit.foundationalTitle
      : useAdvancedLevel && cycleCount > 0
      ? unit.advancedTitle
      : unit.targetedTitle;

    const matchedStudentWeakness =
      unit.matchingWeaknessKeywords.find((kw) => allSelectedWeaknesses.includes(kw)) ||
      unit.questionTypeTag;

    const baseTasks = useBeginnerLevel
      ? [...unit.beginnerTasks]
      : useAdvancedLevel
      ? [...unit.advancedTasks]
      : [...unit.regularTasks];

    if (cycleCount >= 1) {
      baseTasks.unshift(
        `Note before you start: Read your notebook notes from the last time you practised ${unit.questionTypeTag} so you avoid making the same mistakes today.`
      );
    }

    days.push({
      dayNumber: d,
      phaseIndex: phaseObj.phaseIndex,
      phaseName: phaseObj.phaseName,
      isConsolidationDay: false,
      title: dayTitle,
      primaryModule: mod,
      questionTypeTag: unit.questionTypeTag,
      primaryObjective: unit.primaryObjective,
      specificStudyTasks: baseTasks,
      practiceMaterial: unit.whatYouNeed,
      stepByStepMethod: unit.stepByStepMethod,
      completionMethod: unit.completionMethod,
      reviewAndErrorAnalysis: unit.reviewAndErrorAnalysis,
      targetWeaknessAddressed: matchedStudentWeakness,
      upgradeExample: unit.upgradeExample,
      successCriteria: unit.successCriteria,
      nextDayBridge:
        d + 1 === durationDays
          ? 'Tomorrow is your final review day to look over what you learned.'
          : `When you finish these steps, you are done for Day ${d}.`,
    });
  }

  // Helpful, non-pushy recommendation at the bottom of the page
  let recommendedDecodeOffer: GeneratedStudyPlan['recommendedDecodeOffer'];
  if (durationDays <= 35 && (moduleGaps.writing >= 1.0 || moduleGaps.speaking >= 1.0)) {
    recommendedDecodeOffer = {
      primaryTitle: '1-Month 1-to-1 Live IELTS Crash Course (BDT 9,999)',
      primaryBadge: 'PRIVATE 1-TO-1 COACHING · 4 CLASSES/WEEK',
      primaryReason: `You can follow this ${durationDays}-day study plan completely on your own. If you also want a teacher to check your Writing essays and practise Speaking with you 1-to-1, Jubayer Siddiki (IELTS Overall 8) offers a 1-Month 1-to-1 Live Crash Course.`,
      primaryCtaText: 'Ask Jubayer about the 1-to-1 Crash Course',
      primaryWaMessage: `Hi Jubayer, I just built my ${durationDays}-day IELTS Study Plan (Target Band ${targetOverall.toFixed(1)}, main focus: ${primaryBottleneckModule}). I'd like to ask about the 1-Month 1-to-1 Live Crash Course. CRASH`,
      secondaryGuideIds: [primaryBottleneckModule, sortedModules[1]],
      secondaryReason: `Studying on your own? You can also use the IELTS DECODED Self-Prep Guides (BDT 499 each) for extra practice questions and model answers.`,
    };
  } else if (durationDays >= 45) {
    recommendedDecodeOffer = {
      primaryTitle: '12-Week Band 7+ Roadmap Mentorship Program (BDT 7,999 Founding Batch)',
      primaryBadge: 'SMALL GROUP BATCH (10 SEATS ONLY) · 3 CLASSES/WEEK',
      primaryReason: `You can follow this ${durationDays}-day self-study plan independently, or join the 12-Week Mentorship Batch if you want live classes, 5 full mock tests, personal writing correction, and weekly speaking feedback.`,
      primaryCtaText: 'Ask Jubayer about the 12-Week Mentorship Batch',
      primaryWaMessage: `Hi Jubayer, I built my ${durationDays}-day IELTS Study Plan (Target Band ${targetOverall.toFixed(1)}). I'd like to ask about the 12-Week Band 7+ Roadmap Mentorship Program. ENROLL`,
      secondaryGuideIds: [primaryBottleneckModule, sortedModules[1]],
      secondaryReason: `Prefer to study on your own? The IELTS DECODED 4-Module Self-Prep Guides (BDT 499 per book) give you step-by-step lessons and original practice exercises.`,
    };
  } else {
    recommendedDecodeOffer = {
      primaryTitle: 'IELTS DECODED 4-Module Self-Prep Guides (BDT 499 per guide)',
      primaryBadge: 'SELF-STUDY BOOKS · STEP-BY-STEP PRACTICE',
      primaryReason: `If you want clear explanations, practice exercises, and model answers to use with your ${durationDays}-day study plan, check out the IELTS DECODED ${
        primaryBottleneckModule.charAt(0).toUpperCase() + primaryBottleneckModule.slice(1)
      } and ${
        sortedModules[1].charAt(0).toUpperCase() + sortedModules[1].slice(1)
      } Self-Prep Guides.`,
      primaryCtaText: 'Explore the Self-Prep Guides',
      primaryWaMessage: `Hi Jubayer, I built my ${durationDays}-day IELTS Study Plan (Target Band ${targetOverall.toFixed(1)}) and I'm interested in the Self-Prep Guides.`,
      secondaryGuideIds: [primaryBottleneckModule, sortedModules[1]],
      secondaryReason: `If you want personal teacher feedback on your Writing and Speaking, you can also message Jubayer about the 1-Month 1-to-1 Crash Course (BDT 9,999).`,
    };
  }

  const profileParts: string[] = [
    input.testType === 'academic' ? 'IELTS Academic' : 'IELTS General Training',
    isBeginner
      ? 'Starting from scratch (Beginner)'
      : `Current Band ${currentOverall.toFixed(1)}`,
    `Target Band ${targetOverall.toFixed(1)}`,
    `${durationDays} Days (${daysPerWeek} study days/week)`,
  ];

  return {
    id: `plan_${Date.now()}`,
    createdAt: new Date().toISOString(),
    input: {
      ...input,
      durationDays,
      daysPerWeek,
    },
    planTitle: `${durationDays}-Day Personalized ${
      input.testType === 'academic' ? 'IELTS Academic' : 'IELTS General Training'
    } Study Plan (Target Band ${targetOverall.toFixed(1)})`,
    studentProfileSummary: profileParts.join(' · '),
    realisticExpectationNote,
    ambitiousTargetWarning,
    examDateConflictNote,
    primaryBottleneckModule,
    moduleAllocationPercent: rawPercents,
    phases,
    days,
    recommendedDecodeOffer,
  };
}
