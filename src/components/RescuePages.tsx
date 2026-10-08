import React from 'react';

export interface RescuePageData {
  id: string;
  fileSlug: string;
  pageNumber: number;
  totalPages: number;
  caption: string;
  kicker: string;
  title: string;
  altText: string;
  imageUrl?: string; // Supports "/page-01.webp", "/Screenshot 2026-10-05 014431.png", etc.
}

export const RESCUE_PAGES: RescuePageData[] = [
  {
    id: 'page-01',
    fileSlug: 'page-01',
    pageNumber: 1,
    totalPages: 38,
    caption: 'Cover · Score Rescue',
    kicker: 'IELTS DECODED',
    title: 'IELTS BAND 7+ SCORE RESCUE',
    altText: 'Cover page of IELTS Band 7+ Score Rescue: A simple guide to finding what is actually holding your IELTS score back and what to do about it.',
    imageUrl: '/page-01.webp',
  },
  {
    id: 'page-02',
    fileSlug: 'page-02',
    pageNumber: 2,
    totalPages: 38,
    caption: 'Start Here · Diagnostic Router',
    kicker: 'START HERE',
    title: 'Where should I start?',
    altText: 'Start Here page: Where should I start? Pick the sentence that sounds most like you, routing to Pages 6, 7, 8, 9, 14, 22, and 26.',
    imageUrl: '/page-02.webp',
  },
  {
    id: 'page-03',
    fileSlug: 'page-03',
    pageNumber: 6,
    totalPages: 38,
    caption: '10-Min Diagnostic',
    kicker: 'FIND YOUR PROBLEM',
    title: 'Which one sounds like you?',
    altText: 'Page 6 Diagnostic: Which one sounds like you? Look at your last 3 mock tests. Where do you lose the most marks across Reading, Writing, Speaking, and Listening.',
    imageUrl: '/page-03.webp',
  },
  {
    id: 'page-04',
    fileSlug: 'page-04',
    pageNumber: 34,
    totalPages: 38,
    caption: 'Personal Dashboard',
    kicker: 'TRACK · DASHBOARD',
    title: 'My IELTS dashboard',
    altText: 'Track Dashboard page: My IELTS dashboard — Print it. Fill it in. Stick it where you study. Includes target score, module breakdown, and mistake tracker.',
    imageUrl: '/page-04.webp',
  },
];

const TOP_NAV_PILLS = ['DIAGNOSE', 'READING', 'LISTENING', 'WRITING', 'SPEAKING', 'TRACK', 'NEXT STEP'];

/**
 * Renders the exact visual fidelity of the user's uploaded PDF screenshots
 * (Cover, Where should I start?, Which one sounds like you?, My IELTS dashboard),
 * while also attempting to load any static file placed in /public (e.g. /page-01.webp)
 * with explicit 900x840 dimensions and zero layout shift.
 */
export function PdfPageArtwork({ pageIndex }: { pageIndex: number }) {
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const page = RESCUE_PAGES[pageIndex] || RESCUE_PAGES[0];

  return (
    <div
      className="relative w-full aspect-[900/840] bg-[#FAF8FF] text-[#111024] overflow-hidden select-none font-sans"
      style={{ aspectRatio: '900 / 840' }}
    >
      {/* Optional static WebP/PNG file override if placed in /public */}
      {page.imageUrl && (
        <img
          src={page.imageUrl}
          alt={page.altText}
          width={900}
          height={840}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
          className={`absolute inset-0 w-full h-full object-cover z-20 transition-opacity duration-200 ${
            imgLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
      )}

      {/* High-fidelity exact recreation of Screenshot 1: Cover Page */}
      {pageIndex === 0 && (
        <div className="w-full h-full p-6 sm:p-8 flex flex-col justify-between bg-[#F7F5FF] relative">
          <div className="inline-flex self-start px-3.5 py-1 rounded-full bg-white border border-[#E2DCFF] text-[10px] font-bold tracking-[0.16em] text-[#4C28E8]">
            IELTS DECODED
          </div>

          <div className="my-auto py-2">
            <div className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-[1.06] text-[#12112A]">
              <div>IELTS</div>
              <div>
                BAND <span className="text-[#5B2EE0]">7+</span>
              </div>
              <div>SCORE RESCUE</div>
            </div>

            <div className="w-12 h-1 bg-[#5B2EE0] mt-4 mb-3" />

            <p className="text-xs sm:text-sm text-[#4A4968] max-w-[38ch] leading-relaxed">
              A simple guide to finding what’s actually holding your IELTS score back — and what to do about it.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              ['1', 'Find your problem'],
              ['2', 'Understand why'],
              ['3', 'Fix it'],
              ['4', 'Practice it'],
              ['5', 'Check progress'],
              ['6', "Know what's next"],
            ].map(([num, label]) => (
              <span
                key={num}
                className="px-2.5 py-1 rounded-full bg-white border border-[#E4E0F5] text-[9px] sm:text-[10px] font-medium text-[#181634]"
              >
                <strong className="text-[#5B2EE0] mr-1">{num}</strong>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* High-fidelity exact recreation of Screenshot 4: "Where should I start?" */}
      {pageIndex === 1 && (
        <div className="w-full h-full p-4 sm:p-6 flex flex-col justify-between bg-[#F9F8FE] text-[10px] sm:text-xs">
          {/* Top module bar */}
          <div className="grid grid-cols-7 gap-1 text-[7px] sm:text-[8px] font-bold tracking-wider text-center">
            {TOP_NAV_PILLS.map((tab, i) => (
              <div
                key={tab}
                className={`py-1 rounded-full truncate px-1 ${
                  i === 0 ? 'bg-[#5B2EE0] text-white' : 'bg-white text-[#6E6C8F] border border-[#ECE9FA]'
                }`}
              >
                {tab}
              </div>
            ))}
          </div>

          <div className="mt-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#5B2EE0] text-white text-[8px] font-bold tracking-wider uppercase">
              START HERE
            </span>
            <h4 className="text-lg sm:text-2xl font-extrabold text-[#12112A] mt-1">
              Where should <span className="text-[#5B2EE0]">I</span> start?
            </h4>
            <p className="text-[10px] text-[#615F7E]">
              Pick the sentence that sounds most like you. Tap it (or turn to the page).
            </p>
          </div>

          <div className="space-y-1.5 my-1">
            {[
              { text: "I don't know what my actual problem is", sub: '→ Start with the 10-minute diagnostic', page: 'Page 6', highlight: true },
              { text: "I study a lot, but my score isn't moving", page: 'Page 7' },
              { text: 'I understand Reading but keep getting answers wrong', page: 'Page 9' },
              { text: 'I understand the Listening audio but lose marks', page: 'Page 14' },
              { text: 'I keep getting 6 / 6.5 in Writing', page: 'Page 22' },
              { text: 'I know English, but my Speaking score is low', page: 'Page 26' },
              { text: 'My scores change wildly between mock tests', page: 'Page 8' },
            ].map((row) => (
              <div
                key={row.page}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border ${
                  row.highlight ? 'border-[#5B2EE0] bg-[#F5F2FF]' : 'border-[#E8E5F8]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 h-4 rounded-full bg-[#5B2EE0] text-white text-[8px] flex items-center justify-center shrink-0">
                    →
                  </span>
                  <div className="truncate">
                    <span className="font-semibold text-[#15142E] block truncate text-[9px] sm:text-[10px]">
                      {row.text}
                    </span>
                    {row.sub && (
                      <span className="text-[8px] text-[#666385] block truncate">{row.sub}</span>
                    )}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#5B2EE0] text-white text-[8px] font-bold shrink-0 ml-2">
                  {row.page}
                </span>
              </div>
            ))}
          </div>

          <div className="p-2 rounded-lg bg-[#F2F0FC] border-l-4 border-[#351B96] text-[8px] sm:text-[9px] text-[#28254B]">
            <strong className="text-[#351B96] uppercase block text-[8px]">START HERE</strong>
            <strong>Two or more of these sound like you?</strong> Don’t panic. Take the diagnostic. It will tell you which one is costing you the most marks — and that’s the one you fix first.
          </div>
        </div>
      )}

      {/* High-fidelity exact recreation of Screenshot 3: "Which one sounds like you?" */}
      {pageIndex === 2 && (
        <div className="w-full h-full p-4 sm:p-6 flex flex-col justify-between bg-[#F9F8FE] text-[10px]">
          <div className="grid grid-cols-7 gap-1 text-[7px] sm:text-[8px] font-bold tracking-wider text-center">
            {TOP_NAV_PILLS.map((tab, i) => (
              <div
                key={tab}
                className={`py-1 rounded-full truncate px-1 ${
                  i === 0 ? 'bg-[#5B2EE0] text-white' : 'bg-white text-[#6E6C8F] border border-[#ECE9FA]'
                }`}
              >
                {tab}
              </div>
            ))}
          </div>

          <div className="mt-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#5B2EE0] text-white text-[8px] font-bold tracking-wider uppercase">
              FIND YOUR PROBLEM
            </span>
            <h4 className="text-lg sm:text-2xl font-extrabold text-[#12112A] mt-0.5">
              Which one sounds like <span className="text-[#5B2EE0]">you</span>?
            </h4>
          </div>

          <div className="bg-[#361999] text-white text-center py-1.5 px-3 rounded-xl text-[9px] sm:text-[10px] font-medium">
            Look at your last 3 mock tests. Where do you lose the most marks?
          </div>

          <div className="grid grid-cols-2 gap-2 my-1">
            {[
              { text: 'Reading: you understand the passage, but answers are still wrong', link: '→ Go to page 9', color: 'border-l-[#3B68F6] text-[#3B68F6]' },
              { text: 'Reading: you run out of time', link: '→ Go to page 10', color: 'border-l-[#3B68F6] text-[#3B68F6]' },
              { text: 'Writing: full essays, but always 6.0–6.5', link: '→ Go to page 22', color: 'border-l-[#C026D3] text-[#C026D3]' },
              { text: 'Writing Task 1 feels random and low', link: '→ Go to page 25', color: 'border-l-[#C026D3] text-[#C026D3]' },
              { text: 'Speaking: comfortable, but Part 2 runs out of ideas', link: '→ Go to page 27', color: 'border-l-[#E11D48] text-[#E11D48]' },
              { text: 'Speaking: answers are too short', link: '→ Go to page 26', color: 'border-l-[#E11D48] text-[#E11D48]' },
              { text: 'Listening: mistakes feel random', link: '→ Go to page 14', color: 'border-l-[#0D9488] text-[#0D9488]' },
              { text: 'Listening: one miss and you panic', link: '→ Go to page 16', color: 'border-l-[#0D9488] text-[#0D9488]' },
            ].map((card) => (
              <div
                key={card.link}
                className={`bg-white p-2 rounded-lg border border-[#ECE9FA] border-l-4 ${card.color.split(' ')[0]}`}
              >
                <span className="text-[7px] text-[#787596] block uppercase">IF...</span>
                <p className="text-[8px] sm:text-[9px] font-semibold text-[#15142E] leading-tight mt-0.5">
                  {card.text}
                </p>
                <span className={`text-[8px] font-bold block mt-1 ${card.color.split(' ')[1]}`}>
                  {card.link}
                </span>
              </div>
            ))}
          </div>

          <div className="border border-[#5B2EE0] bg-[#F5F2FF] rounded-xl py-1.5 px-3 text-center">
            <span className="text-[9px] font-bold text-[#12112A] block">
              I have no idea what’s holding me back
            </span>
            <span className="text-[9px] font-bold text-[#5B2EE0]">
              → Take the full diagnostic, page 6
            </span>
          </div>
        </div>
      )}

      {/* High-fidelity exact recreation of Screenshot 2: "My IELTS dashboard" */}
      {pageIndex === 3 && (
        <div className="w-full h-full p-4 sm:p-6 flex flex-col justify-between bg-[#F9F8FE] text-[10px]">
          <div className="grid grid-cols-7 gap-1 text-[7px] sm:text-[8px] font-bold tracking-wider text-center">
            {TOP_NAV_PILLS.map((tab, i) => (
              <div
                key={tab}
                className={`py-1 rounded-full truncate px-1 ${
                  i === 5 ? 'bg-[#361999] text-white' : 'bg-white text-[#6E6C8F] border border-[#ECE9FA]'
                }`}
              >
                {tab}
              </div>
            ))}
          </div>

          <div className="mt-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#361999] text-white text-[8px] font-bold tracking-wider uppercase">
              TRACK · DASHBOARD
            </span>
            <h4 className="text-lg sm:text-2xl font-extrabold text-[#12112A] mt-0.5">
              My IELTS <span className="text-[#361999]">dashboard</span>
            </h4>
            <p className="text-[9px] sm:text-[10px] text-[#615F7E]">
              Print it. Fill it in. Stick it where you study.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {['My target score', 'My current score'].map((label) => (
              <div key={label} className="bg-white p-2.5 rounded-lg border border-[#E8E5F8]">
                <span className="text-[9px] font-bold text-[#12112A] block">{label}</span>
                <div className="h-3 border-b border-[#D5D0F0] mt-2" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Listening', color: 'border-t-[#0D9488] text-[#0D9488]' },
              { label: 'Reading', color: 'border-t-[#2563EB] text-[#2563EB]' },
              { label: 'Writing', color: 'border-t-[#C026D3] text-[#C026D3]' },
              { label: 'Speaking', color: 'border-t-[#E11D48] text-[#E11D48]' },
            ].map((mod) => (
              <div
                key={mod.label}
                className={`bg-white p-2 rounded-lg border border-[#E8E5F8] border-t-4 ${mod.color.split(' ')[0]}`}
              >
                <span className={`text-[9px] font-bold block ${mod.color.split(' ')[1]}`}>
                  {mod.label}
                </span>
                <div className="h-3 border-b border-[#D5D0F0] mt-2" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              'My biggest problem',
              'My second biggest problem',
              'The mistake I repeat most',
              'What I need to stop doing',
              'What I need to practise',
              'My next mock (date + skill)',
            ].map((box) => (
              <div key={box} className="bg-white p-2 rounded-lg border border-[#E8E5F8]">
                <span className="text-[8px] sm:text-[9px] font-bold text-[#12112A] block truncate">
                  {box}
                </span>
                <div className="h-2 border-b border-[#D5D0F0] mt-1.5" />
                <div className="h-2 border-b border-[#D5D0F0] mt-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
