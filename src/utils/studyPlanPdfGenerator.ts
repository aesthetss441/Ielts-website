import { jsPDF } from 'jspdf';
import { SITE_CONFIG, wa } from '../config';
import { SELF_PREP_GUIDES } from '../guidesConfig';
import { GeneratedStudyPlan, StudyPlanProgressMap } from '../studyPlanEngine';

// Official IELTS DECODED Logo SVG (/public/logo.svg) for high-DPI canvas rasterization
const LOGO_SVG_MARKUP = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 200 200" fill="none">
  <defs>
    <linearGradient id="id-ribbon" x1="112" y1="48" x2="105" y2="108" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#9B7EDE"/>
      <stop offset="50%" stop-color="#DDD2FA"/>
      <stop offset="100%" stop-color="#8B68D6"/>
    </linearGradient>
  </defs>
  <path d="M 71 45 L 92 31 V 96 H 71 Z" fill="#0A0A0A"/>
  <path d="M 100 52 L 114 48 L 131 57 C 136 60 138 65 138 72 C 138 88 126 99 100 108 Z" fill="#0A0A0A"/>
  <path d="M 114 48 L 131 57 C 132 68 128 74 121 82 C 114 90 107 98 100 108 C 103 93 106 82 112 73 C 118 64 120 56 114 48 Z" fill="url(#id-ribbon)"/>
  <text x="100" y="142" text-anchor="middle" fill="#0A0A0A" font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="22" letter-spacing="6">IELTS</text>
  <text x="100" y="162" text-anchor="middle" fill="#0A0A0A" font-family="Helvetica, Arial, sans-serif" font-weight="normal" font-size="15" letter-spacing="6">DECODED</text>
</svg>`;

async function getLogoPngDataUrl(): Promise<string | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const svgBlob = new Blob([LOGO_SVG_MARKUP], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 240;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 240, 240);
            const pngUrl = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            resolve(pngUrl);
            return;
          }
        } catch {
          // ignore canvas error
        }
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

function sanitizePdfText(text: string): string {
  return String(text || '')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/✓/g, '[Done]')
    .replace(/·/g, '|')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, ' - ')
    .replace(/–/g, '-')
    .replace(/…/g, '...');
}

export async function downloadStudyPlanPdf(
  plan: GeneratedStudyPlan,
  progress: StudyPlanProgressMap = {}
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm

  const logoPng = await getLogoPngDataUrl();
  const whatsappUrl = wa(plan.recommendedDecodeOffer.primaryWaMessage);
  const enrollWaUrl = wa('ENROLL');
  const crashWaUrl = wa('CRASH');
  const guidesWaUrl = wa('GUIDES_GENERAL');

  // Brand Palette (RGB)
  const COLOR_INK: [number, number, number] = [20, 20, 19];
  const COLOR_MUTED: [number, number, number] = [95, 92, 86];
  const COLOR_VIOLET: [number, number, number] = [91, 46, 224]; // #5B2EE0
  const COLOR_RED: [number, number, number] = [184, 50, 40]; // Examiner Red
  const COLOR_IVORY: [number, number, number] = [247, 244, 238];
  const COLOR_PAPER: [number, number, number] = [252, 250, 246];
  const COLOR_RULE: [number, number, number] = [218, 213, 204];

  let y = 18;

  const drawRunningHeaderAndFooter = (pageNum: number) => {
    // Top subtle running header on pages > 1
    if (pageNum > 1) {
      doc.setDrawColor(...COLOR_RULE);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_INK);
      doc.text('IELTS DECODED', margin, 9.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLOR_MUTED);
      doc.text(
        sanitizePdfText(
          `${plan.input.durationDays}-Day Personalized Study Plan | Target Band ${plan.input.targetOverallBand}`
        ),
        pageWidth - margin,
        9.5,
        { align: 'right' }
      );
    }

    // Bottom running footer with branding & clickable WhatsApp CTA on EVERY page
    const footerY = pageHeight - 12;
    doc.setDrawColor(...COLOR_RULE);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_INK);
    doc.text(
      `IELTS DECODED by ${SITE_CONFIG.founder.name} (IELTS Overall ${SITE_CONFIG.founder.overallBand} | ${SITE_CONFIG.founder.moduleScores})`,
      margin,
      footerY
    );

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_VIOLET);
    const ctaFooterText = `Need 1-to-1 feedback or classes? WhatsApp: ${SITE_CONFIG.whatsapp.displayNumber} (+${SITE_CONFIG.whatsapp.internationalNumber})`;
    doc.textWithLink(ctaFooterText, margin, footerY + 4, { url: whatsappUrl });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_MUTED);
    doc.text(`Page ${pageNum}`, pageWidth - margin, footerY + 2, { align: 'right' });
  };

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 18;
    }
  };

  // =========================================================================
  // PAGE 1: BRANDED HEADER BANNER + STUDENT SUMMARY + 4 STAGES
  // =========================================================================
  doc.setFillColor(...COLOR_IVORY);
  doc.setDrawColor(...COLOR_INK);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, 34, 'FD');

  if (logoPng) {
    doc.addImage(logoPng, 'PNG', margin + 4, y + 3, 26, 26);
  } else {
    // Fallback monogram badge if image fails
    doc.setFillColor(...COLOR_INK);
    doc.rect(margin + 5, y + 5, 22, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ID', margin + 16, y + 18, { align: 'center' });
  }

  const headerTextX = margin + 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_RED);
  doc.text('IELTS DECODED | PERSONALIZED STUDY PLAN & CURRICULUM', headerTextX, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLOR_INK);
  const titleLines = doc.splitTextToSize(sanitizePdfText(plan.planTitle), contentWidth - 40);
  doc.text(titleLines[0] || 'My Personalized IELTS Study Plan', headerTextX, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(
    sanitizePdfText(
      `Instructor: ${SITE_CONFIG.founder.name} (IELTS Overall ${SITE_CONFIG.founder.overallBand}: ${SITE_CONFIG.founder.moduleScores} | Edexcel IGCSE English Grade 9)`
    ),
    headerTextX,
    y + 21.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_VIOLET);
  doc.textWithLink(
    `WhatsApp Coaching & Self-Prep Guides: ${SITE_CONFIG.whatsapp.displayNumber} (Click to Chat ->)`,
    headerTextX,
    y + 28,
    { url: whatsappUrl }
  );

  y += 40;

  // Student Profile Summary Strip
  doc.setFillColor(...COLOR_PAPER);
  doc.setDrawColor(...COLOR_RULE);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 16, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('YOUR PROFILE & STUDY GOAL', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_INK);
  doc.text(sanitizePdfText(plan.studentProfileSummary), margin + 4, y + 11.5);

  y += 21;

  // How to Follow Your Study Plan Note
  const noteLines = doc.splitTextToSize(
    sanitizePdfText(plan.realisticExpectationNote),
    contentWidth - 8
  );
  const noteBoxHeight = Math.max(16, noteLines.length * 4.5 + 9);
  doc.setFillColor(...COLOR_IVORY);
  doc.setDrawColor(...COLOR_INK);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, contentWidth, noteBoxHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_RED);
  doc.text('HOW TO FOLLOW THIS PLAN STEP BY STEP:', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_INK);
  doc.text(noteLines, margin + 4, y + 10.5);

  y += noteBoxHeight + 5;

  // Optional Ambitious Target Note
  if (plan.ambitiousTargetWarning) {
    const warnLines = doc.splitTextToSize(
      sanitizePdfText(plan.ambitiousTargetWarning),
      contentWidth - 8
    );
    const warnHeight = warnLines.length * 4.2 + 7;
    doc.setFillColor(253, 242, 242);
    doc.setDrawColor(...COLOR_RED);
    doc.rect(margin, y, contentWidth, warnHeight, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_RED);
    doc.text(warnLines, margin + 4, y + 5);
    y += warnHeight + 5;
  }

  // 4 Study Stages Overview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_INK);
  doc.text(
    sanitizePdfText(
      `YOUR 4 STUDY STAGES (Reading ${plan.moduleAllocationPercent.reading}% | Writing ${plan.moduleAllocationPercent.writing}% | Listening ${plan.moduleAllocationPercent.listening}% | Speaking ${plan.moduleAllocationPercent.speaking}%)`
    ),
    margin,
    y
  );
  y += 3.5;

  plan.phases.forEach((phase) => {
    const phaseText = `${phase.dayRangeLabel} - ${phase.phaseName}: ${phase.focusSummary}`;
    const phaseLines = doc.splitTextToSize(sanitizePdfText(phaseText), contentWidth - 6);
    const boxH = phaseLines.length * 4 + 4;
    ensureSpace(boxH + 3);
    doc.setFillColor(...COLOR_PAPER);
    doc.setDrawColor(...COLOR_RULE);
    doc.rect(margin, y, contentWidth, boxH, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_INK);
    doc.text(phaseLines, margin + 3, y + 4);
    y += boxH + 2;
  });

  y += 4;

  // =========================================================================
  // DAY-BY-DAY STUDY PLAN (DAY 1 TO DAY N)
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_INK);
  ensureSpace(15);
  doc.text(
    `YOUR DAY-BY-DAY IELTS STUDY SCHEDULE (DAY 1 TO DAY ${plan.days.length})`,
    margin,
    y
  );
  y += 5;

  for (const day of plan.days) {
    const isCompleted = Boolean(progress[day.dayNumber]?.completed);
    const dayHeaderLabel = sanitizePdfText(
      `DAY ${day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber} | ${day.title} (${day.questionTypeTag})${
        isCompleted ? ' [COMPLETED]' : ''
      }`
    );

    const goalLines = doc.splitTextToSize(
      sanitizePdfText(`Today's Goal: ${day.primaryObjective}`),
      contentWidth - 8
    );

    const taskLinesList: string[][] = day.specificStudyTasks.map((t, idx) => {
      const cleanTask = t.replace(/^\d+\.\s*/, '');
      return doc.splitTextToSize(
        sanitizePdfText(`${idx + 1}. ${cleanTask}`),
        contentWidth - 10
      );
    });

    const materialLines = doc.splitTextToSize(
      sanitizePdfText(`What Material to Use: ${day.practiceMaterial}`),
      contentWidth - 8
    );

    const checkLinesList: string[][] = day.reviewAndErrorAnalysis.map((r) =>
      doc.splitTextToSize(sanitizePdfText(`- ${r}`), contentWidth - 10)
    );

    const finishLinesList: string[][] = day.successCriteria.map((c) =>
      doc.splitTextToSize(sanitizePdfText(`[ ] ${c}`), contentWidth - 10)
    );

    // Calculate approximate total height of this day card
    let cardHeight = 9; // header bar
    cardHeight += goalLines.length * 4 + 3;
    cardHeight += 5; // "What to Do Today:" heading
    taskLinesList.forEach((lines) => {
      cardHeight += lines.length * 3.9 + 1;
    });
    cardHeight += materialLines.length * 3.9 + 3;
    cardHeight += 5; // "How to Check Your Work:" heading
    checkLinesList.forEach((lines) => {
      cardHeight += lines.length * 3.9 + 1;
    });
    cardHeight += 5; // "What You Should Finish Today:" heading
    finishLinesList.forEach((lines) => {
      cardHeight += lines.length * 3.9 + 1;
    });
    cardHeight += 4;

    ensureSpace(cardHeight + 4);

    const cardStartY = y;

    // Outer card border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...COLOR_RULE);
    doc.setLineWidth(0.35);
    doc.rect(margin, cardStartY, contentWidth, cardHeight, 'FD');

    // Day Header Strip
    doc.setFillColor(...COLOR_INK);
    doc.rect(margin, cardStartY, contentWidth, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    const headerWrapped = doc.splitTextToSize(dayHeaderLabel, contentWidth - 6);
    doc.text(headerWrapped[0], margin + 3, cardStartY + 5.2);

    let cy = cardStartY + 11.5;

    // Goal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_VIOLET);
    doc.text(goalLines, margin + 4, cy);
    cy += goalLines.length * 4 + 2;

    // What to Do Today
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(...COLOR_INK);
    doc.text('What to Do Today:', margin + 4, cy);
    cy += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(...COLOR_INK);
    taskLinesList.forEach((lines) => {
      doc.text(lines, margin + 6, cy);
      cy += lines.length * 3.9 + 1;
    });

    cy += 1;

    // Material
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(materialLines, margin + 4, cy);
    cy += materialLines.length * 3.9 + 2;

    // How to Check Your Work
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(...COLOR_RED);
    doc.text('How to Check Your Work:', margin + 4, cy);
    cy += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_INK);
    checkLinesList.forEach((lines) => {
      doc.text(lines, margin + 6, cy);
      cy += lines.length * 3.9 + 1;
    });

    cy += 1;

    // What You Should Finish Today
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(...COLOR_INK);
    doc.text('What You Should Finish Today:', margin + 4, cy);
    cy += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_MUTED);
    finishLinesList.forEach((lines) => {
      doc.text(lines, margin + 6, cy);
      cy += lines.length * 3.9 + 1;
    });

    y = cardStartY + cardHeight + 4;
  }

  // =========================================================================
  // FINAL BRANDED CONVERSION CTA BLOCK (COURSES, 1-TO-1 & SELF-PREP GUIDES)
  // =========================================================================
  ensureSpace(82);

  doc.setFillColor(...COLOR_IVORY);
  doc.setDrawColor(...COLOR_INK);
  doc.setLineWidth(0.6);
  doc.rect(margin, y, contentWidth, 78, 'FD');

  // Top Accent Bar
  doc.setFillColor(...COLOR_VIOLET);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'WANT PERSONAL FEEDBACK WHILE FOLLOWING THIS STUDY PLAN? STUDY WITH IELTS DECODED',
    margin + 4,
    y + 5.4
  );

  let ctaY = y + 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_INK);
  doc.text(
    sanitizePdfText(`Recommended Next Step: ${plan.recommendedDecodeOffer.primaryTitle}`),
    margin + 4,
    ctaY
  );
  ctaY += 5;

  const reasonLines = doc.splitTextToSize(
    sanitizePdfText(plan.recommendedDecodeOffer.primaryReason),
    contentWidth - 8
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(reasonLines, margin + 4, ctaY);
  ctaY += reasonLines.length * 4.2 + 3;

  // 3 Offer Pillars inside CTA Box
  const offers = [
    {
      title: '1. 12-Week Band 7+ Live Roadmap Batch (BDT 7,999)',
      desc: '3 live classes/week (90 mins each), max 10 students per batch, personal red-pen Writing & Speaking feedback.',
      link: enrollWaUrl,
    },
    {
      title: '2. 1-Month 1-to-1 Private Live Crash Course (BDT 9,999)',
      desc: '12 private 1-on-1 live classes built strictly around your weakest question types and exam deadline.',
      link: crashWaUrl,
    },
    {
      title: `3. 4-Module Self-Prep PDF Guides (BDT ${SELF_PREP_GUIDES[0]?.priceBdt || 499} each | All 4 for BDT 1,499 - Save BDT 500)`,
      desc: 'Reading, Writing, Listening & Speaking workbooks + 50% PDF fee credit if you join a live course within 14 days.',
      link: guidesWaUrl,
    },
  ];

  offers.forEach((off) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_VIOLET);
    doc.textWithLink(sanitizePdfText(`${off.title} -> Click to Message on WhatsApp`), margin + 4, ctaY, {
      url: off.link,
    });
    ctaY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_INK);
    doc.text(sanitizePdfText(off.desc), margin + 7, ctaY);
    ctaY += 5.5;
  });

  // Bottom Direct Contact Bar inside CTA Box
  doc.setFillColor(...COLOR_INK);
  doc.rect(margin + 4, y + 65, contentWidth - 8, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.textWithLink(
    `Message ${SITE_CONFIG.founder.name} on WhatsApp: ${SITE_CONFIG.whatsapp.displayNumber} (+${SITE_CONFIG.whatsapp.internationalNumber}) | Click Here to Open WhatsApp ->`,
    margin + 8,
    y + 70.8,
    { url: whatsappUrl }
  );

  // Add running headers & footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawRunningHeaderAndFooter(p);
  }

  const fileName = `IELTS_DECODED_${plan.input.durationDays}_Day_Study_Plan_Band_${plan.input.targetOverallBand}.pdf`;
  doc.save(fileName);
}
