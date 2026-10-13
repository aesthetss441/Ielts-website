import React, { useState } from 'react';
import {
  buildReferralUrl,
  buildToolResultToJubayerWaMessage,
  getWaUrl,
  trackSiteEvent,
  trackWaClick,
} from '../config';
import { IconArrowDown, IconArrowUpRight } from './EditorialGraphics';

export interface MistakeDnaCardProps {
  toolName: string;
  targetBand: string;
  currentBand?: string;
  bottleneckSkill: string;
  topErrorType: string;
  kscTag?: '[K] Knowledge' | '[S] Skill' | '[C] Care' | string;
  actionFix?: string;
  examDate?: string;
  referralPath?: string;
}

export function MistakeDnaCardGenerator({
  toolName,
  targetBand,
  currentBand,
  bottleneckSkill,
  topErrorType,
  kscTag = '[S] Skill Execution & Exam Strategy',
  actionFix = 'Stop doing blind mock tests. Isolate this exact bottleneck with targeted drills.',
  examDate,
  referralPath = '',
}: MistakeDnaCardProps) {
  const [copiedRef, setCopiedRef] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const handleDownloadDnaImage = () => {
    setIsGeneratingCard(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background Paper
      ctx.fillStyle = '#F7F4EE';
      ctx.fillRect(0, 0, 1080, 1080);

      // Top Ink Banner
      ctx.fillStyle = '#141413';
      ctx.fillRect(0, 0, 1080, 150);

      // Brand Title
      ctx.fillStyle = '#FAF8F4';
      ctx.font = 'bold 34px Georgia, serif';
      ctx.fillText('IELTS DECODED', 64, 72);

      ctx.fillStyle = '#E11D48';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('MISTAKE DNA DIAGNOSTIC REPORT · [K / S / C] SYSTEM', 64, 114);

      // Outer Editorial Frame
      ctx.strokeStyle = '#141413';
      ctx.lineWidth = 3;
      ctx.strokeRect(48, 190, 984, 760);

      // Target & Current Band Strip
      ctx.fillStyle = '#EFECE4';
      ctx.fillRect(50, 192, 980, 145);

      ctx.fillStyle = '#6B675E';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('DIAGNOSTIC SOURCE', 84, 240);
      ctx.fillStyle = '#141413';
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText(toolName, 84, 288);

      ctx.fillStyle = '#6B675E';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('TARGET BAND', 740, 240);
      ctx.fillStyle = '#6D28D9';
      ctx.font = 'bold 54px Georgia, serif';
      ctx.fillText(`Band ${targetBand}`, 740, 300);

      // Divider
      ctx.strokeStyle = '#D5CFC2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(48, 337);
      ctx.lineTo(1032, 337);
      ctx.stroke();

      // Primary Bottleneck Skill
      ctx.fillStyle = '#B91C1C';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('#1 BOTTLENECK SKILL HOLDING BACK YOUR BAND', 84, 405);

      ctx.fillStyle = '#141413';
      ctx.font = 'bold 44px Georgia, serif';
      ctx.fillText(bottleneckSkill.slice(0, 40), 84, 465);

      // Top Error Type Box
      ctx.fillStyle = '#FEF2F2';
      ctx.fillRect(84, 510, 912, 165);
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 2;
      ctx.strokeRect(84, 510, 912, 165);

      ctx.fillStyle = '#B91C1C';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`ROOT CAUSE CLASSIFICATION: ${kscTag.toUpperCase()}`, 112, 554);

      ctx.fillStyle = '#141413';
      ctx.font = 'bold 28px Georgia, serif';
      const words = topErrorType.split(' ');
      let line = '';
      let y = 602;
      for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > 850) {
          ctx.fillText(line.trim(), 112, y);
          line = word + ' ';
          y += 38;
        } else {
          line = testLine;
        }
      }
      if (line.trim()) {
        ctx.fillText(line.trim(), 112, y);
      }

      // Actionable Fix Box
      ctx.fillStyle = '#F0FDF4';
      ctx.fillRect(84, 705, 912, 145);
      ctx.strokeStyle = '#16A34A';
      ctx.strokeRect(84, 705, 912, 145);

      ctx.fillStyle = '#15803D';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('YOUR NEXT STEP TO FIX THIS ONCE:', 112, 748);

      ctx.fillStyle = '#141413';
      ctx.font = '24px Georgia, serif';
      ctx.fillText(actionFix.slice(0, 68), 112, 795);
      if (actionFix.length > 68) {
        ctx.fillText(actionFix.slice(68, 136), 112, 828);
      }

      // Bottom Footer
      ctx.fillStyle = '#141413';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(
        'Guided by Jubayer (Band 8.5 Overall · Reading 9.0 · Listening 9.0)',
        84,
        910
      );

      ctx.fillStyle = '#6B675E';
      ctx.font = '20px monospace';
      ctx.fillText(
        'Free Diagnostic Tools & Self-Prep Guides · WhatsApp: +880 1305-273703',
        64,
        1015
      );

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `IELTS-DECODED-Mistake-DNA-Band-${targetBand}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      trackSiteEvent('mistake_dna_downloaded', {
        toolName,
        targetBand,
        bottleneckSkill,
      });
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const referralUrl = buildReferralUrl(referralPath);
  const friendShareWaText = `Hey! If you're aiming for Band 6.5+ in IELTS, check out this free ${toolName} on IELTS DECODED — it pinpoints the exact mistake holding your band score back: ${referralUrl}`;
  const friendShareWaHref = `https://wa.me/?text=${encodeURIComponent(friendShareWaText)}`;

  const sendToJubayerMsg = buildToolResultToJubayerWaMessage({
    toolName,
    currentBand,
    targetBand,
    bottleneck: `${bottleneckSkill} (${topErrorType})`,
    examDate,
  });

  const handleCopyReferral = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl).catch(() => {});
      setCopiedRef(true);
      trackSiteEvent('referral_shared', { toolName, method: 'copy_link' });
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  return (
    <div className="mt-6 border border-rule-strong bg-ivory p-5 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-examiner-red block">
            MISTAKE DNA CARD · SAVE OR SEND TO JUBAYER
          </span>
          <h4 className="mt-1 font-serif text-xl sm:text-2xl text-ink font-normal">
            Your Diagnostic Snapshot:{' '}
            <span className="text-examiner-red">{bottleneckSkill}</span>
          </h4>
          <p className="mt-1 text-xs sm:text-sm text-ink-muted">
            Root Cause: <strong className="text-ink">{topErrorType}</strong> · Target:{' '}
            <strong className="text-ink">Band {targetBand}</strong>
            {currentBand ? ` (Current: Band ${currentBand})` : ''}
          </p>
        </div>

        {/* Item 17: Send this result to Jubayer WhatsApp Button */}
        <a
          href={getWaUrl(sendToJubayerMsg)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWaClick(`SEND_RESULT_TO_JUBAYER_${toolName}`)}
          className="min-h-[44px] px-5 py-2.5 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors shrink-0"
        >
          <span>Send This Result to Jubayer on WhatsApp</span>
          <IconArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Item 13 & 14: Mistake DNA Image Download + Referral Share Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadDnaImage}
            disabled={isGeneratingCard}
            className="min-h-[38px] px-4 py-2 border border-ink bg-paper hover:bg-ink hover:text-paper text-ink font-mono text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <IconArrowDown className="w-3.5 h-3.5" />
            <span>
              {isGeneratingCard
                ? 'Generating DNA Card…'
                : 'Download Mistake DNA Card (PNG)'}
            </span>
          </button>

          <a
            href={friendShareWaHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackSiteEvent('referral_shared', { toolName, method: 'whatsapp_friend' })
            }
            className="min-h-[38px] px-4 py-2 border border-rule-strong bg-paper hover:border-ink text-ink font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Send to a friend who needs 6.5+</span>
            <IconArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={handleCopyReferral}
            className="min-h-[38px] px-3.5 py-2 border border-rule bg-paper hover:border-ink text-ink-muted hover:text-ink font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
          >
            {copiedRef ? 'Link Copied!' : 'Copy Share Link'}
          </button>
        </div>

        <span className="font-mono text-[11px] text-ink-muted">
          No personal details included on the Mistake DNA image
        </span>
      </div>
    </div>
  );
}
