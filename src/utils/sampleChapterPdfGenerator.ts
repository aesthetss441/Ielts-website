import { jsPDF } from 'jspdf';
import { getGuideById, GuideModuleId } from '../guidesConfig';

/**
 * First checks if a static 5-page preview PDF file is placed in `/public/`
 * (e.g., `/IELTS-DECODED-Writing-Sample-Chapter-5p.pdf`, `/writing-preview.pdf`, `/guides/writing-preview.pdf`, etc.).
 * If a static PDF is uploaded to `/public`, it downloads that exact file directly.
 * Otherwise, it generates the exact 5-page vector PDF matching the official IELTS DECODED 5-page Free Preview design.
 */
const CANDIDATE_STATIC_PDF_PATHS: Record<GuideModuleId, string[]> = {
  writing: [
    '/IELTS-DECODED-Writing-Sample-Chapter-5p.pdf',
    '/IELTS-DECODED-Writing-Preview-5p.pdf',
    '/writing-preview.pdf',
    '/writing-sample.pdf',
    '/guides/writing-preview.pdf',
  ],
  speaking: [
    '/IELTS-DECODED-Speaking-Sample-Chapter-5p.pdf',
    '/IELTS-DECODED-Speaking-Preview-5p.pdf',
    '/speaking-preview.pdf',
    '/speaking-sample.pdf',
    '/guides/speaking-preview.pdf',
  ],
  reading: [
    '/IELTS-DECODED-Reading-Sample-Chapter-5p.pdf',
    '/IELTS-DECODED-Reading-Preview-5p.pdf',
    '/reading-preview.pdf',
    '/reading-sample.pdf',
    '/guides/reading-preview.pdf',
  ],
  listening: [
    '/IELTS-DECODED-Listening-Sample-Chapter-5p.pdf',
    '/IELTS-DECODED-Listening-Preview-5p.pdf',
    '/listening-preview.pdf',
    '/listening-sample.pdf',
    '/guides/listening-preview.pdf',
  ],
};

async function tryDownloadStaticPreviewPdf(
  moduleId: GuideModuleId,
  downloadFileName: string
): Promise<boolean> {
  const candidates = CANDIDATE_STATIC_PDF_PATHS[moduleId] || [];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.toLowerCase().includes('application/pdf')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadFileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) link.parentNode.removeChild(link);
        }, 1200);
        return true;
      }
    } catch {
      // Continue to next candidate
    }
  }
  return false;
}

type RGB = [number, number, number];

interface ModuleTheme {
  accent: RGB;
  accentSoftBg: RGB;
  accentBorder: RGB;
  headerDark: RGB;
  moduleNum: string;
  moduleTitle: string;
  totalPages: number;
  previewPagesLabel: string;
  navTabs: string[];
}

const THEMES: Record<GuideModuleId, ModuleTheme> = {
  writing: {
    accent: [147, 51, 234], // Purple
    accentSoftBg: [246, 242, 255],
    accentBorder: [216, 180, 254],
    headerDark: [59, 29, 138],
    moduleNum: '03',
    moduleTitle: 'IELTS Writing',
    totalPages: 65,
    previewPagesLabel: '5 sample pages (p. 1, 5, 9, 38, 21) of the full 65-page guide',
    navTabs: ['START HERE', 'THE TEST', 'TASK 1', 'TASK 2', 'LANGUAGE', 'REVIEW', 'NEXT STEP'],
  },
  speaking: {
    accent: [225, 29, 72], // Rose/Pink
    accentSoftBg: [255, 241, 242],
    accentBorder: [254, 205, 211],
    headerDark: [59, 29, 138],
    moduleNum: '04',
    moduleTitle: 'IELTS Speaking',
    totalPages: 59,
    previewPagesLabel: '5 sample pages (p. 1, 5, 41, 21, 49) of the full 59-page guide',
    navTabs: ['START HERE', 'THE TEST', 'PART 1', 'PART 2', 'PART 3', 'PRONUNCIATION', 'REVIEW'],
  },
  reading: {
    accent: [13, 148, 136], // Teal
    accentSoftBg: [240, 253, 250],
    accentBorder: [153, 246, 228],
    headerDark: [59, 29, 138],
    moduleNum: '02',
    moduleTitle: 'IELTS Reading',
    totalPages: 48,
    previewPagesLabel: '5 sample pages (p. 1, 5, 13, 14, 39) of the full 48-page guide',
    navTabs: ['START HERE', 'THE TEST', 'SKILLS', 'PRACTICE', 'REVIEW', 'NEXT STEP'],
  },
  listening: {
    accent: [13, 148, 136], // Teal
    accentSoftBg: [240, 253, 250],
    accentBorder: [153, 246, 228],
    headerDark: [59, 29, 138],
    moduleNum: '01',
    moduleTitle: 'IELTS Listening',
    totalPages: 50,
    previewPagesLabel: '5 sample pages (p. 1, 5, 15, 16, 28) of the full 50-page guide',
    navTabs: ['START HERE', 'THE TEST', 'SKILLS', 'PRACTICE', 'REVIEW', 'NEXT STEP'],
  },
};

function drawBrandMark(doc: jsPDF, centerX: number, topY: number, scale = 1) {
  // Minimalist geometric 'b' / 'ID' mark matching cover screenshot
  const w = 52 * scale;
  const h = 76 * scale;
  const startX = centerX - w / 2;

  // Left vertical bar
  doc.setFillColor(12, 12, 14);
  doc.rect(startX, topY + 8 * scale, 18 * scale, h - 8 * scale, 'F');

  // Right curved D loop
  doc.setFillColor(12, 12, 14);
  doc.roundedRect(startX + 24 * scale, topY + 14 * scale, 28 * scale, h - 14 * scale, 14 * scale, 14 * scale, 'F');

  // Inner soft lavender highlight inside loop
  doc.setFillColor(196, 181, 253);
  doc.roundedRect(startX + 30 * scale, topY + 24 * scale, 14 * scale, h - 34 * scale, 7 * scale, 7 * scale, 'F');
}

function drawTopNavAndPill(
  doc: jsPDF,
  theme: ModuleTheme,
  activeTab: string,
  sectionPillText: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 38;

  // Soft lavender-tinted page background
  doc.setFillColor(248, 247, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top nav pills
  const tabs = theme.navTabs;
  const gap = 6;
  const totalWidth = pageWidth - margin * 2;
  const tabW = (totalWidth - gap * (tabs.length - 1)) / tabs.length;
  const tabY = 24;
  const tabH = 19;

  tabs.forEach((tab, idx) => {
    const tx = margin + idx * (tabW + gap);
    const isActive = tab === activeTab;
    if (isActive) {
      doc.setFillColor(...theme.accent);
      doc.roundedRect(tx, tabY, tabW, tabH, 9, 9, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(230, 228, 240);
      doc.roundedRect(tx, tabY, tabW, tabH, 9, 9, 'FD');
      doc.setTextColor(75, 75, 90);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(tab, tx + tabW / 2, tabY + 12, { align: 'center' });
  });

  // Section pill below nav
  const pillY = 56;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const pillW = Math.max(doc.getTextWidth(sectionPillText) + 22, 85);
  doc.setFillColor(...theme.accent);
  doc.roundedRect(margin, pillY, pillW, 17, 8.5, 8.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(sectionPillText, margin + pillW / 2, pillY + 11, { align: 'center' });
}

function drawPageFooter(
  doc: jsPDF,
  theme: ModuleTheme,
  moduleShortName: string,
  nextStepText: string,
  nextStepPage: string,
  actualPageNum: number
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 38;
  const contentWidth = pageWidth - margin * 2;

  // Dark indigo NEXT STEP bar
  const barY = pageHeight - 76;
  doc.setFillColor(...theme.headerDark);
  doc.roundedRect(margin, barY, contentWidth, 28, 8, 8, 'F');

  // Small pill inside bar
  doc.setFillColor(88, 56, 175);
  doc.roundedRect(margin + 10, barY + 6, 54, 16, 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('NEXT STEP', margin + 37, barY + 16.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(nextStepText, margin + 74, barY + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`${nextStepPage} ›`, pageWidth - margin - 12, barY + 17.5, { align: 'right' });

  // Bottom brand & page badge row
  const footY = pageHeight - 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 118, 135);
  doc.text(`IELTS DECODED · ${moduleShortName} Self-Prep Guide`, margin, footY);

  // Page number pill on right
  doc.setFillColor(...theme.headerDark);
  doc.roundedRect(pageWidth - margin - 26, footY - 10, 26, 14, 7, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text(String(actualPageNum), pageWidth - margin - 13, footY - 1, { align: 'center' });

  // Centered FREE PREVIEW pill
  const previewLabel = `FREE PREVIEW  |  page ${actualPageNum} of ${theme.totalPages}  |  Full guide: WhatsApp 01305273703`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const pw = doc.getTextWidth(previewLabel) + 24;
  const px = (pageWidth - pw) / 2;
  doc.setFillColor(243, 240, 255);
  doc.setDrawColor(139, 92, 246);
  doc.roundedRect(px, pageHeight - 21, pw, 14, 7, 7, 'FD');
  doc.setTextColor(49, 27, 114);
  doc.text(previewLabel, pageWidth / 2, pageHeight - 11.8, { align: 'center' });
}

function drawCoverPage(
  doc: jsPDF,
  theme: ModuleTheme,
  subtitle: string,
  description: string[],
  cards: Array<{ big: string; lines: string[] }>
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 38;
  const contentWidth = pageWidth - margin * 2;

  // White upper cover background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top accent bar
  doc.setFillColor(...theme.accent);
  doc.rect(0, 0, pageWidth, 8, 'F');

  // Logo Mark
  drawBrandMark(doc, pageWidth / 2, 65, 1.15);

  // IELTS DECODED wordmark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(15, 15, 18);
  doc.text('I  E  L  T  S', pageWidth / 2, 198, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(17);
  doc.setTextColor(35, 35, 42);
  doc.text('D  E  C  O  D  E  D', pageWidth / 2, 224, { align: 'center' });

  // Module Eyebrow
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 115);
  doc.text(
    `S E L F - P R E P   S E R I E S   ·   M O D U L E   ${theme.moduleNum}`,
    pageWidth / 2,
    268,
    { align: 'center' }
  );

  // Main Title: "IELTS" in dark ink + Module Name in accent color
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(38);
  const ieltsPart = 'IELTS ';
  const modPart = theme.moduleTitle.replace('IELTS ', '');
  const w1 = doc.getTextWidth(ieltsPart);
  const w2 = doc.getTextWidth(modPart);
  const startX = (pageWidth - (w1 + w2)) / 2;

  doc.setTextColor(15, 23, 42);
  doc.text(ieltsPart, startX, 312);
  doc.setTextColor(...theme.accent);
  doc.text(modPart, startX + w1, 312);

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 24, 38);
  doc.text(subtitle, pageWidth / 2, 338, { align: 'center' });

  // Accent short bar
  doc.setFillColor(...theme.accent);
  doc.roundedRect(pageWidth / 2 - 36, 354, 72, 3.5, 1.5, 1.5, 'F');

  // Description lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(65, 70, 88);
  description.forEach((line, idx) => {
    doc.text(line, pageWidth / 2, 382 + idx * 17, { align: 'center' });
  });

  // Bottom soft panel for WHAT'S INSIDE
  const panelY = pageHeight - 210;
  doc.setFillColor(245, 243, 252);
  doc.roundedRect(0, panelY, pageWidth, 210, 18, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...theme.headerDark);
  doc.text("W H A T ' S   I N S I D E", margin, panelY + 30);

  // 4 Stat Cards
  const cardGap = 10;
  const cardW = (contentWidth - cardGap * 3) / 4;
  const cardY = panelY + 42;
  const cardH = 74;

  cards.forEach((c, idx) => {
    const cx = margin + idx * (cardW + cardGap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230, 226, 242);
    doc.roundedRect(cx, cardY, cardW, cardH, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...theme.headerDark);
    doc.text(c.big, cx + 10, cardY + 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(45, 48, 60);
    c.lines.forEach((l, li) => {
      doc.text(l, cx + 10, cardY + 40 + li * 11);
    });
  });

  // Author credit line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(95, 98, 115);
  doc.text(
    'By Jubayer Siddiki Ayan · IELTS Overall 8 (L8.5 R8.5 W7 S7) · First edition, 2026',
    margin,
    panelY + 138
  );

  // Bottom FREE PREVIEW pill
  const pillText = `FREE PREVIEW  |  ${theme.previewPagesLabel}  |  Get it on WhatsApp 01305273703`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const pw = doc.getTextWidth(pillText) + 28;
  doc.setFillColor(243, 240, 255);
  doc.setDrawColor(124, 58, 237);
  doc.roundedRect((pageWidth - pw) / 2, panelY + 154, pw, 18, 9, 9, 'FD');
  doc.setTextColor(49, 27, 114);
  doc.text(pillText, pageWidth / 2, panelY + 166, { align: 'center' });
}

/* ============================================================================
   MODULE 03: WRITING 5-PAGE PREVIEW (p. 1, 5, 9, 38, 21)
   ============================================================================ */
function buildWritingPreviewPdf(doc: jsPDF) {
  const theme = THEMES.writing;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 38;
  const contentWidth = pageWidth - margin * 2;

  // PAGE 1: Cover
  drawCoverPage(
    doc,
    theme,
    'The all-in-one self-prep guide: Task 1 and Task 2, from 6.5 to 7.5+',
    [
      'Everything you need to prepare for Writing on your own, in one PDF: method, drills,',
      'fifteen original model answers, a self-marking rubric and a four-week plan.',
    ],
    [
      { big: '7 + 8', lines: ['original Task 1 and Task 2', 'models'] },
      { big: '50', lines: ['Task 2 prompts with idea', 'starters'] },
      { big: '60+', lines: ['editing and fix-it', 'exercises'] },
      { big: '4', lines: ['weeks of daily practice'] },
    ]
  );

  // PAGE 2: Page 5 of 65 — The 10-minute diagnostic
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'START HERE', 'START HERE · DIAGNOSTIC');
  let y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('The 10-minute ', margin, y);
  const wTitle = doc.getTextWidth('The 10-minute ');
  doc.setTextColor(...theme.accent);
  doc.text('diagnostic', margin + wTitle, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(70, 72, 85);
  doc.text("Tick what's true for you. Be honest. Nobody is marking this.", margin, y);

  y += 12;
  // Checklist Table
  doc.setFillColor(...theme.headerDark);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Area', margin + 10, y + 13);
  doc.text('Is this true for you?', margin + 45, y + 13);
  doc.text('Tick', pageWidth - margin - 26, y + 13);
  y += 20;

  const diagRows: Array<[string, string]> = [
    ['A', "I'm not sure I answered every part of the question"],
    ['A', 'My opinion is vague, or it only appears in the conclusion'],
    ['A', 'My Task 1 has no clear overview'],
    ['B', 'My paragraphs feel like a list of points'],
    ['B', 'I add linkers (Moreover, Furthermore) but the ideas still jump'],
    ['B', 'My Task 1 describes the chart left to right'],
    ['C', 'I repeat the same words, or use "big words" that sound odd'],
    ['C', 'I make word-choice and collocation errors'],
    ['C', 'I copy words from the question'],
    ['D', 'The same 3 or 4 grammar errors keep coming back'],
    ['D', 'I only use simple sentences to stay safe'],
    ['D', 'My complex sentences often contain mistakes'],
    ['E', 'I run out of time before the conclusion or the second body paragraph'],
    ['E', 'Task 1 takes me more than 20 minutes'],
    ['E', 'I never check my essay at the end'],
  ];

  diagRows.forEach(([area, text], idx) => {
    const rowH = 19.5;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 249, 255);
    doc.setDrawColor(232, 230, 242);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 30);
    doc.text(area, margin + 12, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(text, margin + 45, y + 13);
    // Checkbox square
    doc.setDrawColor(140, 135, 165);
    doc.roundedRect(pageWidth - margin - 23, y + 4.5, 10, 10, 2, 2, 'D');
    y += rowH;
  });

  y += 12;
  // Summary table
  doc.setFillColor(...theme.headerDark);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Letter', margin + 10, y + 13);
  doc.text('Area', margin + 65, y + 13);
  doc.text('Ticks', margin + 315, y + 13);
  doc.text('Go to', margin + 385, y + 13);
  y += 20;

  const summaryRows: Array<[string, string, string]> = [
    ['A', 'Task Achievement / Task Response', 'page 12 and page 29'],
    ['B', 'Coherence and Cohesion', 'page 13 and page 30'],
    ['C', 'Lexical Resource', 'page 54 and page 55'],
    ['D', 'Grammatical Range and Accuracy', 'page 51 and page 52'],
    ['E', 'Time and checking', 'page 11 and page 62'],
  ];

  summaryRows.forEach(([letter, area, gotoPage], idx) => {
    const rowH = 20;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 249, 255);
    doc.setDrawColor(232, 230, 242);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 30);
    doc.text(letter, margin + 12, y + 13.5);
    doc.setFont('helvetica', 'normal');
    doc.text(area, margin + 65, y + 13.5);
    doc.text('_ _ _ / 3', margin + 315, y + 13.5);
    doc.text(gotoPage, margin + 385, y + 13.5);
    y += rowH;
  });

  y += 14;
  doc.setFillColor(243, 239, 255);
  doc.setDrawColor(216, 180, 254);
  doc.roundedRect(margin, y, contentWidth, 54, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...theme.accent);
  doc.text('WHY IT MATTERS', margin + 12, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(25, 25, 35);
  doc.text(
    'The letter with the most ticks is where you start. A tie? Start with A. It’s the criterion most often',
    margin + 12,
    y + 32
  );
  doc.text('holding back essays that "sound fine".', margin + 12, y + 45);

  drawPageFooter(doc, theme, 'Writing', 'Where should you start?', 'Page 6', 5);

  // PAGE 3: Page 9 of 65 — Band 6 to 8: what actually changes
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'THE TEST', 'THE TEST');
  y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('Band 6 to 8: what ', margin, y);
  const wB68 = doc.getTextWidth('Band 6 to 8: what ');
  doc.setTextColor(...theme.accent);
  doc.text('actually changes', margin + wB68, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(70, 72, 85);
  doc.text(
    "Many students stall at 6.5 or 7 with good English. It's rarely a vocabulary problem. It's usually one of",
    margin,
    y
  );
  y += 13;
  doc.text('these four beliefs.', margin, y);

  y += 12;
  // 3-column table
  doc.setFillColor(...theme.headerDark);
  doc.rect(margin, y, contentWidth, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('What students believe', margin + 10, y + 15);
  doc.text('What really happens', margin + 145, y + 15);
  doc.text('What works instead', margin + 355, y + 15);
  y += 24;

  const beliefRows: Array<[string, string, string]> = [
    [
      'Bigger words mean a\nhigher score',
      'Rare words get misused and the sentence turns\nawkward.',
      'Precise, natural words that fit\nthe context.',
    ],
    [
      'Longer essays score\nhigher',
      'Extra length brings repeated ideas and more slips.',
      'A controlled 270 to 290\nwords, fully developed.',
    ],
    [
      'Memorised templates\nare safe',
      'The text stops answering your question. Generic\nopeners add nothing the examiner can reward.',
      'Structure built from the\nspecific prompt.',
    ],
    [
      'Every sentence must\nbe complex',
      'Constant complexity is tiring to read and breaks\nmore often.',
      'A planned mix of simple,\ncompound and complex.',
    ],
  ];

  beliefRows.forEach(([c1, c2, c3], idx) => {
    const rowH = 34;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 249, 255);
    doc.setDrawColor(232, 230, 242);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(25, 25, 35);
    doc.text(c1.split('\n'), margin + 10, y + 13);
    doc.text(c2.split('\n'), margin + 145, y + 13);
    doc.text(c3.split('\n'), margin + 355, y + 13);
    y += rowH;
  });

  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...theme.headerDark);
  doc.text('The same idea at three levels', margin, y);

  y += 14;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 102, 118);
  doc.text(
    'Question: Some people say that school homework should be abolished. Do you agree? One body paragraph, three versions.',
    margin,
    y
  );

  y += 12;
  const colGap = 10;
  const colW = (contentWidth - colGap * 2) / 3;
  const colH = 152;
  const threeVersions = [
    {
      badge: 'BAND 6',
      color: [120, 118, 148] as RGB,
      text: 'Homework is bad for students because they are tired. Also they need time for play. Many students dont sleep because of homework so they are not good in class.',
    },
    {
      badge: 'BAND 7',
      color: [91, 33, 182] as RGB,
      text: 'Homework should be limited because it leaves students exhausted. When children finish school at four and then study until ten, they have little time to rest or play. As a result, many arrive in class tired and learn less.',
    },
    {
      badge: 'BAND 8',
      color: [147, 51, 234] as RGB,
      text: 'Excessive homework tends to defeat its own purpose. A pupil who finishes school at four and studies until ten has little time left to rest, and tired minds retain far less. Several teachers I know now set short, focused tasks instead, and their classes seem sharper for it.',
    },
  ];

  threeVersions.forEach((v, idx) => {
    const cx = margin + idx * (colW + colGap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 222, 238);
    doc.roundedRect(cx, y, colW, colH, 6, 6, 'FD');

    doc.setFillColor(...v.color);
    doc.roundedRect(cx + 10, y + 10, 48, 14, 7, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(v.badge, cx + 34, y + 19.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(25, 25, 35);
    const lines = doc.splitTextToSize(v.text, colW - 20);
    doc.text(lines, cx + 10, y + 36);
  });

  y += colH + 14;
  doc.setFillColor(243, 239, 255);
  doc.setDrawColor(216, 180, 254);
  doc.roundedRect(margin, y, contentWidth, 56, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...theme.accent);
  doc.text('WHY IT MATTERS', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(25, 25, 35);
  const wimLines = doc.splitTextToSize(
    'Band 6 states a point and adds loose reasons. Band 7 builds a chain: because, so, as a result. Band 8 chooses what to say, says it precisely, and adds a believable example. The grammar is not "fancier". It’s tighter.',
    contentWidth - 24
  );
  doc.text(wimLines, margin + 12, y + 29);

  y += 66;
  doc.setFillColor(255, 245, 245);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(margin, y, contentWidth, 44, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(190, 18, 60);
  doc.text('REMEMBER', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(25, 25, 35);
  doc.text(
    "These three versions are my own teaching illustrations, with estimated levels. They're not official scores.",
    margin + 12,
    y + 30
  );

  drawPageFooter(doc, theme, 'Writing', 'Every task type at a glance', 'Page 10', 9);

  // PAGE 4: Page 38 of 65 — Fix this paragraph: 6 -> 7 -> 8
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'TASK 2', 'TASK 2 · FIX THIS PARAGRAPH');
  y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('Fix this paragraph: ', margin, y);
  const wFix = doc.getTextWidth('Fix this paragraph: ');
  doc.setTextColor(...theme.accent);
  doc.text('6 -> 7 -> 8', margin + wFix, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(70, 72, 85);
  doc.text(
    'One idea, three levels. Read all three, then look at the changes below. These are my teaching versions with estimated levels.',
    margin,
    y
  );

  y += 16;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 102, 118);
  doc.text(
    'Prompt: Social media does more harm than good for teenagers. To what extent do you agree? Body paragraph.',
    margin,
    y
  );

  y += 12;
  const socialVersions = [
    {
      badge: 'BAND 6',
      color: [120, 118, 148] as RGB,
      text: 'Social media is bad for teenagers because they spend many time on it. They dont study and they become lazy. Also some people bully them online so they feel sad.',
    },
    {
      badge: 'BAND 7',
      color: [91, 33, 182] as RGB,
      text: "Social media can damage teenagers' wellbeing because it takes up so much of their time. Students who scroll until midnight often study less and sleep badly. In addition, online bullying follows them home, which means they can feel unsafe in places that should be private.",
    },
    {
      badge: 'BAND 8',
      color: [147, 51, 234] as RGB,
      text: 'The most serious harm lies in what social media displaces. A teenager who scrolls until midnight loses sleep and revision time, and the effects show up in class within weeks. Bullying compounds this: unlike the playground, it follows them home, so there is nowhere they can switch it off.',
    },
  ];

  const sColH = 162;
  socialVersions.forEach((v, idx) => {
    const cx = margin + idx * (colW + colGap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 222, 238);
    doc.roundedRect(cx, y, colW, sColH, 6, 6, 'FD');

    doc.setFillColor(...v.color);
    doc.roundedRect(cx + 10, y + 10, 48, 14, 7, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(v.badge, cx + 34, y + 19.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(25, 25, 35);
    const lines = doc.splitTextToSize(v.text, colW - 20);
    doc.text(lines, cx + 10, y + 36);
  });

  y += sColH + 14;
  // What changed table
  doc.setFillColor(...theme.headerDark);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('What changed', margin + 10, y + 14);
  doc.text('Band 6 -> 7', margin + 115, y + 14);
  doc.text('Band 7 -> 8', margin + 310, y + 14);
  y += 22;

  const changeRows: Array<[string, string, string]> = [
    ['Point', '"bad" -> a specific harm (wellbeing)', 'Names the real mechanism: displaces'],
    ['Explain', 'One reason -> a chain (so, which means)', 'Chain is tighter, no filler'],
    ['Example', 'None -> a believable case', 'Same case, more precise (loses sleep and revision time)'],
    ['Grammar', 'Errors (many time, dont) fixed', 'Uses a contrast ("unlike the playground") with control'],
    ['Words', '"lazy, sad" -> "wellbeing, unsafe"', '"displaces, compounds": precise, not rare'],
  ];

  changeRows.forEach(([c1, c2, c3], idx) => {
    const rowH = 24;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 249, 255);
    doc.setDrawColor(232, 230, 242);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(25, 25, 35);
    doc.text(c1, margin + 10, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(c2, margin + 115, y + 15);
    doc.text(c3, margin + 310, y + 15);
    y += rowH;
  });

  y += 14;
  doc.setFillColor(243, 239, 255);
  doc.setDrawColor(216, 180, 254);
  doc.roundedRect(margin, y, contentWidth, 52, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...theme.accent);
  doc.text('WHY IT MATTERS', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(25, 25, 35);
  doc.text(
    'The jump from 6 to 7 is mostly development and accuracy. The jump from 7 to 8 is mostly',
    margin + 12,
    y + 30
  );
  doc.text("precision and selection. It's not a vocabulary leap.", margin + 12, y + 43);

  drawPageFooter(doc, theme, 'Writing', 'Fix this paragraph: your turn', 'Page 39', 38);

  // PAGE 5: Page 21 of 65 — Line Graph model answer
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'TASK 1', 'TASK 1 · MODEL ANSWERS');
  y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...theme.accent);
  doc.text('Line Graph ', margin, y);
  const wLG = doc.getTextWidth('Line Graph ');
  doc.setTextColor(15, 23, 42);
  doc.text('model answer', margin + wLG, y);

  y += 14;
  // White container card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(228, 224, 240);
  doc.roundedRect(margin, y, contentWidth, 455, 8, 8, 'FD');

  let cy = y + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...theme.accent);
  doc.text('MODEL 1 · LINE GRAPH', margin + 14, cy);

  cy += 16;
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('Public transport use in three cities', margin + 14, cy);

  cy += 10;
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin + 14, cy, contentWidth - 28, 34, 5, 5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(35, 35, 50);
  doc.text(
    'Prompt: The graph below shows the percentage of commuters using public transport in three cities',
    margin + 22,
    cy + 14
  );
  doc.text('between 1995 and 2020.', margin + 22, cy + 26);

  // Line Graph Illustration Box
  cy += 44;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(232, 230, 242);
  doc.roundedRect(margin + 14, cy, contentWidth - 28, 135, 5, 5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 30);
  doc.text('Commuters using public transport (%)', pageWidth / 2, cy + 16, { align: 'center' });

  // Draw grid lines & 3 lines (City A, B, C)
  const gx = margin + 55;
  const gy = cy + 28;
  const gw = contentWidth - 135;
  const gh = 82;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 135);
  [80, 60, 40, 20, 0].forEach((val, idx) => {
    const ly = gy + (gh / 4) * idx;
    doc.setDrawColor(238, 236, 245);
    doc.line(gx, ly, gx + gw, ly);
    doc.text(String(val), gx - 8, ly + 2.5, { align: 'right' });
  });

  const years = ['1995', '2000', '2005', '2010', '2015', '2020'];
  years.forEach((yr, idx) => {
    const lx = gx + (gw / 5) * idx;
    doc.text(yr, lx, gy + gh + 12, { align: 'center' });
  });

  const plotLine = (pts: number[], color: RGB, label: string) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(1.6);
    for (let i = 0; i < pts.length - 1; i++) {
      const x1 = gx + (gw / 5) * i;
      const y1 = gy + gh - (pts[i] / 80) * gh;
      const x2 = gx + (gw / 5) * (i + 1);
      const y2 = gy + gh - (pts[i + 1] / 80) * gh;
      doc.line(x1, y1, x2, y2);
    }
    const lastX = gx + gw;
    const lastY = gy + gh - (pts[pts.length - 1] / 80) * gh;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...color);
    doc.text(label, lastX + 8, lastY + 2.5);
  };

  plotLine([48, 54, 60, 65, 70, 72], [91, 33, 182], 'City A');
  plotLine([30, 36, 42, 47, 53, 58], [168, 85, 247], 'City B');
  plotLine([18, 21, 25, 33, 45, 55], [13, 148, 136], 'City C');
  doc.setLineWidth(0.5);

  cy += 150;
  // Model Essay Text
  const modelParas = [
    'The line graph compares the proportion of commuters relying on public transport in three cities over a 25-year period, from 1995 to 2020.',
    'Overall, public transport use rose in all three cities, though the pace and starting points varied considerably. City A led throughout, while City C started lowest but closed much of the gap by the end.',
    "In 1995, City A recorded the highest figure at 48%, well ahead of City B at 30% and City C at just 18%. Over the following decade, City A's figure climbed gradually to 60%, while City B trailed behind at 42% by 2005.",
    "From 2005 onwards, City C underwent the most dramatic change, rising sharply from 25% to 55% by 2020, almost matching City B's 58%. City A kept its lead throughout, reaching 72% by the end, although its rate of increase slowed noticeably after 2015.",
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(25, 25, 35);
  modelParas.forEach((p) => {
    const lines = doc.splitTextToSize(p, contentWidth - 28);
    doc.text(lines, margin + 14, cy);
    cy += lines.length * 13 + 7;
  });

  // Why This Works Box
  const wtwY = y + 468;
  doc.setFillColor(...theme.headerDark);
  doc.roundedRect(margin, wtwY, contentWidth, 72, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(216, 180, 254);
  doc.text('WHY THIS WORKS', margin + 12, wtwY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('•  The overview names the pattern (all rise, gap narrows) before any number appears.', margin + 12, wtwY + 30);
  doc.text(
    '•  Paragraphs are grouped by time period and by which city is doing something notable, not listed year by year.',
    margin + 12,
    wtwY + 45
  );
  doc.text(
    '•  Verbs vary naturally (climbed, trailed, underwent, kept) with no repeats.',
    margin + 12,
    wtwY + 60
  );

  drawPageFooter(doc, theme, 'Writing', 'Model 2: a bar chart', 'Page 22', 21);
}

/* ============================================================================
   MODULE 04: SPEAKING 5-PAGE PREVIEW (p. 1, 5, 41, 21, 49)
   ============================================================================ */
function buildSpeakingPreviewPdf(doc: jsPDF) {
  const theme = THEMES.speaking;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 38;
  const contentWidth = pageWidth - margin * 2;

  // PAGE 1: Cover
  drawCoverPage(
    doc,
    theme,
    'The all-in-one self-prep guide: Parts 1, 2 and 3, with pronunciation',
    [
      'Everything you need to prepare for Speaking on your own, in one PDF: frameworks,',
      'natural model answers, question banks, a pronunciation module and a mock interview',
      'a friend can run.',
    ],
    [
      { big: '8', lines: ['full Part 2 model answers'] },
      { big: '100', lines: ['Part 1 questions, 25', 'topics'] },
      { big: '72', lines: ['Part 3 questions, 12', 'themes'] },
      { big: '58', lines: ['Part 2 cue cards'] },
    ]
  );

  // PAGE 2: Page 5 of 59 — The 10-minute diagnostic
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'START HERE', 'START HERE · DIAGNOSTIC');
  let y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('The 10-minute ', margin, y);
  doc.setTextColor(91, 33, 182);
  doc.text('diagnostic', margin + doc.getTextWidth('The 10-minute '), y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(70, 72, 85);
  doc.text("Tick what's true for you. Be honest. Nobody is marking this.", margin, y);

  y += 12;
  doc.setFillColor(...theme.headerDark);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Area', margin + 10, y + 13);
  doc.text('Is this true for you?', margin + 45, y + 13);
  doc.text('Tick', pageWidth - margin - 26, y + 13);
  y += 20;

  const spkDiagRows: Array<[string, string]> = [
    ['A', 'My answers are short, or I stop and wait'],
    ['A', 'I pause for a long time to find words'],
    ['A', 'I lose my thread in Part 2'],
    ['B', 'I use the same few words again and again'],
    ['B', 'I try big words and they sound odd'],
    ['B', "I freeze when I can't think of a word"],
    ['C', 'I only use the present simple'],
    ['C', 'Long sentences often go wrong'],
    ['C', 'The same small errors keep coming back'],
    ['D', 'People ask me to repeat myself'],
    ['D', 'Every word gets the same stress'],
    ['D', 'I speak in single words, not groups'],
    ['E', 'I go blank in Part 3 abstract questions'],
    ['E', 'I sound memorised'],
    ['E', 'I get very nervous in the test'],
  ];

  spkDiagRows.forEach(([area, text], idx) => {
    const rowH = 19.5;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 249, 255);
    doc.setDrawColor(232, 230, 242);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 30);
    doc.text(area, margin + 12, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(text, margin + 45, y + 13);
    doc.setDrawColor(140, 135, 165);
    doc.roundedRect(pageWidth - margin - 23, y + 4.5, 10, 10, 2, 2, 'D');
    y += rowH;
  });

  y += 12;
  doc.setFillColor(...theme.headerDark);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Letter', margin + 10, y + 13);
  doc.text('Area', margin + 65, y + 13);
  doc.text('Ticks', margin + 315, y + 13);
  doc.text('Go to', margin + 385, y + 13);
  y += 20;

  const spkSumRows: Array<[string, string, string]> = [
    ['A', 'Fluency and Coherence', 'page 10, page 18'],
    ['B', 'Lexical Resource', 'page 43'],
    ['C', 'Grammatical Range and Accuracy', 'page 41'],
    ['D', 'Pronunciation', 'page 45'],
    ['E', 'Confidence and content', 'page 33, page 9'],
  ];

  spkSumRows.forEach(([letter, area, gotoPage], idx) => {
    const rowH = 20;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 249, 255);
    doc.setDrawColor(232, 230, 242);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 30);
    doc.text(letter, margin + 12, y + 13.5);
    doc.setFont('helvetica', 'normal');
    doc.text(area, margin + 65, y + 13.5);
    doc.text('_ _ _ / 3', margin + 315, y + 13.5);
    doc.text(gotoPage, margin + 385, y + 13.5);
    y += rowH;
  });

  y += 14;
  doc.setFillColor(243, 239, 255);
  doc.setDrawColor(216, 180, 254);
  doc.roundedRect(margin, y, contentWidth, 54, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(91, 33, 182);
  doc.text('WHY IT MATTERS', margin + 12, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(25, 25, 35);
  doc.text(
    'The letter with the most ticks is where you start. A tie? Start with A. Fluency problems often look',
    margin + 12,
    y + 32
  );
  doc.text('like vocabulary problems.', margin + 12, y + 45);

  drawPageFooter(doc, theme, 'Speaking', 'Where should you start?', 'Page 6', 5);

  // PAGE 3: Page 41 of 59 — Band 6, 7, 8: questions 1 to 3
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'PART 3', 'PART 3 · BAND COMPARISON');
  y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('Band 6, 7, 8: ', margin, y);
  doc.setTextColor(91, 33, 182);
  doc.text('questions 1 to 3', margin + doc.getTextWidth('Band 6, 7, 8: '), y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(70, 72, 85);
  doc.text(
    "The same question at three levels. These are my teaching illustrations with estimated levels. They're not official scores.",
    margin,
    y
  );

  const qBlocks = [
    {
      q: 'Do you like cooking? (Part 1)',
      b6: 'Yes, I like cooking. It is good. I cook rice and chicken sometimes. It is relaxing for me.',
      b7: 'Yes, I do, mostly at weekends. It relaxes me after a busy week, and I like trying new recipes.',
      b8: "I do, yeah, mainly at weekends. It's how I switch off, and last Friday I made fish curry for my family for the first time. They actually asked for seconds.",
    },
    {
      q: 'What do you do in your free time? (Part 1)',
      b6: 'I like to play games and watch movies. And sometimes I go with my friends. It is fun.',
      b7: "I usually play football with friends on Friday afternoons, and if I'm tired I just watch videos at home.",
      b8: "Mostly football on Fridays, though I've been trying to get into photography lately. If I'm wiped out, I'll just put something on and switch off.",
    },
    {
      q: 'Why do people prefer shopping online? (Part 3)',
      b6: 'People like online shopping because it is easy and they can buy many things. Also it is cheaper. They do not need to go out.',
      b7: "I think the main reason is convenience. People can compare prices and order at any time, which saves them a lot of effort, especially if they're busy.",
      b8: "I'd say it's mainly about convenience, which feeds into time. Someone working long hours can compare ten prices in a few minutes. Add free delivery and it becomes hard to compete with, for shops at least.",
    },
  ];

  const colGap = 10;
  const colW = (contentWidth - colGap * 2) / 3;

  y += 22;
  qBlocks.forEach((qb) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(qb.q, margin, y);
    y += 8;

    const cardH = 122;
    const cols = [
      { badge: 'BAND 6', color: [120, 118, 148] as RGB, text: qb.b6 },
      { badge: 'BAND 7', color: [91, 33, 182] as RGB, text: qb.b7 },
      { badge: 'BAND 8', color: [225, 29, 72] as RGB, text: qb.b8 },
    ];
    cols.forEach((c, idx) => {
      const cx = margin + idx * (colW + colGap);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(228, 224, 240);
      doc.roundedRect(cx, y, colW, cardH, 6, 6, 'FD');

      doc.setFillColor(...c.color);
      doc.roundedRect(cx + 10, y + 10, 48, 13, 6.5, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(255, 255, 255);
      doc.text(c.badge, cx + 34, y + 19, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(25, 25, 35);
      const lines = doc.splitTextToSize(c.text, colW - 20);
      doc.text(lines, cx + 10, y + 34);
    });

    y += cardH + 20;
  });

  drawPageFooter(doc, theme, 'Speaking', 'Band 6, 7, 8, continued', 'Page 42', 41);

  // PAGE 4: Page 21 of 59 — Part 2 model 1
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'PART 2', 'PART 2 · MODEL ANSWERS');
  y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('Part 2 ', margin, y);
  doc.setTextColor(91, 33, 182);
  doc.text('model 1', margin + doc.getTextWidth('Part 2 '), y);

  y += 16;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(228, 224, 240);
  doc.roundedRect(margin, y, contentWidth, 355, 8, 8, 'FD');

  let cy = y + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...theme.accent);
  doc.text('MODEL 1 · ABOUT 262 WORDS · SPOKEN STYLE', margin + 14, cy);

  cy += 16;
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('Describe a time you helped someone', margin + 14, cy);

  cy += 10;
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin + 14, cy, contentWidth - 28, 36, 5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(49, 27, 114);
  doc.text(
    'You should say: who you helped · what you did · why they needed help · how it ended and how you felt',
    margin + 22,
    cy + 14
  );
  doc.text('4-word prep notes: Arif · algebra · dining table · proud', margin + 22, cy + 27);

  cy += 52;
  const part2Story =
    "I'd like to talk about the time I helped my neighbour's son with his maths. His name's Arif, he was about thirteen, and this was last year, just before his exams. His mum knocked on our door one evening, looking a bit worried, and asked if I could 'have a quick look' at his homework. Well, it turned out to be a lot more than a quick look. He was stuck on algebra, and honestly, he'd more or less given up. So I sat with him at their dining table, and instead of showing him the answers, I asked him to explain what he thought the question meant. That was the turning point, actually. Half the time he already knew what to do. He just didn't trust himself. We worked for an hour every evening for about three weeks. I kept it simple: one idea a day, a few examples, and a tiny test at the end. I remember the first time he solved a problem without me. He literally shouted 'I got it!' and his little sister came running in to see what had happened. In the end he passed with a good grade, and his mum brought us biryani the next week, which, I won't lie, was a big part of the reward. But what I really took from it, looking back, is that I felt useful. I hadn't realised how much I enjoy explaining things until then, and it's probably why I'm thinking about teaching one day. So yeah, it was a small thing, but it's stayed with me.";

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(25, 25, 35);
  const storyLines = doc.splitTextToSize(part2Story, contentWidth - 28);
  doc.text(storyLines, margin + 14, cy);

  const wtwY = y + 370;
  doc.setFillColor(...theme.headerDark);
  doc.roundedRect(margin, wtwY, contentWidth, 92, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(216, 180, 254);
  doc.text('WHY THIS WORKS', margin + 12, wtwY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(255, 255, 255);
  doc.text('•  FLUENCY: Opens with a clear topic, then tells a story in order. "Well" and "actually" are used lightly.', margin + 12, wtwY + 33);
  doc.text('•  LEXICAL: "given up", "turning point", "tiny test": everyday phrases, no rare words.', margin + 12, wtwY + 49);
  doc.text('•  GRAMMAR: Past simple for the story, past perfect "he\'d given up", present perfect "it\'s stayed with me".', margin + 12, wtwY + 65);
  doc.text('•  PRONUNC.: Stress "SOLVED" and "WITHOUT me". Pause after "turning point".', margin + 12, wtwY + 81);

  drawPageFooter(doc, theme, 'Speaking', 'Model 2: a place', 'Page 22', 21);

  // PAGE 5: Page 49 of 59 — Common difficulties for Bangla speakers
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'PRONUNCIATION', 'PRONUNCIATION · COMMON DIFFICULTIES');
  y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('Common difficulties for Bangla speakers:', margin, y);
  y += 22;
  doc.setTextColor(91, 33, 182);
  doc.text('tendencies, not rules', margin, y);

  y += 14;
  doc.setFillColor(255, 245, 245);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(margin, y, contentWidth, 56, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...theme.accent);
  doc.text('READ THIS FIRST', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(25, 25, 35);
  doc.text(
    'These are patterns that some Bangla speakers show, based on how the two languages are',
    margin + 12,
    y + 30
  );
  doc.text(
    "built. You may have none of them, or others I haven't listed. Record yourself first. Only work on what you actually hear.",
    margin + 12,
    y + 44
  );

  y += 68;
  doc.setFillColor(...theme.headerDark);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Tendency', margin + 10, y + 14);
  doc.text('Example', margin + 185, y + 14);
  doc.text('Try', margin + 315, y + 14);
  y += 22;

  const banglaRows: Array<[string, string, string]> = [
    [
      'A vowel added before s +\nconsonant at the start of a word',
      'school -> "iskool",\nstation -> "istation"',
      'Start with a long "sss" and then add the\nconsonant: sss-kool.',
    ],
    [
      'th sounds replaced by t or d',
      'think -> "tink", this -> "dis"',
      'Put the tongue lightly between the teeth.\nBlow for think, hum for this.',
    ],
    [
      'v and w blended or swapped with b',
      'very / berry, wine / vine',
      'For v, touch top teeth to bottom lip. For w,\nround your lips and don\'t touch.',
    ],
    [
      'Final consonant clusters shortened',
      'asked -> "ask", months -> "month"',
      'Say each consonant lightly: ask-t, month-s.',
    ],
    [
      'Syllable-timed rhythm (each\nsyllable equal)',
      '"I-want-to-go-to-the-mar-ket"',
      'See rhythm and chunking, page 46.',
    ],
    [
      'Vowel length differences',
      'ship / sheep, full / fool',
      'Make the long vowel clearly longer. Record\nboth and compare.',
    ],
  ];

  banglaRows.forEach(([c1, c2, c3], idx) => {
    const rowH = 31;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 249, 255);
    doc.setDrawColor(232, 230, 242);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(25, 25, 35);
    doc.text(c1.split('\n'), margin + 10, y + 12);
    doc.text(c2.split('\n'), margin + 185, y + 12);
    doc.text(c3.split('\n'), margin + 315, y + 12);
    y += rowH;
  });

  y += 12;
  doc.setFillColor(...theme.headerDark);
  doc.roundedRect(margin, y, contentWidth, 64, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(216, 180, 254);
  doc.text('WHAT TO DO', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('•  Record 30 seconds of normal speaking. Listen for the tendencies above.', margin + 12, y + 30);
  doc.text('•  Pick one. Practise it in single words, then phrases, then your own sentences.', margin + 12, y + 44);
  doc.text('•  Check it again after a week.', margin + 12, y + 57);

  y += 74;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 222, 238);
  doc.roundedRect(margin, y, contentWidth, 46, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(91, 33, 182);
  doc.text('TEACHING TIP', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(25, 25, 35);
  doc.text(
    "Accent isn't the problem. Unclear words are. You don't need to sound British or American. You need to be easy to understand.",
    margin + 12,
    y + 31
  );

  drawPageFooter(doc, theme, 'Speaking', 'The recording rubric', 'Page 50', 49);
}

/* ============================================================================
   MODULE 02: READING 5-PAGE PREVIEW (p. 1, 5, 13, 14, 39)
   ============================================================================ */
function buildReadingPreviewPdf(doc: jsPDF) {
  const theme = THEMES.reading;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 38;
  const contentWidth = pageWidth - margin * 2;

  // PAGE 1: Cover
  drawCoverPage(
    doc,
    theme,
    'The all-in-one self-prep guide',
    [
      'Everything you need to prepare for Academic Reading on your own,',
      'in one PDF: method, drills, three full practice passages with',
      'explanations, and a way to track your progress.',
    ],
    [
      { big: '3', lines: ['full original practice', 'passages with', 'explanations'] },
      { big: '60', lines: ['paraphrase pairs'] },
      { big: '42', lines: ['drill questions across', '14 question types'] },
      { big: '1', lines: ['error log, timing log', 'and tracker'] },
    ]
  );

  // PAGE 2: Page 5 of 48 — The 10-minute diagnostic
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'START HERE', 'START HERE · DIAGNOSTIC');
  let y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('The 10-minute diagnostic', margin, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(70, 72, 85);
  doc.text(
    'Think about your last two or three Reading tests. Tick every sentence that is true for you. Nobody is marking this.',
    margin,
    y
  );

  y += 14;
  // 2x2 Grid of diagnostic boxes
  const boxGap = 12;
  const boxW = (contentWidth - boxGap) / 2;
  const boxH = 122;
  const readingGroups = [
    {
      title: 'A · Time',
      items: [
        'I run out of time on Passage 3.',
        'I read every word of the passage before the questions.',
        'I spend over two minutes on one question.',
      ],
    },
    {
      title: 'B · True / False / Not Given',
      items: [
        'I use what I know instead of what the text says.',
        'I confuse False with Not Given.',
        'I pick Yes/No by feeling, not evidence.',
      ],
    },
    {
      title: 'C · Matching',
      items: [
        'I choose a heading because one word matches.',
        'I forget there are extra headings.',
        'Matching information takes me far too long.',
      ],
    },
    {
      title: 'D · Words and details',
      items: [
        'Synonyms in the passage lose me.',
        'I break the word limit or copy the wrong form.',
        "I fall for options that are true but don't answer the question.",
      ],
    },
  ];

  readingGroups.forEach((grp, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = margin + col * (boxW + boxGap);
    const by = y + row * (boxH + boxGap);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 222, 238);
    doc.roundedRect(bx, by, boxW, boxH, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(grp.title, bx + 12, by + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    doc.setTextColor(35, 38, 48);
    let iy = by + 38;
    grp.items.forEach((it) => {
      doc.setDrawColor(91, 33, 182);
      doc.roundedRect(bx + 12, iy - 8, 10, 10, 2, 2, 'D');
      const lines = doc.splitTextToSize(it, boxW - 38);
      doc.text(lines, bx + 28, iy);
      iy += lines.length * 11 + 12;
    });
  });

  y += boxH * 2 + boxGap + 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Count your ticks', margin, y);

  y += 10;
  doc.setFillColor(...theme.headerDark);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Group', margin + 10, y + 14);
  doc.text('My ticks (0–3)', margin + 185, y + 14);
  doc.text('If this is your highest, start on', margin + 315, y + 14);
  y += 22;

  const rSumRows: Array<[string, string]> = [
    ['A · Time', 'pages 9, 11–12'],
    ['B · True / False / Not Given', 'pages 13, 18, 25'],
    ['C · Matching', 'pages 14–15, 24'],
    ['D · Words and details', 'pages 10, 20–23'],
  ];

  rSumRows.forEach(([g, p], idx) => {
    const rowH = 22;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 249, 255);
    doc.setDrawColor(232, 230, 242);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(25, 25, 35);
    doc.text(g, margin + 10, y + 14);
    doc.text(p, margin + 315, y + 14);
    y += rowH;
  });

  y += 14;
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(13, 148, 136);
  doc.roundedRect(margin, y, contentWidth, 56, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...theme.accent);
  doc.text('WHAT TO DO', margin + 12, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(25, 25, 35);
  doc.text(
    'Start with your highest group. Tied? Pick the one you avoid. Zero ticks everywhere? Do Passage 1',
    margin + 12,
    y + 32
  );
  doc.text(
    '(page 29) under time, then come back, because you may not have seen your problem yet.',
    margin + 12,
    y + 45
  );

  drawPageFooter(doc, theme, 'Reading', 'The Reading test in one page', 'Page 6', 5);

  // PAGE 3: Page 13 of 48 — True / False / Not Given and Yes / No / Not Given
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'SKILLS', 'SKILLS · PLAYBOOK 1');
  y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('True / False / Not Given and ', margin, y);
  doc.setTextColor(91, 33, 182);
  doc.text('Yes / No / Not Given', margin + doc.getTextWidth('True / False / Not Given and '), y);

  y += 16;
  const colGap = 10;
  const colW = (contentWidth - colGap * 2) / 3;
  const tfBoxes = [
    {
      title: 'TRUE / YES',
      bar: [13, 148, 136] as RGB,
      desc: 'The text says the same thing,\nin different words.',
    },
    {
      title: 'FALSE / NO',
      bar: [225, 29, 72] as RGB,
      desc: 'The text says the opposite or\nsomething that clearly\nconflicts.',
    },
    {
      title: 'NOT GIVEN',
      bar: [148, 163, 184] as RGB,
      desc: "The text doesn't say, however\nsensible it sounds.",
    },
  ];

  tfBoxes.forEach((b, idx) => {
    const cx = margin + idx * (colW + colGap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(228, 224, 240);
    doc.roundedRect(cx, y, colW, 74, 6, 6, 'FD');
    doc.setFillColor(...b.bar);
    doc.rect(cx + 8, y, colW - 16, 3.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(b.title, cx + 12, y + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(45, 48, 60);
    doc.text(b.desc.split('\n'), cx + 12, y + 38);
  });

  y += 90;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(25, 25, 35);
  doc.text(
    "True/False/Not Given tests facts. Yes/No/Not Given tests the writer's opinion or claim. The method is the same.",
    margin,
    y
  );

  y += 12;
  doc.setFillColor(...theme.headerDark);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Passage says', margin + 10, y + 14);
  doc.text('Statement', margin + 185, y + 14);
  doc.text('Answer', margin + 335, y + 14);
  doc.text('Why', margin + 405, y + 14);
  y += 22;

  const tfTable: Array<[string, string, string, string]> = [
    [
      'The library opens at 9 a.m. on\nweekdays and is closed on Sundays.',
      'The library is open every day.',
      'FALSE',
      'Closed Sundays:\nopposite',
    ],
    ['...same text...', 'It opens at 9 a.m. on Saturdays.', 'NOT GIVEN', "Saturday isn't\nmentioned"],
    ['...same text...', 'The library has over 10,000 books.', 'NOT GIVEN', 'Nothing about books'],
    [
      'Some scientists suggest the effect\nmay be temporary.',
      'Scientists agree the effect is\ntemporary.',
      'FALSE',
      'Some suggest is not\nagree',
    ],
  ];

  tfTable.forEach(([c1, c2, c3, c4], idx) => {
    const rowH = 32;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 249, 255);
    doc.setDrawColor(232, 230, 242);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(25, 25, 35);
    doc.text(c1.split('\n'), margin + 10, y + 12);
    doc.text(c2.split('\n'), margin + 185, y + 12);
    doc.setFont('helvetica', 'bold');
    doc.text(c3, margin + 335, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(c4.split('\n'), margin + 405, y + 12);
    y += rowH;
  });

  y += 16;
  // 4 Step Cards
  const stepGap = 8;
  const stepW = (contentWidth - stepGap * 3) / 4;
  const steps4 = [
    'Underline the claim.',
    'Find the place in the\ntext.',
    'Ask: can I point to the\nwords that prove it?',
    'Yes, same: True.\nOpposite: False. No\nwords: Not Given.',
  ];
  steps4.forEach((st, idx) => {
    const sx = margin + idx * (stepW + stepGap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 222, 238);
    doc.roundedRect(sx, y, stepW, 64, 6, 6, 'FD');

    doc.setFillColor(91, 33, 182);
    doc.circle(sx + stepW / 2, y + 16, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(String(idx + 1), sx + stepW / 2, y + 18.8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(25, 25, 35);
    doc.text(st.split('\n'), sx + stepW / 2, y + 34, { align: 'center' });
  });

  y += 78;
  doc.setFillColor(243, 239, 255);
  doc.setDrawColor(216, 180, 254);
  doc.roundedRect(margin, y, contentWidth, 56, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(91, 33, 182);
  doc.text('WHY YOU LOSE MARKS', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(25, 25, 35);
  doc.text(
    'Your brain answers from the real world. If the statement is plausible, you say True. IELTS asks',
    margin + 12,
    y + 30
  );
  doc.text(
    'only: what does this text say? If you catch yourself building a story to make it "could still be true", it\'s probably Not Given.',
    margin + 12,
    y + 43
  );

  y += 66;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 222, 238);
  doc.roundedRect(margin, y, contentWidth, 50, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(91, 33, 182);
  doc.text('TEACHING TIP · MY METHOD, NOT AN OFFICIAL RULE', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(25, 25, 35);
  doc.text(
    'Watch tiny words that change meaning: all, every, only, never, always, some, most, may, will. A statement with one extra strong word is usually False or Not Given.',
    margin + 12,
    y + 31
  );

  drawPageFooter(doc, theme, 'Reading', 'Playbook: Matching Headings', 'Page 14', 13);

  // PAGE 4: Page 14 of 48 — Matching Headings
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'SKILLS', 'SKILLS · PLAYBOOK 2');
  y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('Matching ', margin, y);
  doc.setTextColor(91, 33, 182);
  doc.text('Headings', margin + doc.getTextWidth('Matching '), y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(45, 48, 60);
  doc.text(
    'You match a heading to a whole paragraph. The test checks the main idea, not a detail. The list has',
    margin,
    y
  );
  y += 13;
  doc.text('more headings than paragraphs: the extra ones are distractors.', margin, y);

  y += 14;
  // 5 Step Cards
  const s5Gap = 6;
  const s5W = (contentWidth - s5Gap * 4) / 5;
  const steps5 = [
    'Read the\nheadings first.\nUnderline the\nmain idea.',
    "Read each\nparagraph's first\nand last\nsentence.",
    'Ask: what is this\nmostly about?',
    'Do easy ones\nfirst. Cross out\nused headings.',
    'Check the\nleftovers last.',
  ];
  steps5.forEach((st, idx) => {
    const sx = margin + idx * (s5W + s5Gap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 222, 238);
    doc.roundedRect(sx, y, s5W, 74, 6, 6, 'FD');

    doc.setFillColor(91, 33, 182);
    doc.circle(sx + s5W / 2, y + 15, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(String(idx + 1), sx + s5W / 2, y + 17.8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(25, 25, 35);
    doc.text(st.split('\n'), sx + s5W / 2, y + 32, { align: 'center' });
  });

  y += 88;
  // Stacked callout boxes
  const mhBoxes = [
    {
      label: 'PARAGRAPH',
      color: [91, 33, 182] as RGB,
      bg: [255, 255, 255] as RGB,
      text: '“Many councils now offer free bicycles for short trips. Residents unlock a bike with a phone app and leave it at any station. Early results suggest that fewer people drive to work, and air quality near the centre has slightly improved.”',
      h: 64,
    },
    {
      label: 'TEMPTING BUT WRONG',
      color: [225, 29, 72] as RGB,
      bg: [255, 245, 246] as RGB,
      text: 'Improving city air quality. It matches one detail (the last clause), not the whole paragraph.',
      h: 46,
    },
    {
      label: 'BETTER',
      color: [13, 148, 136] as RGB,
      bg: [240, 253, 250] as RGB,
      text: 'A bike-sharing scheme and its early effects. It covers how the scheme works and what happened.',
      h: 46,
    },
    {
      label: 'WHY IT HAPPENS',
      color: [91, 33, 182] as RGB,
      bg: [245, 243, 255] as RGB,
      text: 'Examiners write distractors from details. A heading that matches one sentence, a number or an opinion inside the paragraph looks right until you ask whether it covers the whole paragraph.',
      h: 56,
    },
    {
      label: 'WHAT TO DO',
      color: [13, 148, 136] as RGB,
      bg: [255, 255, 255] as RGB,
      text: '• If two headings seem right, choose the broader one.\n• A heading about cause when the paragraph is about effects is a trap.\n• Don\'t read the whole passage first. Use the skim map you built.',
      h: 66,
    },
  ];

  mhBoxes.forEach((b) => {
    doc.setFillColor(...b.bg);
    doc.setDrawColor(228, 224, 240);
    doc.roundedRect(margin, y, contentWidth, b.h, 6, 6, 'FD');
    doc.setFillColor(...b.color);
    doc.rect(margin, y + 6, 3.5, b.h - 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...b.color);
    doc.text(b.label, margin + 12, y + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(25, 25, 35);
    const lines = doc.splitTextToSize(b.text, contentWidth - 24);
    doc.text(lines, margin + 12, y + 29);
    y += b.h + 10;
  });

  drawPageFooter(
    doc,
    theme,
    'Reading',
    'Playbook: matching information, features, sentence endings',
    'Page 15',
    14
  );

  // PAGE 5: Page 39 of 48 — How to review a test, step by step
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'REVIEW', 'REVIEW');
  y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('How to review a test, ', margin, y);
  doc.setTextColor(91, 33, 182);
  doc.text('step by step', margin + doc.getTextWidth('How to review a test, '), y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(70, 72, 85);
  doc.text('About 45 minutes for a full test. This is where scores move.', margin, y);

  y += 14;
  const revSteps = [
    'Mark and count\neach passage.',
    'Find the\nevidence in the\ntext. Underline it.',
    'Label the cause:\nK, S or C.',
    'Name the trap\n(1–8).',
    'Log it. Choose\none fix.',
  ];
  revSteps.forEach((st, idx) => {
    const sx = margin + idx * (s5W + s5Gap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 222, 238);
    doc.roundedRect(sx, y, s5W, 64, 6, 6, 'FD');

    doc.setFillColor(91, 33, 182);
    doc.circle(sx + s5W / 2, y + 15, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(String(idx + 1), sx + s5W / 2, y + 17.8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(25, 25, 35);
    doc.text(st.split('\n'), sx + s5W / 2, y + 32, { align: 'center' });
  });

  y += 78;
  // K / S / C table
  doc.setFillColor(...theme.headerDark);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Letter', margin + 10, y + 14);
  doc.text('Cause', margin + 55, y + 14);
  doc.text('How to tell', margin + 215, y + 14);
  doc.text('What to do', margin + 365, y + 14);
  y += 22;

  const kscRows: Array<[string, string, string, string]> = [
    [
      'K',
      "Knowledge. You didn't know\nthe word or couldn't follow the\ntext.",
      "Even with extra time, you'd still\nget it wrong",
      'Learn the word in context (pages\n20–23)',
    ],
    [
      'S',
      'Strategy. You knew enough\nbut used the wrong method, or\nran out of time.',
      'Extra time would have helped,\nor you chose by one keyword',
      'Playbook pages 13–17, traps 18–19',
    ],
    [
      'C',
      'Careless. You knew the\nanswer and wrote it wrongly.',
      'You see it at once when you\nreview',
      'Slow down at the writing step;\ncheck word limit and spelling',
    ],
  ];

  kscRows.forEach(([l, c1, c2, c3], idx) => {
    const rowH = 38;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 249, 255);
    doc.setDrawColor(232, 230, 242);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(25, 25, 35);
    doc.text(l, margin + 12, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(c1.split('\n'), margin + 55, y + 12);
    doc.text(c2.split('\n'), margin + 215, y + 12);
    doc.text(c3.split('\n'), margin + 365, y + 12);
    y += rowH;
  });

  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('A worked example', margin, y);

  y += 10;
  doc.setFillColor(...theme.headerDark);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(255, 255, 255);
  doc.text('Q', margin + 8, y + 13);
  doc.text('My answer', margin + 35, y + 13);
  doc.text('Correct', margin + 105, y + 13);
  doc.text('K/S/C', margin + 168, y + 13);
  doc.text('Trap', margin + 205, y + 13);
  doc.text('What happened', margin + 240, y + 13);
  doc.text('Next time', margin + 380, y + 13);
  y += 20;

  const workedRows: Array<[string, string, string, string, string, string, string]> = [
    ['3', 'FALSE', 'NOT GIVEN', 'S', '7', 'Used what I know about sparrows', 'Ask: can I point to the words?'],
    ['18', 'ii', 'vi', 'S', '5', 'Chose a detail as a heading', 'Pick the heading for the whole paragraph'],
    ['37', 'one month', 'a month', 'C', '8', "Changed the text's words", 'Copy exactly'],
  ];

  workedRows.forEach((r, idx) => {
    const rowH = 22;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 249, 255);
    doc.setDrawColor(232, 230, 242);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(25, 25, 35);
    doc.text(r[0], margin + 8, y + 14);
    doc.text(r[1], margin + 35, y + 14);
    doc.text(r[2], margin + 105, y + 14);
    doc.text(r[3], margin + 168, y + 14);
    doc.text(r[4], margin + 205, y + 14);
    doc.text(r[5], margin + 240, y + 14);
    doc.text(r[6], margin + 380, y + 14);
    y += rowH;
  });

  y += 14;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 222, 238);
  doc.roundedRect(margin, y, contentWidth, 68, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(91, 33, 182);
  doc.text('CHECK YOURSELF', margin + 14, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(25, 25, 35);
  ['I know the cause of every wrong answer.', 'I underlined the evidence for every wrong answer.', 'I chose one fix for my next test.'].forEach(
    (chk, idx) => {
      const cy2 = y + 30 + idx * 15;
      doc.setDrawColor(91, 33, 182);
      doc.roundedRect(margin + 14, cy2 - 8, 9, 9, 2, 2, 'D');
      doc.text(chk, margin + 28, cy2);
    }
  );

  drawPageFooter(doc, theme, 'Reading', 'Your error log', 'Page 40', 39);
}

/* ============================================================================
   MODULE 01: LISTENING 5-PAGE PREVIEW (p. 1, 5, 15, 16, 28)
   ============================================================================ */
function buildListeningPreviewPdf(doc: jsPDF) {
  const theme = THEMES.listening;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 38;
  const contentWidth = pageWidth - margin * 2;

  // PAGE 1: Cover
  drawCoverPage(
    doc,
    theme,
    'The all-in-one self-prep guide',
    [
      'Everything you need to prepare for Listening on your own, in one PDF:',
      'method, drills, four original practice sections with scripts, and a way',
      'to track your progress.',
    ],
    [
      { big: '4', lines: ['original practice sections'] },
      { big: '60', lines: ['paraphrase pairs'] },
      { big: '50', lines: ['numbers and spelling', 'items'] },
      { big: '1', lines: ['error log and tracker'] },
    ]
  );

  // PAGE 2: Page 5 of 50 — The 10-minute diagnostic
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'START HERE', 'START HERE · DIAGNOSTIC');
  let y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('The 10-minute ', margin, y);
  doc.setTextColor(91, 33, 182);
  doc.text('diagnostic', margin + doc.getTextWidth('The 10-minute '), y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(70, 72, 85);
  doc.text(
    "Tick every sentence that's true for you. Be honest. Nobody is marking this. If you've done a Listening test recently, think about your last three.",
    margin,
    y
  );

  y += 14;
  doc.setFillColor(...theme.headerDark);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Area', margin + 10, y + 13);
  doc.text('Is this true for you?', margin + 145, y + 13);
  doc.text('Tick', pageWidth - margin - 26, y + 13);
  y += 20;

  const lstDiagRows: Array<[string, string, string]> = [
    ['A', 'Reading ahead', 'I only look at the question when the audio reaches it'],
    ['', '', 'I rarely guess what kind of answer a gap needs'],
    ['B', 'Traps', 'I write the first answer I hear, then it changes'],
    ['', '', 'I lose marks on multiple choice even when I understood'],
    ['C', 'Spelling and format', 'I hear the word but spell it wrongly'],
    ['', '', 'I lose marks on plurals, numbers or the word limit'],
    ['D', 'Sound and speed', 'Fast, linked speech makes words disappear'],
    ['', '', 'I mishear numbers like 15 and 50'],
    ['E', 'Focus', 'One missed answer makes me miss the next three'],
    ['', '', 'I lose my place in maps or long lectures'],
    ['F', 'Review habit', 'I check my score but not why I lost marks'],
    ['', '', "I can't name my three most common listening mistakes"],
  ];

  lstDiagRows.forEach(([letter, area, text], idx) => {
    const rowH = 22;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 249, 255);
    doc.setDrawColor(232, 230, 242);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    if (letter) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(20, 20, 30);
      doc.text(letter, margin + 10, y + 14);
      doc.text(area, margin + 32, y + 14);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(25, 25, 35);
    doc.text(text, margin + 145, y + 14);
    doc.setDrawColor(91, 33, 182);
    doc.roundedRect(pageWidth - margin - 23, y + 6, 10, 10, 2, 2, 'D');
    y += rowH;
  });

  y += 16;
  doc.setFillColor(...theme.headerDark);
  doc.roundedRect(margin, y, contentWidth, 44, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(216, 180, 254);
  doc.text('WHAT TO DO', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'Count your ticks for each letter (0, 1 or 2). Turn the page to see where each letter sends you.',
    margin + 12,
    y + 31
  );

  drawPageFooter(doc, theme, 'Listening', 'Where to start', 'Page 6', 5);

  // PAGE 3: Page 15 of 50 — Four traps that cost marks
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'SKILLS', 'SKILLS');
  y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('Four traps ', margin, y);
  doc.setTextColor(91, 33, 182);
  doc.text('that cost marks', margin + doc.getTextWidth('Four traps '), y);

  y += 14;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(91, 33, 182);
  doc.roundedRect(margin, y, contentWidth, 42, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(91, 33, 182);
  doc.text('YOU MIGHT HAVE THIS PROBLEM', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(20, 20, 30);
  doc.text('You heard every word. You wrote a sensible answer. It was still wrong.', margin + 12, y + 30);

  y += 56;
  const traps4 = [
    {
      title: '1 · The self-correction',
      lines: [
        '"Let\'s book the hall for the 12th... actually, hold on, the caterers can\'t come until the 14th, so let\'s go with the 15th instead."',
        'The 12th and the 14th are both distractors. Correction words: actually, sorry, no wait, I mean, rather, instead.',
      ],
    },
    {
      title: '2 · Included and excluded',
      lines: [
        '"The fee covers the pool, the gym and the tennis courts, everything apart from the sauna."',
        'One word (apart from, other than, except, but not) flips the answer.',
      ],
    },
    {
      title: '3 · Singular and plural',
      lines: [
        '"two passport photographs". The final -s is quick and quiet. Read the sentence around the gap: two before the gap tells you the answer is plural.',
      ],
    },
    {
      title: '4 · Similar-sounding numbers',
      lines: [
        "15 and 50, 13 and 30. In fifteen the stress is on the second part: fif-TEEN. In fifty it's on the first: FIF-ty. Listen for the stress, then look at the context. A £15 ticket and a £50 ticket are very different.",
      ],
    },
  ];

  traps4.forEach((tr) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...theme.headerDark);
    doc.text(tr.title, margin, y);
    y += 6;

    const textCombined = tr.lines.join('\n');
    const wrapped = doc.splitTextToSize(textCombined, contentWidth - 24);
    const boxH = wrapped.length * 12 + 16;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(228, 224, 240);
    doc.roundedRect(margin, y, contentWidth, boxH, 5, 5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.6);
    doc.setTextColor(25, 25, 35);
    doc.text(wrapped, margin + 12, y + 14);
    y += boxH + 14;
  });

  doc.setFillColor(...theme.headerDark);
  doc.roundedRect(margin, y, contentWidth, 64, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(216, 180, 254);
  doc.text('WHAT TO DO', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('•  Keep your pen on the answer until the speaker has finished the clause.', margin + 12, y + 30);
  doc.text('•  Write corrections beside the old answer. Decide in the review time.', margin + 12, y + 44);
  doc.text('•  Re-read your answer inside the sentence before moving on.', margin + 12, y + 57);

  y += 74;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(228, 224, 240);
  doc.roundedRect(margin, y, contentWidth, 44, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(91, 33, 182);
  doc.text('TEACHING TIP', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  doc.setTextColor(25, 25, 35);
  doc.text(
    "These four traps appear in almost every Section 1 and Section 3 I've practised. The practice sections in this guide all contain at least two of them on purpose.",
    margin + 12,
    y + 29
  );

  drawPageFooter(doc, theme, 'Listening', 'Traps practice and the panic plan', 'Page 16', 15);

  // PAGE 4: Page 16 of 50 — Trap practice and the panic plan
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'SKILLS', 'SKILLS');
  y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('Trap ', margin, y);
  doc.setTextColor(91, 33, 182);
  doc.text('practice ', margin + doc.getTextWidth('Trap '), y);
  doc.setTextColor(15, 23, 42);
  doc.text('and the panic plan', margin + doc.getTextWidth('Trap practice '), y);

  y += 14;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(13, 148, 136);
  doc.roundedRect(margin, y, contentWidth, 108, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(13, 148, 136);
  doc.text("TRY THIS: WHAT'S THE ANSWER?", margin + 12, y + 16);

  const tryItems = [
    '1. "Departure is nine fifteen, no, sorry, that\'s the return. We leave at eight forty-five." Departure: ______',
    '2. "Room 12 was our first choice, but the projector\'s broken, so we\'ve moved to Room 9." Room: ______',
    '3. "Bring a photo and proof of address. A passport works too, but it isn\'t essential." Two items needed: ______ and ______',
    '4. "Students may use the archive at any time other than Saturday mornings." Unavailable: ______',
    '5. "That\'s a hundred and fifty pounds, not fifteen." Cost: £ ______',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.4);
  doc.setTextColor(25, 25, 35);
  tryItems.forEach((it, idx) => {
    doc.text(it, margin + 12, y + 32 + idx * 15);
  });

  y += 118;
  doc.setFillColor(243, 239, 255);
  doc.setDrawColor(216, 180, 254);
  doc.roundedRect(margin, y, contentWidth, 46, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(91, 33, 182);
  doc.text('ANSWERS', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(25, 25, 35);
  const ansLines = doc.splitTextToSize(
    '1) 8.45 (signal: no, sorry). 2) 9 (signal: but ... so we\'ve moved). 3) photo (photograph) and proof of address. The passport is explicitly not essential. 4) Saturday mornings (other than). 5) 150 (not fifteen is a correction).',
    contentWidth - 24
  );
  doc.text(ansLines, margin + 12, y + 29);

  y += 66;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('The panic plan', margin, y);

  y += 10;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(91, 33, 182);
  doc.roundedRect(margin, y, contentWidth, 42, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(91, 33, 182);
  doc.text('YOU MIGHT HAVE THIS PROBLEM', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 30);
  doc.text("You miss one answer. You spend three questions thinking about it. Now you've missed four.", margin + 12, y + 30);

  y += 52;
  doc.setFillColor(...theme.headerDark);
  doc.roundedRect(margin, y, contentWidth, 64, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(216, 180, 254);
  doc.text('WHAT TO DO: 3 STEPS, 5 SECONDS', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(255, 255, 255);
  doc.text('1. Write a guess. A blank is a guaranteed zero.', margin + 12, y + 30);
  doc.text('2. Breathe out once.', margin + 12, y + 44);
  doc.text('3. Put your pen on the current question number and read ahead to the next gap.', margin + 12, y + 57);

  y += 74;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 222, 238);
  doc.roundedRect(margin, y, contentWidth, 82, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(91, 33, 182);
  doc.text('CHECK YOURSELF', margin + 12, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(25, 25, 35);
  [
    'I keep my pen on the answer until the clause ends.',
    'I let a missed answer go immediately.',
    'I re-read my answer inside the sentence.',
    'On multiple choice, I wait for the final decision.',
  ].forEach((chk, idx) => {
    const cy2 = y + 29 + idx * 14;
    doc.setDrawColor(91, 33, 182);
    doc.roundedRect(margin + 12, cy2 - 7.5, 9, 9, 2, 2, 'D');
    doc.text(chk, margin + 26, cy2);
  });

  drawPageFooter(doc, theme, 'Listening', 'Paraphrase bank', 'Page 17', 16);

  // PAGE 5: Page 28 of 50 — Section 1: key and evidence
  doc.addPage();
  drawTopNavAndPill(doc, theme, 'PRACTICE', 'PRACTICE · KEY');
  y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('Section 1: ', margin, y);
  doc.setTextColor(91, 33, 182);
  doc.text('key and evidence', margin + doc.getTextWidth('Section 1: '), y);

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 102, 118);
  doc.text('Highlighted [Answer #] = the answer and its number. (Distractors noted in brackets).', margin, y);

  y += 16;
  const scriptLines: Array<[string, string]> = [
    ['Maya:', 'Riverside Arts Centre, Maya speaking. How can I help?'],
    ['Hana:', "Hi. I'm ringing about a beginners' course I saw advertised. I think it was watercolour?"],
    ['Maya:', "Ah, watercolour finished last term. At the moment we've got beginners' printmaking, and a drawing class that starts in November."],
    ['Hana:', "Printmaking sounds good, actually. I've never tried it."],
    ['Maya:', 'Great. Can I take some details first?'],
    ['Hana:', "Of course. It's Hana, H-A-N-A, Pettigrew."],
    ['Maya:', 'Could you spell the surname for me?'],
    ['Hana:', 'Yes.  [1] P-E-double T-I-G-R-E-W.'],
    ['Maya:', 'Pettigrew. Lovely. And a contact number?'],
    ['Hana:', "My mobile's  [2] oh seven seven four one, nine oh five, three three six."],
    ['Maya:', "So that's 07741, 905, 336. And your postcode?"],
    ['Hana:', "It's  [3] B N three, five Q T."],
    ['Maya:', 'B N three, five Q T. Thanks. And which course was it you wanted? You mentioned watercolour at first.'],
    ['Hana:', 'Yes, but you said that had finished, so  [4] printmaking  please.'],
    ['Maya:', "No problem. The beginners' course usually runs on Thursday evenings, but I'm afraid that group is full. There's a second group on Wednesdays, though."],
    ['Hana:', 'Thursday would have been easier, but  [5] Wednesday  is fine.'],
    ['Maya:', "It was going to start at seven, but they've brought it forward so people can get home before dark. It starts at  [6] half past six."],
    ['Hana:', "That's fine. And how much is it?"],
    ['Maya:', "It's eight weeks. The full fee is a hundred and twenty pounds (distractor), but members get a discount."],
    ['Hana:', 'I joined in the summer.'],
    ['Maya:', 'Then you pay  [7] ninety-five.'],
    ['Hana:', 'Okay. Are there any extra costs?'],
    ['Maya:', "There's a materials fee. Last year it was fifteen (distractor), but this year it's  [8] twelve pounds, paid in cash to the tutor on the first night."],
    ['Hana:', 'Do I need to bring anything?'],
    ['Maya:', 'Just an  [9] apron. We provide the paper, the ink and the tools. Some people bring an old shirt (distractor), but an apron works better.'],
    ['Hana:', 'Great. And where do I go?'],
    ['Maya:', 'Pottery is on the ground floor, and Studio 2 (distractor) is the one with the big windows, but printmaking is upstairs in  [10] Studio 4.'],
    ['Hana:', 'Studio 4. Wonderful. Thanks very much.'],
    ['Maya:', 'See you in the new term, Hana.'],
  ];

  scriptLines.forEach(([speaker, line]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.4);
    doc.setTextColor(...theme.headerDark);
    doc.text(speaker, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(25, 25, 35);
    const wrapped = doc.splitTextToSize(line, contentWidth - 42);
    doc.text(wrapped, margin + 36, y);
    y += wrapped.length * 11.5 + 4;
  });

  drawPageFooter(doc, theme, 'Listening', 'Why each answer is right', 'Page 29', 28);
}

export async function generateAndDownloadSampleChapterPdf(moduleId: GuideModuleId): Promise<void> {
  const guide = getGuideById(moduleId);
  if (!guide) return;

  const downloadFileName = `IELTS-DECODED-${guide.moduleName}-Sample-Chapter-5p.pdf`;

  // 1. Check if static PDF exists in /public first
  const downloadedStatic = await tryDownloadStaticPreviewPdf(moduleId, downloadFileName);
  if (downloadedStatic) return;

  // 2. Otherwise generate the exact 5-page Free Preview PDF for this module
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  if (moduleId === 'writing') {
    buildWritingPreviewPdf(doc);
  } else if (moduleId === 'speaking') {
    buildSpeakingPreviewPdf(doc);
  } else if (moduleId === 'reading') {
    buildReadingPreviewPdf(doc);
  } else {
    buildListeningPreviewPdf(doc);
  }

  doc.save(downloadFileName);
}
