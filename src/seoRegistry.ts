/**
 * Central SEO & Structured Data Registry for IELTS DECODED
 * Shared by both the Express Server (for SSR HTML pre-rendering, dynamic canonicals,
 * dynamic sitemap.xml, robots.txt, and llms.txt) and the React Client (for SPA route transitions).
 */

export type SeoRouteKey =
  | 'home'
  | 'guides'
  | 'diagnostic'
  | 'writing-checker'
  | 'band-calculator'
  | 'study-plan'
  | 'tips'
  | 'case-study';

export interface RouteSeoData {
  routeKey: SeoRouteKey;
  path: string;
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  breadcrumbName: string;
  priority: string;
  changefreq: 'daily' | 'weekly';
  h1: string;
  leadParagraph: string;
  highlights: string[];
}

export const SEO_ROUTES: Record<SeoRouteKey, RouteSeoData> = {
  home: {
    routeKey: 'home',
    path: '/',
    title: 'IELTS DECODED — Official Website | By Jubayer Siddiki (Band 8.0) · Free IELTS Diagnostic & Mentorship',
    description:
      'IELTS DECODED by Jubayer Siddiki (IELTS Overall 8.0, CLB 9). Diagnose why your IELTS score is stuck at Band 6.0 or 6.5 with our free AI Writing Checker, personalized Study Plan Generator, 4 Self-Prep PDF Guides, and live mentorship.',
    keywords:
      'IELTS DECODED, ielts decoded, IELTS Decoded Bangladesh, Jubayer Siddiki IELTS, IELTS Decoded official website, IELTS writing task 2 checker free, IELTS study plan generator, IELTS self-prep guides PDF, IELTS mentorship Bangladesh, IELTS Band 7 score rescue, Academic IELTS preparation Dhaka',
    ogTitle: 'IELTS DECODED — Stuck on the Same Band? Find Exactly Why You’re Losing Marks',
    ogDescription:
      'Official IELTS DECODED platform by Jubayer Siddiki (Overall Band 8.0, L 8.5, R 8.5, W 7.0, S 7.0). Free 38-page Score Rescue PDF, AI Writing Examiner Desk, Study Plan Builder & 12-Week Live Mentorship.',
    breadcrumbName: 'Home',
    priority: '1.0',
    changefreq: 'daily',
    h1: 'IELTS DECODED — Stuck on the same band? Find exactly why you’re losing marks.',
    leadParagraph:
      'Stop taking blind mock tests. IELTS DECODED by Jubayer Siddiki (Overall Band 8.0 · CLB 9 · Listening 8.5 · Reading 8.5 · Writing 7.0 · Speaking 7.0) helps Academic IELTS candidates in Bangladesh and worldwide diagnose the exact [K] Knowledge, [S] Skill, and [C] Care mistakes holding their band score back—and fix them step by step.',
    highlights: [
      'Free 38-Page IELTS Band 7+ Score Rescue PDF Guide & 5-Page Module Sample Chapters',
      'Free AI IELTS Writing Task 1 & Task 2 Examiner Desk (May 2023 Official Public Band Descriptors)',
      'Free Personalized Day-by-Day IELTS Study Plan Generator (7 to 90 Days)',
      '4 Complete Self-Prep Module Guides (Listening 50pp, Reading 48pp, Writing 65pp, Speaking 59pp — BDT 499 each or BDT 1,499 Bundle)',
      '12-Week Live IELTS Mentorship Batch (Max 10 Seats, BDT 7,999) & 1-to-1 Urgent Crash Course (BDT 9,999)',
    ],
  },
  guides: {
    routeKey: 'guides',
    path: '/guides',
    title: 'IELTS DECODED Self-Prep Guides — 4-Module IELTS Books PDF (Listening, Reading, Writing, Speaking)',
    description:
      'Download free 5-page sample chapters or get the complete 4-module IELTS DECODED Self-Prep Guides by Jubayer Siddiki (BDT 499 each / BDT 1,499 bundle). Includes Band 6 to 8 essay rewrites, T/F/NG algorithms, and error logs.',
    keywords:
      'IELTS DECODED guides, IELTS self-prep books PDF, IELTS writing book Bangladesh, IELTS reading true false not given guide, IELTS speaking cue card templates PDF, IELTS listening trap catalogue, Jubayer Siddiki IELTS books',
    ogTitle: 'IELTS DECODED Self-Prep Module Guides — Listening, Reading, Writing & Speaking',
    ogDescription:
      '222 pages of step-by-step Academic IELTS strategy, Band 6→7→8 essay rewrites, Bangla speaker pronunciation fixes, and 4-week study plans. Download free 5-page previews.',
    breadcrumbName: 'Self-Prep Guides',
    priority: '0.95',
    changefreq: 'weekly',
    h1: 'IELTS DECODED Self-Prep Module Guides — Listening, Reading, Writing & Speaking',
    leadParagraph:
      'Built for self-study IELTS candidates who want structured, examiner-calibrated frameworks without fluff. Each IELTS DECODED guide includes a 10-minute diagnostic, Knowledge/Skill/Care error logs, step-by-step question algorithms, annotated Band 6 to Band 8 upgrades, and a 4-week execution schedule.',
    highlights: [
      'IELTS DECODED Writing Self-Prep Guide (65 Pages) — Task 1 Data Grouping & Task 2 Argument Architecture + Band 6→7→8 Paragraph Fixes',
      'IELTS DECODED Reading Self-Prep Guide (48 Pages) — 14 Question Formats, T/F/NG Decision Tree & 60-Minute Timing Trainer',
      'IELTS DECODED Speaking Self-Prep Guide (59 Pages) — Part 1, 2 & 3 Frameworks, Word Stress & Pronunciation Fixes for Bangla Speakers',
      'IELTS DECODED Listening Self-Prep Guide (50 Pages) — Paraphrase Bank, 4 Distractor Traps & Section 1–4 Evidence Keys',
    ],
  },
  diagnostic: {
    routeKey: 'diagnostic',
    path: '/diagnostic',
    title: 'IELTS DECODED Writing Checker & Examiner Desk — Free AI IELTS Essay Evaluator & Band Calculator',
    description:
      'Check your IELTS Writing Task 1 or Task 2 essay free with the IELTS DECODED Examiner Red-Pen Desk. Instant scoring across TR/TA, CC, LR, and GRA using official May 2023 IELTS band descriptors plus line-by-line red-pen fixes.',
    keywords:
      'IELTS DECODED writing checker, free IELTS writing task 2 evaluator, IELTS essay checker AI, IELTS band score calculator, IELTS writing red pen correction, IELTS band descriptors May 2023 calculator',
    ogTitle: 'IELTS DECODED Free Writing Examiner Desk & Band Score Diagnostic',
    ogDescription:
      'Paste your IELTS Writing Task 1 or Task 2 response for instant criterion-by-criterion scoring (TR, CC, LR, GRA), red-pen line edits, and a Band 7.5+ model rewrite.',
    breadcrumbName: 'Writing Checker & Diagnostic',
    priority: '0.95',
    changefreq: 'weekly',
    h1: 'IELTS DECODED Examiner Desk — Free AI Writing Task 1 & Task 2 Evaluator & Band Calculator',
    leadParagraph:
      'Evaluate your IELTS Academic Writing Task 1 report or Task 2 essay against the official May 2023 IELTS Public Band Descriptors. Get separate band scores for Task Achievement/Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy, complete with red-pen sentence corrections and a Mistake DNA breakdown.',
    highlights: [
      'Instant Criterion Breakdown: Task Response (TR), Coherence & Cohesion (CC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA)',
      'Line-by-Line Examiner Red-Pen Corrections tagged by Knowledge [K], Skill [S], and Care [C]',
      'Interactive IELTS Overall Band Score Calculator & Reading/Listening Raw Score Converter (Out of 40)',
      'Downloadable Mistake DNA Diagnostic Card & Direct WhatsApp Review with Jubayer Siddiki',
    ],
  },
  'writing-checker': {
    routeKey: 'writing-checker',
    path: '/writing-checker',
    title: 'Free IELTS Writing Task 1 & Task 2 Checker | IELTS DECODED Red-Pen Essay Evaluator',
    description:
      'Get an instant IELTS Writing band score and red-pen line corrections with the free IELTS DECODED Writing Checker by Jubayer Siddiki. Calibrated to official IELTS public band descriptors.',
    keywords:
      'free IELTS writing checker, IELTS task 2 essay evaluator, IELTS writing band score checker online, IELTS DECODED writing tool, IELTS academic task 1 checker',
    ogTitle: 'Free IELTS Writing Task 1 & Task 2 Checker — IELTS DECODED',
    ogDescription:
      'Instant IELTS Writing evaluation with red-pen grammar, vocabulary, cohesion, and task response fixes.',
    breadcrumbName: 'Free IELTS Writing Checker',
    priority: '0.90',
    changefreq: 'weekly',
    h1: 'Free IELTS Writing Task 1 & Task 2 Checker — IELTS DECODED Red-Pen Examiner Desk',
    leadParagraph:
      'Submit any IELTS Writing Task 1 or Task 2 practice essay to see why your writing is plateauing at Band 6.0 or 6.5 and exactly which sentences need upgrading to reach Band 7.0+.',
    highlights: [
      'Official 4-Criterion IELTS Band Scoring (TR/TA, CC, LR, GRA)',
      ' Detects memorized clichés, mechanical linkers, and unsupported arguments',
      'Side-by-side Band 6.0 vs Band 7.5+ paragraph upgrades',
    ],
  },
  'band-calculator': {
    routeKey: 'band-calculator',
    path: '/band-calculator',
    title: 'IELTS Band Score Calculator & Raw Score Converter (Listening & Reading /40) | IELTS DECODED',
    description:
      'Calculate your exact IELTS Overall Band Score and convert Listening & Academic Reading raw scores (/40) to official 0.5 band increments with the free IELTS DECODED Band Calculator.',
    keywords:
      'IELTS band score calculator, IELTS reading score calculator out of 40, IELTS listening band score chart, IELTS overall band rounding rules, IELTS DECODED calculator',
    ogTitle: 'IELTS Band Score Calculator & Raw Score Converter — IELTS DECODED',
    ogDescription:
      'Convert Listening and Reading raw marks (/40) and calculate your official IELTS Overall Band Score with score-gap advice.',
    breadcrumbName: 'IELTS Band Score Calculator',
    priority: '0.85',
    changefreq: 'weekly',
    h1: 'IELTS Band Score Calculator & Reading/Listening Raw Score Converter (/40)',
    leadParagraph:
      'Use official IELTS rounding rules (.25 rounds to .5, .75 rounds to the next whole band) and see how many extra raw marks in Listening or Reading you need to raise your overall IELTS score.',
    highlights: [
      'Official IELTS Overall Band Rounding Calculator',
      'Academic Reading & Listening Raw Marks (/40) to Band Score Converter',
      'Fastest Module Leverage Advisor to hit your target band before exam day',
    ],
  },
  'study-plan': {
    routeKey: 'study-plan',
    path: '/study-plan',
    title: 'Free IELTS Study Plan Generator — Personalized Day-by-Day IELTS Routine PDF | IELTS DECODED',
    description:
      'Generate a personalized day-by-day IELTS study plan (7 to 90 days) tailored to your current band, target score, exam date, and weakest modules. Instant printable PDF download by IELTS DECODED.',
    keywords:
      'IELTS study plan generator, 30 day IELTS study plan PDF, 1 month IELTS preparation routine, personalized IELTS study schedule, IELTS DECODED study plan, how to prepare for IELTS at home',
    ogTitle: 'IELTS DECODED Study Plan Builder — Custom Day-by-Day IELTS Preparation Schedule',
    ogDescription:
      'Build a custom day-by-day IELTS study plan around your exam date, target band (6.5, 7.0, 7.5+), and weakest modules. Download as a clean PDF.',
    breadcrumbName: 'IELTS Study Plan Generator',
    priority: '0.95',
    changefreq: 'weekly',
    h1: 'IELTS DECODED Study Plan Builder — Personalized Day-by-Day IELTS Preparation Curriculum',
    leadParagraph:
      'Tell us your current IELTS level, target band score, available study days per week, and your hardest question types across Listening, Reading, Writing, and Speaking. Our curriculum engine builds a custom day-by-day roadmap with exact drills and downloadable PDF checklists.',
    highlights: [
      'Custom 7-Day to 90-Day Day-by-Day IELTS Study Schedule tailored to your exam countdown',
      'Targets your exact bottlenecks (True/False/Not Given, Matching Headings, Task 2 Body Paragraphs, Speaking Part 2 & 3)',
      'Instant Multi-Page Printable PDF Study Plan Download',
    ],
  },
  tips: {
    routeKey: 'tips',
    path: '/tips',
    title: 'Most Common IELTS Mistakes & Band 7+ Tips (Writing, Reading, Speaking, Listening) | IELTS DECODED',
    description:
      'See real Band 6.0 vs Band 7.5+ before-and-after IELTS mistake fixes across Writing Task 2, Reading T/F/NG, Speaking Part 2, and Listening distractors. Curated by Jubayer Siddiki at IELTS DECODED.',
    keywords:
      'common IELTS mistakes, IELTS writing task 2 band 6 vs band 7, IELTS reading true false not given tips, IELTS speaking part 2 tips, IELTS listening distractor tips, IELTS DECODED tips',
    ogTitle: 'Most Common IELTS Mistakes & Band 7.5+ Fixes — IELTS DECODED',
    ogDescription:
      'Side-by-side Band 6.0 mistakes vs. Band 7.5+ fixes tagged by Knowledge [K], Skill [S], and Care [C] across all 4 IELTS modules.',
    breadcrumbName: 'Common IELTS Mistakes & Tips',
    priority: '0.90',
    changefreq: 'weekly',
    h1: 'Most Common IELTS Mistakes & Band 7.5+ Tips — Side-by-Side Before & After Fixes',
    leadParagraph:
      'Most IELTS test-takers lose 0.5 to 1.5 bands from a small set of repeatable Knowledge [K], Skill [S], and Care [C] errors. Explore our side-by-side Band 6.0 vs. Band 7.5+ fixes across Writing, Reading, Speaking, and Listening.',
    highlights: [
      'Writing Task 2: Replacing memorized template openings and unsupported generalizations with specific causal chains',
      'Reading: Stopping the FALSE vs. NOT GIVEN trap and Matching Headings first-sentence bait',
      'Speaking: Eliminating filler pauses and upgrading flat Band 6.0 vocabulary into natural Band 7.5+ collocations',
      'Listening: Catching self-correction distractors, singular/plural traps, and Section 3 academic agreement shifts',
    ],
  },
  'case-study': {
    routeKey: 'case-study',
    path: '/case-study',
    title: 'Band 6.0 to Band 7.5 IELTS Writing Task 2 Essay Case Study — Red-Pen Breakdown | IELTS DECODED',
    description:
      'Read a complete line-by-line examiner red-pen breakdown showing how a real Band 6.0 IELTS Writing Task 2 paragraph is diagnosed and rewritten to Band 7.5+ by Jubayer Siddiki at IELTS DECODED.',
    keywords:
      'IELTS writing band 6 to 7.5 sample essay, IELTS task 2 red pen correction example, IELTS writing case study, how to improve IELTS writing from 6 to 7, IELTS DECODED case study',
    ogTitle: 'Band 6.0 → 7.5+ IELTS Writing Essay Red-Pen Breakdown — IELTS DECODED',
    ogDescription:
      'See the exact Knowledge [K], Skill [S], and Care [C] edits that transform a stuck Band 6.0 IELTS Task 2 essay into a clear Band 7.5+ script.',
    breadcrumbName: 'Band 6.0 to 7.5+ Essay Case Study',
    priority: '0.90',
    changefreq: 'weekly',
    h1: 'Band 6.0 to Band 7.5+ IELTS Writing Task 2 Case Study — Line-by-Line Red-Pen Diagnosis',
    leadParagraph:
      'Why do students who write grammatically decent English still score 6.0 in IELTS Writing? Walk through a real student Task 2 paragraph, see every red-pen mark tagged by [K] Knowledge, [S] Skill, and [C] Care, and compare the Band 7.5+ rewrite.',
    highlights: [
      'Original Band 6.0 Student Paragraph with Criterion Scores (TR 6.0, CC 6.0, LR 6.0, GRA 6.0)',
      'Line-by-Line Red-Pen Diagnosis of Mechanical Linkers, Over-Generalization, and Word-Choice Slips',
      'Complete Band 7.5+ Rewritten Paragraph with Examiner Commentary',
    ],
  },
};

export function resolveSeoRouteFromPathname(pathname: string): RouteSeoData {
  const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  if (clean === '/guides') return SEO_ROUTES.guides;
  if (clean === '/diagnostic') return SEO_ROUTES.diagnostic;
  if (clean === '/writing-checker') return SEO_ROUTES['writing-checker'];
  if (clean === '/band-calculator') return SEO_ROUTES['band-calculator'];
  if (clean === '/study-plan') return SEO_ROUTES['study-plan'];
  if (clean === '/tips') return SEO_ROUTES.tips;
  if (clean === '/case-study') return SEO_ROUTES['case-study'];
  return SEO_ROUTES.home;
}

/**
 * Builds the comprehensive Schema.org JSON-LD @graph dynamically bound to the active origin
 * and current route so Google indexes and associates all entities with the active domain.
 */
export function buildStructuredDataGraph(origin: string, routeData: RouteSeoData) {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const currentUrl = `${cleanOrigin}${routeData.path === '/' ? '/' : routeData.path}`;
  const ogImageUrl = `${cleanOrigin}/og-image.jpg`;

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'IELTS DECODED',
      item: `${cleanOrigin}/`,
    },
  ];

  if (routeData.path !== '/') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: routeData.breadcrumbName,
      item: currentUrl,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${cleanOrigin}/#website`,
        url: `${cleanOrigin}/`,
        name: 'IELTS DECODED',
        alternateName: [
          'IELTS Decoded',
          'IELTS DECODED by Jubayer Siddiki',
          'IELTS Decoded Bangladesh',
        ],
        description:
          'Official website of IELTS DECODED by Jubayer Siddiki (Overall Band 8.0, CLB 9). Academic IELTS Diagnostic, AI Writing Examiner Desk, Personalized Study Plan Builder, 4-Module Self-Prep Guides, and Live Mentorship.',
        inLanguage: 'en',
        publisher: {
          '@id': `${cleanOrigin}/#organization`,
        },
      },
      {
        '@type': ['EducationalOrganization', 'Brand'],
        '@id': `${cleanOrigin}/#organization`,
        name: 'IELTS DECODED',
        alternateName: 'IELTS Decoded Bangladesh',
        url: `${cleanOrigin}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${cleanOrigin}/logo.svg`,
        },
        image: ogImageUrl,
        description:
          'Academic IELTS diagnostic and mentorship platform founded by Jubayer Siddiki (Band 8.0 Overall) helping students overcome Band 6.0 and 6.5 plateaus.',
        sameAs: [
          'https://www.facebook.com/profile.php?id=61587895062537',
          'https://ielts-decoded.ai.studio/',
        ],
        founder: {
          '@id': `${cleanOrigin}/#founder`,
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+8801305273703',
          contactType: 'Customer Support & Mentorship Admissions',
          areaServed: ['BD', 'Worldwide'],
          availableLanguage: ['English', 'Bengali'],
        },
      },
      {
        '@type': 'Person',
        '@id': `${cleanOrigin}/#founder`,
        name: 'Jubayer Siddiki',
        jobTitle: 'Founder, Lead IELTS Mentor & Author at IELTS DECODED',
        description:
          'IELTS Academic Overall Band 8.0 (Listening 8.5, Reading 8.5, Writing 7.0, Speaking 7.0 · CLB 9). Author of the 4-volume IELTS DECODED Self-Prep Guide series and creator of the K/S/C Mistake DNA diagnostic system.',
        image: `${cleanOrigin}/1.jpg`,
        url: `${cleanOrigin}/`,
        sameAs: ['https://www.facebook.com/profile.php?id=61587895062537'],
        worksFor: {
          '@id': `${cleanOrigin}/#organization`,
        },
        knowsAbout: [
          'IELTS Academic Preparation',
          'IELTS Writing Task 1 & Task 2 Evaluation',
          'IELTS Reading True/False/Not Given Strategy',
          'IELTS Speaking Fluency & Pronunciation',
          'IELTS Listening Distractor Analysis',
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${currentUrl}#webpage`,
        url: currentUrl,
        name: routeData.title,
        description: routeData.description,
        isPartOf: {
          '@id': `${cleanOrigin}/#website`,
        },
        about: {
          '@id': `${cleanOrigin}/#organization`,
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: ogImageUrl,
          width: 1200,
          height: 630,
        },
        inLanguage: 'en',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${currentUrl}#breadcrumb`,
        itemListElement: breadcrumbItems,
      },
      {
        '@type': 'ItemList',
        '@id': `${cleanOrigin}/#sitelinks`,
        name: 'IELTS DECODED Main Tools & Programs',
        itemListElement: [
          {
            '@type': 'SiteNavigationElement',
            position: 1,
            name: 'Free IELTS Writing Checker & Examiner Desk',
            description:
              'Instant AI IELTS Writing Task 1 & Task 2 evaluation with official May 2023 band descriptors and red-pen fixes.',
            url: `${cleanOrigin}/diagnostic`,
          },
          {
            '@type': 'SiteNavigationElement',
            position: 2,
            name: 'Free IELTS Study Plan Generator',
            description:
              'Personalized 7 to 90-day day-by-day IELTS preparation schedule with downloadable PDF.',
            url: `${cleanOrigin}/study-plan`,
          },
          {
            '@type': 'SiteNavigationElement',
            position: 3,
            name: 'IELTS Self-Prep Module Guides (PDF Books)',
            description:
              '4 modular IELTS self-prep workbooks (Listening, Reading, Writing, Speaking) with free 5-page sample chapters.',
            url: `${cleanOrigin}/guides`,
          },
          {
            '@type': 'SiteNavigationElement',
            position: 4,
            name: 'Most Common IELTS Mistakes & Tips',
            description:
              'Side-by-side Band 6.0 vs Band 7.5+ mistake fixes across Writing, Reading, Speaking, and Listening.',
            url: `${cleanOrigin}/tips`,
          },
          {
            '@type': 'SiteNavigationElement',
            position: 5,
            name: 'Band 6.0 to 7.5+ Essay Case Study',
            description:
              'Line-by-line examiner red-pen breakdown of a real IELTS Writing Task 2 paragraph.',
            url: `${cleanOrigin}/case-study`,
          },
        ],
      },
      {
        '@type': 'WebApplication',
        '@id': `${cleanOrigin}/#diagnostic-app`,
        name: 'IELTS DECODED Examiner Red-Pen Desk & AI Writing Checker',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'All',
        url: `${cleanOrigin}/diagnostic`,
        description:
          'Instant IELTS Writing Task 1 and Task 2 evaluation calibrated to the May 2023 IELTS Public Band Descriptors (TR/TA, CC, LR, GRA) with red-pen line edits and Mistake DNA card.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'BDT',
        },
      },
      {
        '@type': 'WebApplication',
        '@id': `${cleanOrigin}/#study-plan-app`,
        name: 'IELTS DECODED Personalized Study Plan Builder',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'All',
        url: `${cleanOrigin}/study-plan`,
        description:
          'Generates a customized day-by-day IELTS study plan PDF based on target band, exam date, and weakest question types.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'BDT',
        },
      },
      {
        '@type': 'Product',
        '@id': `${cleanOrigin}/#guides-bundle`,
        name: 'IELTS DECODED Complete 4-Guide Self-Prep Bundle (Listening, Reading, Writing, Speaking)',
        description:
          'Complete 4-book Academic IELTS self-prep system (222 total pages) covering Listening (50pp), Reading (48pp), Writing (65pp), and Speaking (59pp) with error logs, Band 6 to 8 rewrites, and 50% live batch fee credit.',
        image: ogImageUrl,
        brand: {
          '@id': `${cleanOrigin}/#organization`,
        },
        offers: [
          {
            '@type': 'Offer',
            name: 'Single Module Self-Prep Guide',
            price: '499',
            priceCurrency: 'BDT',
            availability: 'https://schema.org/InStock',
            url: `${cleanOrigin}/guides`,
          },
          {
            '@type': 'Offer',
            name: 'Complete 4-Guide Bundle (Save BDT 500)',
            price: '1499',
            priceCurrency: 'BDT',
            availability: 'https://schema.org/InStock',
            url: `${cleanOrigin}/guides`,
          },
        ],
      },
      {
        '@type': 'Course',
        '@id': `${cleanOrigin}/#batch-mentorship`,
        name: 'IELTS DECODED 12-Week Live Academic Mentorship Batch (Max 10 Students)',
        description:
          '12-week small-group Academic IELTS live mentorship with Jubayer Siddiki covering all 4 modules, 5 full mocks, personal line-by-line writing corrections, and weekly 1-to-1 speaking evaluations.',
        provider: {
          '@id': `${cleanOrigin}/#organization`,
        },
        offers: {
          '@type': 'Offer',
          category: 'Paid',
          price: '7999',
          priceCurrency: 'BDT',
          availability: 'https://schema.org/LimitedAvailability',
          url: `${cleanOrigin}/#programs`,
        },
      },
      {
        '@type': 'Course',
        '@id': `${cleanOrigin}/#one-to-one-crash`,
        name: 'IELTS DECODED 1-to-1 Urgent Crash Course',
        description:
          'Private 1-on-1 IELTS Academic crash mentorship tailored around your exact exam date with live screen-sharing essay dissections and speaking mocks.',
        provider: {
          '@id': `${cleanOrigin}/#organization`,
        },
        offers: {
          '@type': 'Offer',
          category: 'Paid',
          price: '9999',
          priceCurrency: 'BDT',
          availability: 'https://schema.org/InStock',
          url: `${cleanOrigin}/#programs`,
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${cleanOrigin}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is IELTS DECODED and who founded it?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'IELTS DECODED is an Academic IELTS diagnostic and mentorship platform founded by Jubayer Siddiki (IELTS Overall Band 8.0 · Listening 8.5, Reading 8.5, Writing 7.0, Speaking 7.0 · CLB 9). It helps students identify the exact Knowledge [K], Skill [S], and Care [C] mistakes holding their band score back through free diagnostic tools, 4 modular self-prep PDF guides, and live small-group or 1-to-1 mentorship.',
            },
          },
          {
            '@type': 'Question',
            name: 'Why is my IELTS score stuck at Band 6.0 or 6.5?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Most IELTS candidates plateau at Band 6.0 or 6.5 not because of weak English, but because of repeatable diagnostic blind spots: confusing FALSE with NOT GIVEN in Reading, falling for self-correction distractors in Listening, using mechanical templates with unsupported claims in Writing Task 2, and pausing for vocabulary in Speaking Part 2 and Part 3. IELTS DECODED tags every mistake as Knowledge [K], Skill [S], or Care [C] so you fix the root cause instead of taking blind mock tests.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does the free IELTS DECODED Writing Checker evaluate essays?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The IELTS DECODED Examiner Red-Pen Desk evaluates Task 1 and Task 2 responses across the 4 official May 2023 IELTS criteria: Task Achievement / Task Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy. It provides individual criterion bands, official 0.25/0.75 rounding, red-pen line corrections, and a Band 7.5+ model rewrite.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is included in the IELTS DECODED Self-Prep Guides and how much do they cost?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'There are 4 modular self-prep PDF books: Listening (50 pages), Reading (48 pages), Writing (65 pages), and Speaking (59 pages). Each guide is BDT 499 individually, or BDT 1,499 for the complete 4-guide bundle (saving BDT 500). You can also download a free 5-page sample chapter of each module and the free 38-page IELTS Band 7+ Score Rescue guide directly from the website. Plus, 50% of your PDF guide fee is credited if you upgrade to a live mentorship program within 14 days.',
            },
          },
        ],
      },
    ],
  };
}

/**
 * Updates client-side document title, meta description, canonical URL, OpenGraph tags,
 * and dynamic JSON-LD whenever the user navigates between routes in the SPA.
 */
export function syncClientSeoForRoute(pathname: string) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const routeData = resolveSeoRouteFromPathname(pathname);
  const origin = window.location.origin;
  const canonicalUrl = `${origin}${routeData.path === '/' ? '/' : routeData.path}`;
  const ogImageUrl = `${origin}/og-image.jpg`;

  document.title = routeData.title;

  const setMeta = (selector: string, attr: 'content' | 'href', value: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.setAttribute(attr, value);
    }
  };

  setMeta('meta[name="title"]', 'content', routeData.title);
  setMeta('meta[name="description"]', 'content', routeData.description);
  setMeta('meta[name="keywords"]', 'content', routeData.keywords);
  setMeta('link[rel="canonical"]', 'href', canonicalUrl);

  setMeta('meta[property="og:url"]', 'content', canonicalUrl);
  setMeta('meta[property="og:title"]', 'content', routeData.ogTitle);
  setMeta('meta[property="og:description"]', 'content', routeData.ogDescription);
  setMeta('meta[property="og:image"]', 'content', ogImageUrl);
  setMeta('meta[property="og:image:secure_url"]', 'content', ogImageUrl);

  setMeta('meta[name="twitter:url"]', 'content', canonicalUrl);
  setMeta('meta[name="twitter:title"]', 'content', routeData.ogTitle);
  setMeta('meta[name="twitter:description"]', 'content', routeData.ogDescription);
  setMeta('meta[name="twitter:image"]', 'content', ogImageUrl);

  const schemaScript = document.getElementById('ielts-decoded-jsonld');
  if (schemaScript) {
    schemaScript.textContent = JSON.stringify(buildStructuredDataGraph(origin, routeData));
  }
}
