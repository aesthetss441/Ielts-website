import React, { useEffect, useRef, useState } from 'react';
import {
  SITE_CONFIG,
  wa,
  getWaMessageText,
  trackWaClick,
  trackSiteEvent,
  getTrafficSource,
  WaKeyword,
} from './config';
import { GuideModuleId } from './guidesConfig';
import {
  IconArrowUpRight,
  IconArrowDown,
  IconPlusMinus,
  IconMenu,
  IconClose,
  IconSunMoon,
  IconWhatsApp,
  IconFacebook,
  ScoreCountUp,
  FounderPortraitFrame,
} from './components/EditorialGraphics';
import { RedPen } from './components/RedPen';
import { BrandLogo } from './components/BrandLogo';
import { RescueStackViewer } from './components/RescueStackViewer';
import { StudentProofCarousel } from './components/StudentProofCarousel';
import { LandingSelfPrepSection } from './components/LandingSelfPrepSection';
import { GuidesPage } from './components/GuidesPage';
import { ExaminerDeskPage } from './components/ExaminerDeskPage';
import { StudyPlanPage } from './components/StudyPlanPage';
import FreeRescueModal from './components/FreeRescueModal';
import {
  ActionModalType,
  ConversionActionModal,
  PriceLadderAndOptionFitSection,
} from './components/ConversionModals';
import { SpeakingMocksSection } from './components/SpeakingMocksSection';
import { CaseStudyPage, TipsHubPage } from './components/CaseStudyAndTipsPages';
import { syncClientSeoForRoute } from './seoRegistry';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I pay for the BDT 499 Self-Prep Guides or Live Programs, and how fast is delivery?',
    answer:
      'Step 1: Message Jubayer on WhatsApp (01305-273703) so we can share the active bKash / Nagad / Bank transfer details directly in chat. Step 2: Once paid, submit your TrxID in the "I’ve Paid" form or send it in WhatsApp—your standalone PDF guide is delivered directly on WhatsApp within minutes.',
  },
  {
    question: 'What is the 50% PDF Fee Credit Guarantee?',
    answer:
      'If you buy any Self-Prep PDF Guide (BDT 499) or the Complete 4-Guide Bundle (BDT 1,499 — Save BDT 500) to study on your own first, and decide to join the 12-Week Live Batch or 1-to-1 Crash Course within 14 days, 50% of what you paid for your PDFs is deducted directly from your live course fee.',
  },
  {
    question: 'Which test is this for—Academic IELTS or General Training?',
    answer:
      'Academic IELTS. The reading strategies, writing Task 1 and Task 2 structures, and score diagnostics are built specifically for Academic IELTS candidates (though Task 2, Listening, and Speaking frameworks also apply to GT).',
  },
  {
    question: 'What if my starting level is Band 5.0 or 5.5, or my target is 6.5 instead of 7.5+?',
    answer:
      'You are in the right place. Many of our students start around Band 5.0–6.0 and work toward a solid 6.5 or 7.0+ for university admission, scholarships, or visas. Every tool and program diagnoses your exact starting band and focuses on the specific marks needed to work toward your personal target.',
  },
  {
    question: 'What is the difference between the free AI Writing Checker and personal feedback in the live programs?',
    answer:
      'Our free online Writing Checker gives you an instant AI estimate based on the public band descriptors so you can spot obvious structure and grammar issues immediately. In the 12-Week Mentorship Batch and 1-to-1 Crash Course, Jubayer personally reviews your essays line by line and conducts live 1-to-1 Speaking evaluations.',
  },
  {
    question: 'Do I get class support, and what happens if a batch minimum is not reached?',
    answer:
      'Yes—live batch students get direct WhatsApp group support, homework checks, and weekly progress tracking. Each cohort is capped at 10 students only; if a scheduled batch ever does not reach its minimum cohort size, your start date is either converted into 1-to-1 kickstart sessions or refunded in full.',
  },
  {
    question: 'Is the 38-page Score Rescue guide and 5-page module sample really free?',
    answer:
      'Yes. Both the 38-page "IELTS Band 7+ Score Rescue" guide and the 5-page sample chapters for Listening, Reading, Writing, and Speaking are 100% free instant PDF downloads.',
  },
];

/**
 * Section Index for Landing Page:
 * Hero → Problem (01) → Free guide (02) → Self-prep guides (03) → Student proof (04) → About (05) → Programs (06) → How to join (07) → FAQ (08) → Final CTA (09)
 */
const SECTION_INDEX = [
  { id: 'problem', num: '01', label: 'The problem', navGroup: '' },
  { id: 'free-guide', num: '02', label: 'Free guide', navGroup: 'free-guide' },
  { id: 'self-prep-guides', num: '03', label: 'Guides', navGroup: 'guides' },
  { id: 'reviews', num: '04', label: 'Student proof', navGroup: 'reviews' },
  { id: 'about', num: '05', label: 'About', navGroup: 'about' },
  { id: 'programs', num: '06', label: 'Programs', navGroup: 'programs' },
  { id: 'how-to-join', num: '07', label: 'Admission', navGroup: 'programs' },
  { id: 'faq', num: '08', label: 'FAQ', navGroup: 'faq' },
];

const MENTORSHIP_FEATURES = [
  'Detailed mastery of all 4 IELTS modules',
  '3-month step-by-step study plan',
  '5 full mock tests',
  'Personal writing correction',
  'Speaking feedback sessions',
  'Weekly progress reports',
  'WhatsApp support group',
  'Personal IELTS material pack',
  'After-course support',
  'Exclusive completion certificate',
];

const CRASH_COURSE_FEATURES = [
  'Complete Reading, Listening, Writing and Speaking strategy',
  'Personal study plan & personalised weakness analysis',
  'Personal writing correction',
  'Speaking feedback every week',
  'Live screen-sharing sessions',
  'Vocabulary & templates',
  'Band score tracking',
  'Weekly progress reports',
  'Resource library & homework after every class',
  'WhatsApp support & mock tests',
];

/**
 * Helper component for staggered list reveal when scrolled into view
 */
function StaggeredList({
  items,
  renderItem,
  className = '',
}: {
  items: string[];
  renderItem: (item: string, idx: number) => React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLUListElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <ul ref={ref} className={`stagger-list ${visible ? 'is-visible' : ''} ${className}`}>
      {items.map((item, idx) => (
        <li
          key={item}
          style={{ transitionDelay: `${idx * 55}ms` }}
          className="stagger-item"
        >
          {renderItem(item, idx)}
        </li>
      ))}
    </ul>
  );
}

/**
 * Expandable feature list for Program cards:
 * Shows top 5 items in readable text size and expands the remaining items on click.
 */
function ExpandableFeatureList({
  items,
  useRedCheck = false,
}: {
  items: string[];
  useRedCheck?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, 5);
  const hiddenCount = items.length - 5;

  return (
    <div>
      <ul className="divide-y divide-rule/60 border-t border-rule/60 text-base text-ink">
        {visibleItems.map((feature, idx) => (
          <li key={feature} className="py-2.5 flex items-baseline gap-3">
            {useRedCheck ? (
              <RedPen
                type="check"
                seed={idx}
                delayMs={idx * 45}
                className="shrink-0 translate-y-0.5"
              />
            ) : (
              <span className="font-mono text-xs text-ink-muted shrink-0">—</span>
            )}
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-xs text-violet-pen hover:text-ink underline underline-offset-4 cursor-pointer py-1"
        >
          <span>
            {expanded
              ? 'Show fewer items'
              : `+ Show all ${items.length} included items (${hiddenCount} more)`}
          </span>
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<
    'home' | 'guides' | 'diagnostic' | 'study-plan' | 'case-study' | 'tips'
  >(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p === '/guides') return 'guides';
      if (p === '/diagnostic' || p === '/writing-checker' || p === '/band-calculator')
        return 'diagnostic';
      if (p === '/study-plan') return 'study-plan';
      if (p === '/case-study') return 'case-study';
      if (p === '/tips') return 'tips';
    }
    return 'home';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isDark, setIsDark] = useState(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [pastHero, setPastHero] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('problem');
  const [scoreCountDone, setScoreCountDone] = useState(false);
  const [waSheetKeyword, setWaSheetKeyword] = useState<WaKeyword | string | null>(null);
  const [copiedState, setCopiedState] = useState<'none' | 'message' | 'number'>('none');
  const [rescueModalOpen, setRescueModalOpen] = useState(false);
  const [rescueModalSource, setRescueModalSource] = useState('Hero CTA');
  const [sampleModuleId, setSampleModuleId] = useState<GuideModuleId | null>(null);
  const [activeActionModal, setActiveActionModal] = useState<ActionModalType>(null);
  const [actionModalDefaultProduct, setActionModalDefaultProduct] = useState<string>(
    'Complete 4-Guide Bundle (BDT 1,499)'
  );

  const openRescueModal = (source: string, sampleMod: GuideModuleId | null = null) => {
    setRescueModalSource(source);
    setSampleModuleId(sampleMod);
    setRescueModalOpen(true);
  };

  const openActionModal = (type: ActionModalType, defaultProduct?: string) => {
    if (defaultProduct) setActionModalDefaultProduct(defaultProduct);
    setActiveActionModal(type);
  };

  // Capture ?src=, sync client-side SEO meta/canonical/JSON-LD, and log page_view
  useEffect(() => {
    getTrafficSource();
    if (typeof window !== 'undefined') {
      syncClientSeoForRoute(window.location.pathname);
    }
    trackSiteEvent('page_view', { route: currentRoute });
  }, [currentRoute]);

  // Browser back/forward popstate listener
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      syncClientSeoForRoute(p);
      if (p === '/guides') {
        setCurrentRoute('guides');
      } else if (p === '/diagnostic' || p === '/writing-checker' || p === '/band-calculator') {
        setCurrentRoute('diagnostic');
      } else if (p === '/study-plan') {
        setCurrentRoute('study-plan');
      } else if (p === '/case-study') {
        setCurrentRoute('case-study');
      } else if (p === '/tips') {
        setCurrentRoute('tips');
      } else {
        setCurrentRoute('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToDiagnostic = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/diagnostic');
      setCurrentRoute('diagnostic');
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToStudyPlan = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/study-plan');
      setCurrentRoute('study-plan');
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToCaseStudy = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/case-study');
      setCurrentRoute('case-study');
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToTips = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/tips');
      setCurrentRoute('tips');
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToGuides = (moduleId?: GuideModuleId) => {
    if (typeof window !== 'undefined') {
      const targetUrl = moduleId ? `/guides#guide-${moduleId}` : '/guides';
      window.history.pushState({}, '', targetUrl);
      setCurrentRoute('guides');
      setMobileMenuOpen(false);
      if (moduleId) {
        setTimeout(() => {
          document.getElementById(`guide-${moduleId}`)?.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const navigateHome = (sectionHash?: string) => {
    if (typeof window !== 'undefined') {
      const targetUrl = sectionHash ? `/${sectionHash}` : '/';
      window.history.pushState({}, '', targetUrl);
      setCurrentRoute('home');
      setMobileMenuOpen(false);
      if (sectionHash) {
        const cleanId = sectionHash.replace(/^#/, '');
        setTimeout(() => {
          document.getElementById(cleanId)?.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Sync document.title and canonical metadata with route
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (currentRoute === 'guides') {
      document.title = 'IELTS DECODED Guides: 4-Module Self-Prep Books (Listening, Reading, Writing, Speaking)';
    } else if (currentRoute === 'diagnostic') {
      document.title = 'IELTS DECODED Examiner Desk: AI Writing Evaluation & Band Score Diagnostic';
    } else if (currentRoute === 'study-plan') {
      document.title = 'IELTS DECODED Study Plan Builder: Personalized Day-by-Day IELTS Curriculum';
    } else {
      document.title = 'IELTS DECODED: Academic IELTS Mentorship, Self-Prep Guides & Band 7+ Diagnostic';
    }
  }, [currentRoute]);

  // Dark mode sync
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Scroll-linked reading progress (direct DOM transform, zero React re-renders per scroll frame) & throttled active section tracker
  useEffect(() => {
    let rafId: number | null = null;

    const updateOnScroll = () => {
      rafId = null;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${progress})`;
      }

      const isNowPastHero = scrollTop > 520;
      setPastHero((prev) => (prev === isNowPastHero ? prev : isNowPastHero));

      if (currentRoute === 'home') {
        const viewportMid = window.innerHeight * 0.38;
        let nextActive = SECTION_INDEX[0].id;
        for (let i = SECTION_INDEX.length - 1; i >= 0; i--) {
          const el = document.getElementById(SECTION_INDEX[i].id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= viewportMid) {
              nextActive = SECTION_INDEX[i].id;
              break;
            }
          }
        }
        setActiveSection((prev) => (prev === nextActive ? prev : nextActive));
      }
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateOnScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateOnScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [currentRoute]);

  // Hide mobile sticky bar if soft keyboard opens
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const initialHeight = window.visualViewport.height;
    const handleResize = () => {
      if (window.visualViewport) {
        setKeyboardOpen(window.visualViewport.height < initialHeight * 0.78);
      }
    };
    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  const handleWaAction = (keywordOrMessage: WaKeyword | string) => {
    trackWaClick(keywordOrMessage);
    setCopiedState('none');
    setWaSheetKeyword(keywordOrMessage);
  };

  const copyToClipboard = (text: string, type: 'number' | 'message') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedState(type);
        setTimeout(() => setCopiedState('none'), 2200);
      });
    }
  };

  const hasEnoughReviews = SITE_CONFIG.reviews.items.length > 0;
  const activeNavGroup =
    currentRoute === 'guides'
      ? 'guides'
      : currentRoute === 'diagnostic'
      ? 'diagnostic'
      : currentRoute === 'study-plan'
      ? 'study-plan'
      : SECTION_INDEX.find((s) => s.id === activeSection)?.navGroup || '';

  // Floating WhatsApp button uses "GUIDES_GENERAL" on `/guides` ("Hi Jubayer, I'm interested in the self-prep guides.")
  const floatingWaTarget: WaKeyword = currentRoute === 'guides' ? 'GUIDES_GENERAL' : 'GENERAL';

  return (
    <div className="min-h-screen bg-paper text-ink paper-grain relative overflow-x-hidden">
      {/* Thin scroll-progress line at the top in ink color */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] bg-transparent z-50 pointer-events-none"
        aria-hidden="true"
      >
        <div
          ref={progressBarRef}
          className="h-full bg-ink origin-left will-change-transform"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* Small Left-Side Section Index with Mono Numbers (shown on landing page) */}
      {currentRoute === 'home' && (
        <aside
          aria-label="Section index"
          className={`hidden xl:flex fixed left-5 top-1/2 -translate-y-1/2 z-30 flex-col gap-2.5 transition-opacity duration-300 ${
            pastHero ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {SECTION_INDEX.map((sec) => {
            const isCurrent = activeSection === sec.id;
            return (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className={`group flex items-center gap-2 font-mono text-[10px] tracking-tight transition-colors ${
                  isCurrent ? 'text-ink font-semibold' : 'text-ink-subtle hover:text-ink-muted'
                }`}
              >
                <span
                  className={`w-3 h-px transition-all ${
                    isCurrent ? 'w-5 bg-examiner-red' : 'bg-rule-strong group-hover:bg-ink-muted'
                  }`}
                  aria-hidden="true"
                />
                <span className="tabular-nums">{sec.num}</span>
                <span>{sec.label}</span>
              </a>
            );
          })}
        </aside>
      )}

      {/* =====================================================================
          A. HEADER (Sticky, slim, strict 3-zone Top Bar Contract)
         ===================================================================== */}
      <header className="sticky top-0 z-40 bg-paper border-b border-rule">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Logo */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateHome();
            }}
            aria-label="IELTS DECODED Home"
            className="inline-flex items-center hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-violet-pen"
          >
            <BrandLogo size="md" />
          </a>

          {/* Zone 2: Primary Navigation Links (Includes "Guides" + "Writing Checker" + "Study Plan") */}
          <nav aria-label="Primary" className="hidden md:flex items-center gap-5 lg:gap-6 text-sm text-ink-muted">
            {[
              { id: 'free-guide', label: 'Free Guide', href: '#free-guide', route: null as null | 'guides' | 'diagnostic' | 'study-plan', seed: 0 },
              { id: 'study-plan', label: 'Study Plan', href: '/study-plan', route: 'study-plan' as const, seed: 3 },
              { id: 'diagnostic', label: 'Writing Checker', href: '/diagnostic', route: 'diagnostic' as const, seed: 1 },
              { id: 'guides', label: 'Guides', href: '/guides', route: 'guides' as const, seed: 2 },
              { id: 'programs', label: 'Programs', href: '#programs', route: null as null | 'guides' | 'diagnostic' | 'study-plan', seed: 3 },
              { id: 'about', label: 'About', href: '#about', route: null as null | 'guides' | 'diagnostic' | 'study-plan', seed: 0 },
              { id: 'reviews', label: 'Reviews', href: '#reviews', route: null as null | 'guides' | 'diagnostic' | 'study-plan', seed: 1 },
            ].map((nav) => {
              const isActive = activeNavGroup === nav.id;
              return (
                <a
                  key={nav.id}
                  href={nav.href}
                  onClick={(e) => {
                    e.preventDefault();
                    if (nav.route === 'guides') {
                      navigateToGuides();
                    } else if (nav.route === 'diagnostic') {
                      navigateToDiagnostic();
                    } else if (nav.route === 'study-plan') {
                      navigateToStudyPlan();
                    } else if (currentRoute !== 'home') {
                      navigateHome(nav.href);
                    } else {
                      document.getElementById(nav.id)?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`relative py-1 transition-colors whitespace-nowrap ${
                    isActive ? 'text-ink font-medium' : 'hover:text-ink'
                  }`}
                >
                  <RedPen
                    type="underline"
                    seed={nav.seed}
                    active={isActive}
                    svgClassName={isActive ? 'opacity-100' : 'opacity-0'}
                  >
                    {nav.label}
                  </RedPen>
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action + Theme Toggle + Mobile Sheet Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={SITE_CONFIG.founder.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Jubayer Siddiki on Facebook"
              title="Jubayer Siddiki on Facebook"
              className="hidden sm:inline-flex w-11 h-11 items-center justify-center text-ink-muted hover:text-violet-pen border border-transparent hover:border-rule transition-colors"
            >
              <IconFacebook className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'Switch to light paper theme' : 'Switch to dark study theme'}
              className="w-11 h-11 inline-flex items-center justify-center text-ink-muted hover:text-ink border border-transparent hover:border-rule transition-colors cursor-pointer"
            >
              <IconSunMoon isDark={isDark} />
            </button>

            <a
              href={wa(floatingWaTarget)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleWaAction(floatingWaTarget)}
              className="group/btn min-h-[44px] px-4 py-2 inline-flex items-center gap-1.5 bg-ink text-paper text-xs sm:text-sm font-medium hover:bg-violet-pen hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <RedPen type="underline" seed={1} drawOnHover>
                Message on WhatsApp
              </RedPen>
              <IconArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Open navigation menu"
              className="md:hidden w-11 h-11 inline-flex items-center justify-center border border-rule text-ink hover:bg-ivory transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Sheet */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-rule bg-paper px-4 pt-3 pb-6">
            <nav aria-label="Mobile navigation" className="flex flex-col divide-y divide-rule/70">
              {[
                { label: 'Free Guide', href: '#free-guide', route: null as null | 'guides' | 'diagnostic' | 'study-plan' },
                { label: 'Free Study Plan Builder', href: '/study-plan', route: 'study-plan' as const },
                { label: 'Free Writing Checker & Score Advisor', href: '/diagnostic', route: 'diagnostic' as const },
                { label: 'Self-Prep Guides (BDT 499)', href: '/guides', route: 'guides' as const },
                { label: 'Programs', href: '#programs', route: null as null | 'guides' | 'diagnostic' | 'study-plan' },
                { label: 'About Jubayer', href: '#about', route: null as null | 'guides' | 'diagnostic' | 'study-plan' },
                { label: 'Student Proof', href: '#reviews', route: null as null | 'guides' | 'diagnostic' | 'study-plan' },
                { label: 'FAQ', href: '#faq', route: null as null | 'guides' | 'diagnostic' | 'study-plan' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.route === 'guides') {
                      navigateToGuides();
                    } else if (item.route === 'diagnostic') {
                      navigateToDiagnostic();
                    } else if (item.route === 'study-plan') {
                      navigateToStudyPlan();
                    } else {
                      navigateHome(item.href);
                    }
                  }}
                  className="py-3.5 text-base font-medium text-ink hover:text-violet-pen flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  <span className="font-mono text-xs text-ink-subtle">→</span>
                </a>
              ))}
              <a
                href={SITE_CONFIG.founder.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 text-base font-medium text-ink hover:text-violet-pen flex items-center justify-between"
              >
                <span className="inline-flex items-center gap-2">
                  <IconFacebook className="w-4 h-4" />
                  <span>Facebook · Jubayer Siddiki</span>
                </span>
                <IconArrowUpRight className="w-4 h-4 text-ink-subtle" />
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* =====================================================================
          MAIN VIEW: `/guides`, `/diagnostic`, `/study-plan`, `/case-study`, `/tips`, OR LANDING PAGE
         ===================================================================== */}
      {currentRoute === 'case-study' ? (
        <CaseStudyPage />
      ) : currentRoute === 'tips' ? (
        <TipsHubPage />
      ) : currentRoute === 'guides' ? (
        <main>
          <GuidesPage
            onWaAction={handleWaAction}
            onNavigateHome={navigateHome}
            onOpenRescueModal={(src) => openRescueModal(src, null)}
            onDownloadSample={(modId) =>
              openRescueModal(`Guides Page - ${modId} 5-Page Sample`, modId)
            }
            onOpenPaidModal={() => openActionModal('paid_verification')}
          />
        </main>
      ) : currentRoute === 'diagnostic' ? (
        <main>
          <ExaminerDeskPage
            onWaAction={handleWaAction}
            onNavigateHome={navigateHome}
            onNavigateToGuides={navigateToGuides}
            onOpenRescueModal={(src) => openRescueModal(src, null)}
          />
        </main>
      ) : currentRoute === 'study-plan' ? (
        <main>
          <StudyPlanPage
            onWaAction={handleWaAction}
            onNavigateHome={navigateHome}
            onNavigateToGuides={navigateToGuides}
            onNavigateToDiagnostic={navigateToDiagnostic}
            onOpenRescueModal={(src) => openRescueModal(src, null)}
          />
        </main>
      ) : (
        <main>
          {/* =====================================================================
              1. HERO (Item 2 & 3: Student's problem, "work toward", Primary CTA: Free Guide, Secondary CTA: Free Writing Check, 1-line Instructor Card under CTAs)
             ===================================================================== */}
          <section className="pt-12 sm:pt-20 lg:pt-24 pb-16 border-b border-rule">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                {/* Left 7 Columns: Editorial Proposition */}
                <div className="lg:col-span-7 pt-2">
                  <p className="font-mono text-[11px] text-ink-muted tracking-widest uppercase mb-6">
                    Academic IELTS Diagnostic &amp; Mentorship · Work Toward Band 6.0, 6.5, 7.0 or 7.5+
                  </p>

                  <h1 className="font-serif text-display-hero font-normal text-ink">
                    Stuck on the same band? Find{' '}
                    <RedPen type="double-underline" seed={0}>
                      exactly why you’re losing marks.
                    </RedPen>
                  </h1>

                  <p className="mt-7 text-base sm:text-lg text-ink-muted leading-relaxed max-w-[62ch]">
                    Stop taking blind mock tests. Whether you are working toward Band 6.5 for university admission or Band 7.0+ for scholarships and visas, diagnose the exact{' '}
                    <strong className="text-ink font-medium">[K] Knowledge</strong>,{' '}
                    <strong className="text-ink font-medium">[S] Skill</strong>, or{' '}
                    <strong className="text-ink font-medium">[C] Care</strong> mistakes holding your score back—and fix them step by step.
                  </p>

                  {/* Primary CTA: Free Guide | Secondary CTA: Free Writing Check */}
                  <div className="mt-9 sm:mt-11 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                    <button
                      type="button"
                      onClick={() => openRescueModal('Hero - Download the free Score Rescue guide')}
                      className="group/btn min-h-[48px] px-6 py-3.5 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover text-white text-sm sm:text-base font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <RedPen type="underline" seed={2} drawOnHover>
                        Download Free Rescue Guide
                      </RedPen>
                      <IconArrowUpRight className="w-4 h-4" />
                    </button>

                    <a
                      href="/diagnostic"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToDiagnostic();
                      }}
                      className="group/btn min-h-[48px] px-5 py-3 inline-flex items-center justify-center gap-2 border border-ink bg-paper hover:bg-ink hover:text-paper text-sm font-medium text-ink transition-colors whitespace-nowrap"
                    >
                      <RedPen type="underline" seed={3} drawOnHover>
                        Free Writing Check
                      </RedPen>
                      <IconArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Item 3: One-line Instructor Card directly under the CTAs (Full bio only in About section) */}
                  <div className="mt-8 pt-5 border-t border-rule/80 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-ink-muted">
                    <span>
                      Guided by <strong className="text-ink">Jubayer Siddiki</strong> · IELTS Overall 8 (L8.5 · R8.5 · W7 · S7) · Author of IELTS DECODED
                    </span>
                    <a
                      href="#about"
                      className="text-violet-pen underline underline-offset-4 hover:text-ink"
                    >
                      Full bio ↓
                    </a>
                  </div>
                </div>

                {/* Right 5 Columns: Large Photo of Jubayer */}
                <div className="lg:col-span-5">
                  <FounderPortraitFrame
                    imageUrl={SITE_CONFIG.founder.heroPhotoUrl}
                    alt="Jubayer Siddiki, Founder and Instructor at IELTS DECODED"
                    aspectRatioClass="aspect-[4/5]"
                    caption="Jubayer Siddiki · Guiding students toward their target IELTS band"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Hand-scribbled red divider between major sections */}
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -my-2">
            <RedPen type="divider" seed={0} />
          </div>

          {/* =====================================================================
              2. THE PROBLEM ("27/40" counts up, then red circle draws around "13")
             ===================================================================== */}
          <section id="problem" className="py-20 sm:py-28 border-b border-rule scroll-mt-16">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-baseline">
                {/* Left 5 Columns: Oversized Diagnostic Score with Count-Up */}
                <div className="lg:col-span-5">
                  <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
                    01. The Diagnosis Gap
                  </span>
                  <div className="flex items-baseline gap-6 flex-wrap">
                    <ScoreCountUp onComplete={() => setScoreCountDone(true)} />
                    <div className="font-mono text-xs text-examiner-red">
                      <span>−</span>
                      <span className="text-xl sm:text-2xl font-serif font-medium ml-0.5">13 marks</span>
                      <span className="block text-[10px] text-ink-muted mt-0.5">unexplained</span>
                    </div>
                  </div>
                </div>

                {/* Right 7 Columns: Headline + Teacher's Paragraph */}
                <div className="lg:col-span-7">
                  <h2 className="font-serif text-display-section font-normal text-ink">
                    Most mock tests tell you 27/40. IELTS DECODED asks:{' '}
                    <RedPen type="wavy" seed={0}>
                      why did you miss
                    </RedPen>{' '}
                    those{' '}
                    <RedPen type="circle" seed={0} active={scoreCountDone} className="px-1.5">
                      13?
                    </RedPen>
                  </h2>

                  <div className="mt-7 space-y-4 text-base sm:text-lg text-ink-muted leading-relaxed max-w-[65ch]">
                    <p>
                      If you get 26 or 27 in Reading three times in a row, taking a fourth mock test tonight will not move your score to 34. The same Reading score again and again means you are repeating the exact same mistake patterns under time pressure.
                    </p>
                    <p>
                      You might be losing four marks on Matching Headings because you read the first line and guess, three marks on True / False / Not Given because you confuse "False" with "Not Given", and two marks from copying plural words as singular. Until you separate a <strong className="text-ink font-medium">Knowledge gap [K]</strong> from a <strong className="text-ink font-medium">Skill/Strategy error [S]</strong> or a <strong className="text-ink font-medium">Careless slip [C]</strong>, you are practising in the dark.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prominent Editorial Feature Banner for Common Mistakes & Tips (/tips) & Case Study (/case-study) */}
              <div className="mt-12 p-6 sm:p-7 bg-paper border-2 border-ink grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-examiner-red font-semibold mb-1.5">
                    <span>COMMON IELTS MISTAKES &amp; TIPS</span>
                    <span aria-hidden="true">·</span>
                    <span>WRITING · READING · SPEAKING · LISTENING</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl text-ink font-normal">
                    Want to see real{' '}
                    <RedPen type="underline" seed={4}>
                      Before → After Mistake Fixes
                    </RedPen>{' '}
                    right now?
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed max-w-[64ch]">
                    Browse our <strong className="text-ink font-medium">Most Common IELTS Mistakes &amp; Tips</strong> for bite-sized Band 6.0 → 7.5+ fixes across all 4 modules (Task 2 memorized intros, T/F/NG qualifier traps, Speaking Part 2 45-second freezes, Listening Part 3 distractors), or read the full <strong className="text-ink font-medium">Band 6.0 → 7.5+ Essay Case Study</strong>.
                  </p>
                </div>

                <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:items-end">
                  <a
                    href="/tips"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToTips();
                    }}
                    className="w-full sm:w-auto min-h-[46px] px-5 py-3 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <span>View Common Mistakes &amp; Tips</span>
                    <IconArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="/case-study"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToCaseStudy();
                    }}
                    className="w-full sm:w-auto min-h-[40px] px-4 py-2 border border-ink bg-ivory hover:bg-ink hover:text-paper text-ink font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <span>Read Band 6.0 → 7.5+ Case Study</span>
                    <IconArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Hand-scribbled red divider between major sections */}
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -my-2">
            <RedPen type="divider" seed={1} />
          </div>

          {/* =====================================================================
              3. FREE GUIDE (Interactive Fanned Stack + Lightbox) + FREE WRITING EVALUATION
             ===================================================================== */}
          <section id="free-guide" className="py-20 sm:py-28 border-b border-rule scroll-mt-16">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Left 6 Columns: Interactive Fanned PDF Stack */}
                <div className="lg:col-span-6">
                  <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
                    02. Free Diagnostic Resource
                  </span>
                  <h2 className="font-serif text-display-section font-normal text-ink">
                    IELTS Band 7+{' '}
                    <RedPen type="underline" seed={2}>
                      Score Rescue
                    </RedPen>
                  </h2>
                  <p className="mt-2 font-mono text-[11px] text-ink-muted">
                    38-page PDF guide · Useful whether your target is Band 6.0, 6.5, or 7.0+ · Free instant download
                  </p>

                  <RescueStackViewer />
                </div>

                {/* Right 6 Columns: What's Inside Staggered Hairline List + CTA */}
                <div className="lg:col-span-6 lg:pt-8">
                  <h3 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-4">
                    What is inside the 38-page PDF
                  </h3>

                  <StaggeredList
                    className="border-t border-rule divide-y divide-rule text-sm sm:text-base text-ink"
                    items={[
                      '10-minute diagnostic to find where you are losing marks',
                      'Fixes for Reading, Listening, Writing, and Speaking with exercises and answer keys',
                      'Writing before → after example showing how to upgrade your response',
                      'Part 2 Speaking framework for structuring fluent 2-minute turns',
                      'Printable mistake log to record and eliminate repeated errors',
                      '"Stop this, do this instead" page for common Band 6 traps',
                      'Step-by-step 14-day study plan',
                      'Personal dashboard for tracking module progress',
                    ]}
                    renderItem={(item, idx) => (
                      <div className="py-3.5 flex items-baseline gap-3.5">
                        <span className="font-mono text-xs text-ink-subtle tabular-nums shrink-0">
                          0{idx + 1}
                        </span>
                        <span>{item}</span>
                      </div>
                    )}
                  />

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => openRescueModal('Free Guide Section - Download the Free Rescue Guide')}
                      className="group/btn min-h-[48px] px-6 py-3.5 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover text-white text-sm sm:text-base font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <RedPen type="underline" seed={0} drawOnHover>
                        Download the Free Rescue Guide
                      </RedPen>
                      <IconArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* One-sentence bridge after Free Guide */}
                  <p className="mt-5 font-mono text-xs text-ink-muted">
                    Want the full toolkit for one module?{' '}
                    <a
                      href="#self-prep-guides"
                      className="text-ink font-medium underline underline-offset-4 hover:text-violet-pen"
                    >
                      See the self-prep guides.
                    </a>
                  </p>
                </div>
              </div>

              {/* Second Free Offer Under Guide: Free Writing Evaluation */}
              <div className="mt-16 pt-12 border-t border-rule">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-examiner-red mb-2">
                      <span>FREE WRITING EVALUATION</span>
                      <span aria-hidden="true">·</span>
                      <span>WRITING TASK 2 INTRODUCTION</span>
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl text-ink font-normal">
                      Stuck at 5.5, 6.0 or 6.5 in Writing? Send your{' '}
                      <RedPen type="wavy" seed={1}>
                        Task 2 introduction.
                      </RedPen>
                    </h3>
                    <p className="mt-3 text-sm sm:text-base text-ink-muted leading-relaxed max-w-[62ch]">
                      Send one Writing Task 2 introduction on WhatsApp and receive a personal review covering five specific points:
                    </p>

                    {/* 5 Outputs as clean hairline list */}
                    <div className="mt-5 pt-4 border-t border-rule flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-ink">
                      <span>01. Estimated band score</span>
                      <span className="text-ink-subtle" aria-hidden="true">·</span>
                      <span>02. Structure feedback</span>
                      <span className="text-ink-subtle" aria-hidden="true">·</span>
                      <span>03. Grammar feedback</span>
                      <span className="text-ink-subtle" aria-hidden="true">·</span>
                      <span>04. Vocabulary feedback</span>
                      <span className="text-ink-subtle" aria-hidden="true">·</span>
                      <span>05. Improvement suggestions</span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col lg:items-end gap-3">
                    <a
                      href="/diagnostic"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToDiagnostic();
                      }}
                      className="group/btn min-h-[48px] px-6 py-3.5 inline-flex items-center justify-center gap-2 bg-ink hover:bg-violet-pen text-paper hover:text-white text-sm sm:text-base font-medium transition-colors whitespace-nowrap"
                    >
                      <RedPen type="underline" seed={2} drawOnHover>
                        Try Instant Writing Checker
                      </RedPen>
                      <IconArrowUpRight className="w-4 h-4" />
                    </a>

                    <a
                      href={wa('WRITE')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleWaAction('WRITE')}
                      className="group/btn min-h-[44px] px-5 py-2.5 inline-flex items-center justify-center gap-2 border border-ink bg-paper hover:bg-ink hover:text-paper text-ink text-xs sm:text-sm font-mono transition-colors whitespace-nowrap"
                    >
                      <span>Or message WRITE on WhatsApp</span>
                      <IconArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Third Free Tool Under Guide: Personalized Day-by-Day Study Plan Builder */}
              <div className="mt-10 pt-10 border-t border-rule">
                <div className="p-6 sm:p-8 bg-ivory border border-rule-strong grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-8">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-examiner-red mb-2">
                      <span>FREE INTERACTIVE CURRICULUM TOOL</span>
                      <span aria-hidden="true">·</span>
                      <span>20, 30, 45, 60, 90 OR CUSTOM DAYS</span>
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl text-ink font-normal">
                      Don’t know what to study each day?{' '}
                      <RedPen type="underline" seed={3}>
                        Build your personalized IELTS study plan.
                      </RedPen>
                    </h3>
                    <p className="mt-2 text-sm text-ink-muted leading-relaxed max-w-[64ch]">
                      Select your starting level, target band, preparation duration, and module trouble spots to generate a complete Day 1 to Day N study schedule—with exact question types, step-by-step methods, and Mistake DNA error logging.
                    </p>
                  </div>

                  <div className="lg:col-span-4 flex lg:justify-end">
                    <a
                      href="/study-plan"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToStudyPlan();
                      }}
                      className="group/btn w-full sm:w-auto min-h-[48px] px-6 py-3.5 inline-flex items-center justify-center gap-2 bg-paper hover:bg-ink text-ink hover:text-paper border border-ink font-mono text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      <RedPen type="underline" seed={1} drawOnHover>
                        Build Your Free Study Plan
                      </RedPen>
                      <IconArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================================
              4B. SELF-PREP GUIDES SUMMARY SECTION (After Free Guide, before Student Proof/Programs)
             ===================================================================== */}
          <LandingSelfPrepSection
            onWaAction={handleWaAction}
            onNavigateToGuides={navigateToGuides}
            onDownloadSample={(modId) =>
              openRescueModal(`Landing Self-Prep - ${modId} 5-Page Sample`, modId)
            }
          />

          {/* Hand-scribbled red divider between major sections */}
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -my-2">
            <RedPen type="divider" seed={0} />
          </div>

          {/* =====================================================================
              5. STUDENT PROOF (Placed before About & Programs so trust precedes price)
             ===================================================================== */}
          {hasEnoughReviews && (
            <StudentProofCarousel
              items={SITE_CONFIG.reviews.items}
              writtenQuotes={SITE_CONFIG.reviews.writtenQuotes}
              videoTestimonials={SITE_CONFIG.reviews.videoTestimonials}
              videoTestimonial={SITE_CONFIG.reviews.videoTestimonial}
              ratingBadgeText={SITE_CONFIG.reviews.ratingBadgeText}
              sectionKicker="04. Student Proof"
              onOpenShareResultModal={() => openActionModal('share_result')}
            />
          )}

          {/* =====================================================================
              6. ABOUT JUBAYER ("Who am I?" — placed right before Programs)
             ===================================================================== */}
          <section id="about" className="py-20 sm:py-28 border-b border-rule scroll-mt-16">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                {/* Left 5 Columns: Instructor Photo */}
                <div className="lg:col-span-5">
                  <FounderPortraitFrame
                    imageUrl={SITE_CONFIG.founder.aboutPhotoUrl || SITE_CONFIG.founder.heroPhotoUrl}
                    alt="Jubayer Siddiki"
                    aspectRatioClass="aspect-[4/4]"
                  />
                </div>

                {/* Right 7 Columns: Short, Human Paragraph using ONLY Brand Facts */}
                <div className="lg:col-span-7">
                  <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
                    05. Your Instructor
                  </span>
                  <h2 className="font-serif text-display-section font-normal text-ink">
                    Jubayer Siddiki
                  </h2>
                  <p className="mt-2 font-mono text-xs text-ink-muted tabular-nums">
                    IELTS Overall 8 (L8.5 | R8.5 | W7 | S7) · CLB 9 · Pearson Edexcel IGCSE English Grade 9
                  </p>

                  <div className="mt-6 space-y-4 text-base sm:text-lg text-ink-muted leading-relaxed max-w-[64ch]">
                    <p>
                      I am a professional IELTS instructor and author of the <strong className="text-ink font-medium">IELTS DECODED</strong> book series. After achieving Grade 9 in Pearson Edexcel IGCSE English and an Overall Band 8 (CLB 9) in IELTS, I have taught 100+ students preparing for university admissions and scholarships.
                    </p>
                    <p>
                      Look closely at my own module breakdown: my Listening and Reading are <strong className="text-ink font-medium">8.5</strong>, and my Writing and Speaking are <strong className="text-ink font-medium">7.0</strong>. I don’t hide those sevens—I highlight them because I know firsthand that{' '}
                      <RedPen type="underline" seed={0}>
                        Writing and Speaking are the hardest skills to improve alone.
                      </RedPen>{' '}
                      In Reading and Listening, a clear system can push your score up quickly; in Writing and Speaking, you need someone to look at your sentences, point out why you are stuck below your target band, and show you how to fix it.
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-rule grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                    <div>
                      <span className="block text-[10px] text-ink-subtle">MY RESULT</span>
                      <span className="text-base font-medium text-ink tabular-nums">8.0 (CLB 9)</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-subtle">IGCSE ENGLISH</span>
                      <span className="text-base font-medium text-ink">Grade 9</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-subtle">STUDENTS TAUGHT</span>
                      <span className="text-base font-medium text-ink tabular-nums">100+</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-subtle">PUBLICATION</span>
                      <span className="text-base font-medium text-ink">IELTS DECODED</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-rule flex flex-wrap items-center gap-5 font-mono text-xs">
                    <a
                      href={SITE_CONFIG.founder.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-ink hover:text-violet-pen font-medium underline underline-offset-4 transition-colors"
                    >
                      <IconFacebook className="w-4 h-4" />
                      <span>Connect with Jubayer Siddiki on Facebook</span>
                      <IconArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                    <span className="text-ink-subtle" aria-hidden="true">·</span>
                    <a
                      href={wa('GENERAL')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleWaAction('GENERAL')}
                      className="text-ink-muted hover:text-ink underline underline-offset-4 transition-colors tabular-nums"
                    >
                      WhatsApp {SITE_CONFIG.whatsapp.displayNumber}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Hand-scribbled red divider between major sections */}
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -my-2">
            <RedPen type="divider" seed={1} />
          </div>

          {/* =====================================================================
              7. PROGRAMS (Follows Student Proof & About so trust comes before price)
             ===================================================================== */}
          <section id="programs" className="py-20 sm:py-28 border-b border-rule scroll-mt-16">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mb-6">
                <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
                  06. Live Programs with Jubayer Siddiki
                </span>
                <h2 className="font-serif text-display-section font-normal text-ink">
                  Choose how you want to{' '}
                  <RedPen type="underline" seed={3}>
                    work together.
                  </RedPen>
                </h2>

                {/* One line above the cards linking to Self-Prep Guides */}
                <p className="mt-3 font-mono text-xs sm:text-sm text-ink-muted">
                  Want to start on your own first?{' '}
                  <a
                    href="/guides"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToGuides();
                    }}
                    className="text-ink font-medium underline underline-offset-4 hover:text-violet-pen"
                  >
                    Try a self-prep guide (BDT 499 each · All 4 for BDT 1,499) →
                  </a>{' '}
                  <span className="text-examiner-red font-medium">
                    (50% of your PDF fee is credited if you join a live course within 14 days)
                  </span>
                </p>
              </div>

              {/* Item 4 & 5: "Which option fits me?" Diagnostic Selector + 5-Rung Price Ladder */}
              <div className="mb-12">
                <PriceLadderAndOptionFitSection
                  onOpenRescueModal={openRescueModal}
                  onOpenActionModal={openActionModal}
                />
              </div>

              {/* Two Offer Cards Side by Side on Desktop, Stacked on Mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* OFFER 1: 12-Week Band 7+ Roadmap Mentorship Program */}
                <article className="bg-surface-elevated border border-rule-strong hover:border-examiner-red hover:-translate-y-1 transition-all duration-200 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    {/* Quiet Text Kicker with RedPen circle around "10 seats only" */}
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-ink-muted pb-4 border-b border-rule">
                      <span>SMALL COHORT MENTORSHIP</span>
                      <RedPen type="circle" seed={2} className="text-examiner-red font-medium px-1.5 py-0.5">
                        {SITE_CONFIG.batchSchedule.seatsConfirmedText || '10 seats only'}
                      </RedPen>
                    </div>

                    <h3 className="mt-5 font-serif text-2xl sm:text-3xl text-ink font-normal">
                      12-Week Band 7+ Roadmap Mentorship Program
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-ink-muted">
                      Step-by-step mastery of all four modules in a focused 10-student cohort—ideal whether you are aiming for Band 6.5 or pushing for 7.0+.
                    </p>

                    {/* Facts Row */}
                    <div className="mt-5 py-3 border-y border-rule font-mono text-xs text-ink flex flex-wrap items-center gap-x-2.5 gap-y-1.5 tabular-nums">
                      <span>3 months</span>
                      <span className="text-ink-subtle" aria-hidden="true">·</span>
                      <span>3 classes/week</span>
                      <span className="text-ink-subtle" aria-hidden="true">·</span>
                      <span>90 min each</span>
                      <span className="text-ink-subtle" aria-hidden="true">·</span>
                      <RedPen type="circle" seed={1} className="px-1">
                        10 students only
                      </RedPen>
                      <span className="text-ink-subtle" aria-hidden="true">·</span>
                      <span>Target Band 6.5 / 7+</span>
                    </div>

                    {/* Cohort Schedule & Start Date Row */}
                    <div className="mt-3 py-2.5 px-3 bg-ivory border border-rule font-mono text-xs text-ink space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-ink-muted">Schedule:</span>
                        <span>{SITE_CONFIG.batchSchedule.classDaysText}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-ink-muted">Cohort start date:</span>
                        <span className="font-medium">
                          {SITE_CONFIG.batchSchedule.startDateText ||
                            'Founding Batch — message ENROLL for start date & class days'}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 font-mono text-xs text-ink-muted">
                      Instructor: <span className="text-ink">Jubayer Siddiki (IELTS Overall 8)</span>
                    </p>

                    {/* Shortened What You Get List (Top 5 visible + Expand rest) */}
                    <div className="mt-6">
                      <h4 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
                        What you get (Top 5 of {MENTORSHIP_FEATURES.length})
                      </h4>
                      <ExpandableFeatureList items={MENTORSHIP_FEATURES} useRedCheck />
                    </div>
                  </div>

                  {/* Price & Action Block with RedPen strike-through on BDT 9,999 */}
                  <div className="mt-8 pt-6 border-t border-rule">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                      <div>
                        <span className="block font-mono text-xs text-examiner-red font-medium">
                          Founding Batch offer · 10 students only
                        </span>
                        <div className="flex items-baseline gap-3.5 mt-1 font-mono tabular-nums">
                          <RedPen type="strike" seed={0} className="text-sm text-ink-subtle">
                            BDT 9,999
                          </RedPen>
                          <span className="font-serif text-3xl sm:text-4xl text-ink font-medium">
                            BDT 7,999
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={() => openActionModal('batch_application')}
                        className="group/btn flex-1 min-h-[48px] px-5 py-3.5 inline-flex items-center justify-center gap-2 bg-violet-pen hover:bg-violet-pen-hover text-white text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <RedPen type="underline" seed={2} drawOnHover>
                          Apply for 12-Week Batch
                        </RedPen>
                        <IconArrowUpRight className="w-4 h-4" />
                      </button>

                      <a
                        href={wa('ENROLL')}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleWaAction('ENROLL')}
                        className="min-h-[48px] px-4 py-3.5 inline-flex items-center justify-center gap-1.5 border border-ink bg-paper hover:bg-ink hover:text-paper text-ink font-mono text-xs uppercase tracking-wider transition-colors whitespace-nowrap"
                      >
                        <span>Or Ask on WhatsApp</span>
                        <IconArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </article>

                {/* OFFER 2: 1-Month 1-to-1 Live IELTS Crash Course */}
                <article className="bg-surface-elevated border border-rule hover:border-examiner-red hover:-translate-y-1 transition-all duration-200 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    {/* Quiet Text Kicker */}
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-ink-muted pb-4 border-b border-rule">
                      <span>PRIVATE 1-TO-1 COACHING</span>
                      <span>Flexible 1-to-1 start</span>
                    </div>

                    <h3 className="mt-5 font-serif text-2xl sm:text-3xl text-ink font-normal">
                      1-Month 1-to-1 Live IELTS Crash Course
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-ink-muted">
                      Intensive private sessions built around your exact exam date, current level (5.5–6.5), and target band score.
                    </p>

                    {/* Facts Row */}
                    <div className="mt-5 py-3 border-y border-rule font-mono text-xs text-ink flex flex-wrap items-center gap-x-2.5 gap-y-1.5 tabular-nums">
                      <span>1 month</span>
                      <span className="text-ink-subtle" aria-hidden="true">·</span>
                      <span>4 classes/week</span>
                      <span className="text-ink-subtle" aria-hidden="true">·</span>
                      <span>90 min each</span>
                      <span className="text-ink-subtle" aria-hidden="true">·</span>
                      <span>Fully 1-to-1 live</span>
                      <span className="text-ink-subtle" aria-hidden="true">·</span>
                      <span>Target Band 6.5 / 7+</span>
                    </div>

                    {/* 1-to-1 Schedule Row */}
                    <div className="mt-3 py-2.5 px-3 bg-ivory border border-rule font-mono text-xs text-ink space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-ink-muted">Schedule:</span>
                        <span>4 live 1-to-1 classes/week · 90 min each</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-ink-muted">Start date:</span>
                        <span className="font-medium">Flexible — starts on your chosen days</span>
                      </div>
                    </div>

                    <p className="mt-3 font-mono text-xs text-ink-muted">
                      Instructor: <span className="text-ink">Jubayer Siddiki (IELTS Overall 8)</span>
                    </p>

                    {/* Shortened What You Get List (Top 5 visible + Expand rest) */}
                    <div className="mt-6">
                      <h4 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
                        What you get (Top 5 of {CRASH_COURSE_FEATURES.length})
                      </h4>
                      <ExpandableFeatureList items={CRASH_COURSE_FEATURES} />
                    </div>

                    {/* Best For List */}
                    <div className="mt-6 pt-4 border-t border-rule">
                      <h4 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">
                        Best for
                      </h4>
                      <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                        Band 5.5–6.5 students · Students applying abroad · Last-minute preparation · Busy professionals · University and scholarship applicants
                      </p>
                    </div>
                  </div>

                  {/* Price & Action Block */}
                  <div className="mt-8 pt-6 border-t border-rule">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                      <div>
                        <span className="block font-mono text-xs text-ink-muted">
                          1-to-1 private tuition fee
                        </span>
                        <div className="flex items-baseline gap-3 mt-1 font-mono tabular-nums">
                          <span className="font-serif text-3xl sm:text-4xl text-ink font-medium">
                            BDT 9,999
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={wa('CRASH')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleWaAction('CRASH')}
                      className="group/btn w-full min-h-[48px] px-6 py-3.5 inline-flex items-center justify-center gap-2 bg-ink hover:bg-violet-pen text-paper hover:text-white text-sm sm:text-base font-medium transition-colors whitespace-nowrap"
                    >
                      <RedPen type="underline" seed={3} drawOnHover>
                        Ask about CRASH
                      </RedPen>
                      <IconArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                </article>
              </div>

              {/* =================================================================
                  PAID SERVICE: THREE LIVE IELTS SPEAKING MOCKS — BDT 499
                  Introductory offer conducted on Google Meet with individual feedback
                 ================================================================= */}
              <SpeakingMocksSection onNavigateHome={navigateHome} />

              {/* =================================================================
                  CONVERSION COMPARISON: NEGATIVE GUARANTEE + WHY THEORY ALONE FAILS
                 ================================================================= */}
              <div className="mt-12 border border-rule-strong bg-ivory p-6 sm:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-rule">
                  {/* Column 1: The Cost of Retaking IELTS (Negative Guarantee) */}
                  <div className="lg:col-span-4 lg:pr-6">
                    <span className="block font-mono text-[11px] uppercase tracking-widest text-examiner-red font-semibold">
                      01 · The Cost of Guessing
                    </span>
                    <h3 className="mt-2 font-serif text-xl sm:text-2xl text-ink font-normal">
                      1 IELTS Retake Fee:{' '}
                      <RedPen type="underline" seed={0}>
                        BDT 22,500+
                      </RedPen>
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-ink-muted leading-relaxed">
                      Missing your target sub-band by 0.5 in Writing or Reading costs <strong className="text-ink font-medium">BDT 22,500+ in official retake fees</strong>—plus 6 to 12 months of delayed university intake or visa processing. Fixing the exact reason you lose marks before exam day costs a fraction of one retake.
                    </p>
                  </div>

                  {/* Column 2: Why Theory Alone Fails for Writing & Speaking */}
                  <div className="pt-6 lg:pt-0 lg:col-span-4 lg:px-6">
                    <span className="block font-mono text-[11px] uppercase tracking-widest text-violet-pen font-semibold">
                      02 · Why Theory Alone Fails
                    </span>
                    <h3 className="mt-2 font-serif text-xl sm:text-2xl text-ink font-normal">
                      Attempt → Examiner Feedback → Fix
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-ink-muted leading-relaxed">
                      In <strong className="text-ink font-medium">Reading &amp; Listening</strong>, our BDT 499 Self-Prep Guides can push your score up fast because answers are objective. In <strong className="text-ink font-medium">Writing &amp; Speaking</strong>, watching videos or reading tips alone cannot show you your own grammar and coherence blind spots—you need live red-pen correction.
                    </p>
                  </div>

                  {/* Column 3: 50% PDF Fee Credit Guarantee */}
                  <div className="pt-6 lg:pt-0 lg:col-span-4 lg:pl-6">
                    <span className="block font-mono text-[11px] uppercase tracking-widest text-ink font-semibold">
                      03 · Risk-Free Upgrade Path
                    </span>
                    <h3 className="mt-2 font-serif text-xl sm:text-2xl text-ink font-normal">
                      50% PDF Fee Credit Guarantee
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-ink-muted leading-relaxed">
                      Not ready for a full course yet? Start with any <strong className="text-ink font-medium">Self-Prep Guide (BDT 499)</strong> or the <strong className="text-ink font-medium">Complete 4-Guide Bundle (BDT 1,499)</strong>. If you join the 12-Week Batch or 1-to-1 Crash Course within 14 days, <strong className="text-ink font-medium">50% of what you paid for your PDFs is deducted</strong> from your course fee.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================================
              8. HOW TO JOIN (Admission help — 3 plain steps + optional video slot)
             ===================================================================== */}
          <section id="how-to-join" className="py-20 sm:py-28 border-b border-rule scroll-mt-16">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl mb-14">
                <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
                  07. How to Take Admission
                </span>
                <h2 className="font-serif text-display-section font-normal text-ink">
                  Three{' '}
                  <RedPen type="underline" seed={1}>
                    plain steps
                  </RedPen>{' '}
                  to join.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 border-t border-rule divide-y md:divide-y-0 md:divide-x divide-rule">
                <div className="py-6 md:pr-8">
                  <span className="font-mono text-xs text-violet-pen tabular-nums">Step 01</span>
                  <h3 className="mt-2 font-serif text-2xl text-ink font-normal">
                    Message us on WhatsApp
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                    Tap any button on this page or message <strong className="text-ink font-mono">{SITE_CONFIG.whatsapp.displayNumber}</strong> with <strong className="text-ink font-mono">ENROLL</strong> or <strong className="text-ink font-mono">CRASH</strong>. No registration forms required.
                  </p>
                </div>

                <div className="py-6 md:px-8">
                  <span className="font-mono text-xs text-violet-pen tabular-nums">Step 02</span>
                  <h3 className="mt-2 font-serif text-2xl text-ink font-normal">
                    Take the free diagnostic or chat about your target
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                    Send your Writing Task 2 introduction for a free evaluation, try the Score Rescue diagnostic, or tell Jubayer your current band and exam timeline.
                  </p>
                </div>

                <div className="py-6 md:pl-8">
                  <span className="font-mono text-xs text-violet-pen tabular-nums">Step 03</span>
                  <h3 className="mt-2 font-serif text-2xl text-ink font-normal">
                    Confirm your seat
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                    Once we confirm the program matches your target band, lock in your seat in the 10-student batch or schedule your 1-to-1 live slots.
                  </p>
                </div>
              </div>

              {/* Optional Video Slot — renders ONLY if a real video URL is provided in config */}
              {SITE_CONFIG.admissionVideoUrl && (
                <div className="mt-12 pt-8 border-t border-rule">
                  <p className="font-mono text-xs uppercase tracking-wider text-ink-muted mb-4">
                    Video Guide: How to take admission
                  </p>
                  <div className="aspect-video w-full max-w-3xl bg-ivory border border-rule overflow-hidden">
                    <video
                      src={SITE_CONFIG.admissionVideoUrl}
                      controls
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Hand-scribbled red divider between major sections */}
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -my-2">
            <RedPen type="divider" seed={0} />
          </div>

          {/* =====================================================================
              9. FAQ (Includes both Program and Self-Prep Guides FAQ items)
             ===================================================================== */}
          <section id="faq" className="py-20 sm:py-28 border-b border-rule scroll-mt-16">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4">
                  <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
                    08. Common Questions
                  </span>
                  <h2 className="font-serif text-display-section font-normal text-ink">
                    <RedPen type="underline" seed={2}>
                      Straight answers
                    </RedPen>{' '}
                    before you message.
                  </h2>
                </div>

                <div className="lg:col-span-8 border-t border-rule divide-y divide-rule">
                  {FAQ_ITEMS.map((item, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div key={item.question} className="py-5">
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          aria-expanded={isOpen}
                          className="w-full min-h-[44px] flex items-center justify-between gap-4 text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-violet-pen"
                        >
                          <span className="font-serif text-lg sm:text-xl text-ink group-hover:text-violet-pen transition-colors">
                            {item.question}
                          </span>
                          <span className="w-8 h-8 shrink-0 inline-flex items-center justify-center border border-rule text-ink-muted group-hover:border-ink group-hover:text-ink transition-colors">
                            <IconPlusMinus open={isOpen} />
                          </span>
                        </button>

                        {isOpen && (
                          <div className="mt-3 pr-10 text-sm sm:text-base text-ink-muted leading-relaxed max-w-[65ch]">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================================
              10. FINAL CTA ("Ready to stop guessing?")
             ===================================================================== */}
          <section className="py-24 sm:py-32 border-b border-rule bg-ivory/50">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
                <div className="lg:col-span-7">
                  <span className="block font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
                    09. Start Here
                  </span>
                  <h2 className="font-serif text-display-hero font-normal text-ink">
                    Ready to{' '}
                    <RedPen type="underline" seed={3}>
                      stop guessing?
                    </RedPen>
                  </h2>

                  <div className="mt-8 space-y-2 font-serif text-xl sm:text-2xl text-ink-muted">
                    <p className="text-ink">Start with the system.</p>
                    <p>Know your weakness.</p>
                    <p>Work on the right thing.</p>
                    <p>Get feedback.</p>
                    <p className="text-ink">Track your progress.</p>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col items-start lg:items-end">
                  <a
                    href={wa('RESCUE')}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleWaAction('RESCUE')}
                    className="group/btn w-full sm:w-auto min-h-[52px] px-8 py-4 inline-flex items-center justify-center gap-2.5 bg-violet-pen hover:bg-violet-pen-hover text-white text-base font-medium transition-colors whitespace-nowrap"
                  >
                    <RedPen type="underline" seed={0} drawOnHover>
                      Message on WhatsApp
                    </RedPen>
                    <IconArrowUpRight className="w-4 h-4" />
                  </a>

                  <p className="mt-4 font-mono text-sm text-ink tabular-nums">
                    WhatsApp:{' '}
                    <a
                      href={wa('GENERAL')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleWaAction('GENERAL')}
                      className="underline underline-offset-4 hover:text-violet-pen"
                    >
                      {SITE_CONFIG.whatsapp.displayNumber}
                    </a>
                    <span className="mx-2 text-ink-subtle" aria-hidden="true">·</span>
                    <a
                      href={SITE_CONFIG.founder.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-violet-pen"
                    >
                      <IconFacebook className="w-3.5 h-3.5" />
                      <span>Facebook</span>
                    </a>
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink-muted">
                    <button
                      type="button"
                      onClick={() => openRescueModal('Final CTA - Download the Free Rescue Guide')}
                      className="text-ink underline underline-offset-4 hover:text-violet-pen cursor-pointer"
                    >
                      Download the free 38-page Rescue Guide
                    </button>{' '}
                    or message "WRITE" for a free Task 2 intro evaluation.
                  </p>
                  <p className="mt-2 font-mono text-xs text-ink">
                    <a
                      href="/guides"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToGuides();
                      }}
                      className="underline underline-offset-4 hover:text-violet-pen"
                    >
                      Or start with a self-prep guide.
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* =====================================================================
          L. FOOTER (Includes link to /guides and mandatory disclaimer)
         ===================================================================== */}
      <footer className="py-12 pb-24 md:pb-12 bg-paper text-ink-muted text-xs">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-rule">
            <div>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigateHome();
                }}
                aria-label="IELTS DECODED Home"
                className="inline-flex items-center hover:opacity-90 transition-opacity"
              >
                <BrandLogo size="sm" />
              </a>
              <p className="mt-2 text-sm text-ink-muted">
                Helping Academic IELTS students find what’s holding their score back.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-mono text-xs sm:text-right">
              <a
                href="/study-plan"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToStudyPlan();
                }}
                className="text-ink font-medium underline underline-offset-4 hover:text-violet-pen"
              >
                Free Study Plan Builder
              </a>
              <a
                href="/diagnostic"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToDiagnostic();
                }}
                className="text-ink font-medium underline underline-offset-4 hover:text-violet-pen"
              >
                Writing Checker &amp; Score Advisor
              </a>
              <a
                href="/guides"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToGuides();
                }}
                className="text-ink font-medium underline underline-offset-4 hover:text-violet-pen"
              >
                Self-Prep Guides (BDT 499)
              </a>
              <a
                href="/tips"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToTips();
                }}
                className="text-examiner-red font-medium underline underline-offset-4 hover:text-violet-pen"
              >
                Mistake of the Week Tips
              </a>
              <div>
                <span className="text-ink-subtle">WhatsApp Direct: </span>
                <a
                  href={wa(floatingWaTarget)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleWaAction(floatingWaTarget)}
                  className="text-ink font-medium underline underline-offset-4 hover:text-violet-pen tabular-nums"
                >
                  {SITE_CONFIG.whatsapp.displayNumber}
                </a>
              </div>
              <a
                href={SITE_CONFIG.founder.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-ink font-medium underline underline-offset-4 hover:text-violet-pen"
              >
                <IconFacebook className="w-3.5 h-3.5" />
                <span>Facebook</span>
                <IconArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Optional Socials, Refund Terms, Class Schedule & Policy Links */}
          {(SITE_CONFIG.footerLinks.socials.length > 0 ||
            SITE_CONFIG.footerLinks.policies.length > 0 ||
            Boolean(SITE_CONFIG.footerLinks.refundTermsText) ||
            Boolean(SITE_CONFIG.footerLinks.classScheduleText) ||
            Boolean(SITE_CONFIG.footerLinks.legalText)) && (
            <div className="py-6 border-b border-rule flex flex-wrap items-center justify-between gap-4">
              {SITE_CONFIG.footerLinks.socials.length > 0 && (
                <div className="flex flex-wrap items-center gap-4">
                  {SITE_CONFIG.footerLinks.socials.map((s) => (
                    <a
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-muted hover:text-ink underline underline-offset-4"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              )}

              {SITE_CONFIG.footerLinks.policies.length > 0 && (
                <div className="flex flex-wrap items-center gap-4">
                  {SITE_CONFIG.footerLinks.policies.map((p) => (
                    <a
                      key={p.url}
                      href={p.url}
                      className="text-ink-muted hover:text-ink underline underline-offset-4"
                    >
                      {p.label}
                    </a>
                  ))}
                </div>
              )}

              {SITE_CONFIG.footerLinks.refundTermsText && (
                <p className="font-mono text-xs text-ink-muted">
                  {SITE_CONFIG.footerLinks.refundTermsText}
                </p>
              )}

              {SITE_CONFIG.footerLinks.classScheduleText && (
                <p className="font-mono text-xs text-ink-muted">
                  {SITE_CONFIG.footerLinks.classScheduleText}
                </p>
              )}

              {SITE_CONFIG.footerLinks.legalText && (
                <p className="font-mono text-xs text-ink-subtle">
                  {SITE_CONFIG.footerLinks.legalText}
                </p>
              )}
            </div>
          )}

          {/* Secondary Links to All Crawl Routes, Case Study, Tips Hub, Payment Verification & Share Result */}
          <div className="py-5 border-b border-rule flex flex-col gap-3 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigateHome();
                }}
                className="text-ink hover:text-violet-pen underline underline-offset-4"
              >
                IELTS DECODED Home
              </a>
              <a
                href="/diagnostic"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToDiagnostic();
                }}
                className="text-ink hover:text-violet-pen underline underline-offset-4"
              >
                Free IELTS Writing Checker (/diagnostic)
              </a>
              <a
                href="/study-plan"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToStudyPlan();
                }}
                className="text-ink hover:text-violet-pen underline underline-offset-4"
              >
                Free IELTS Study Plan Builder (/study-plan)
              </a>
              <a
                href="/guides"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToGuides();
                }}
                className="text-ink hover:text-violet-pen underline underline-offset-4"
              >
                4-Module Self-Prep PDF Guides (/guides)
              </a>
              <a
                href="/tips"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToTips();
                }}
                className="text-ink hover:text-violet-pen underline underline-offset-4"
              >
                Most Common IELTS Mistakes &amp; Tips (/tips)
              </a>
              <a
                href="/case-study"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToCaseStudy();
                }}
                className="text-ink hover:text-violet-pen underline underline-offset-4"
              >
                Band 6.0 → 7.5+ Essay Case Study (/case-study)
              </a>
              <a
                href="/band-calculator"
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', '/band-calculator');
                    syncClientSeoForRoute('/band-calculator');
                    setCurrentRoute('diagnostic');
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="text-ink-muted hover:text-ink underline underline-offset-4"
              >
                IELTS Band Calculator (/band-calculator)
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
              <button
                type="button"
                onClick={() => openActionModal('paid_verification')}
                className="text-violet-pen hover:text-ink underline underline-offset-4 cursor-pointer"
              >
                I’ve Paid — Submit TrxID
              </button>
              <button
                type="button"
                onClick={() => openActionModal('share_result')}
                className="text-ink-muted hover:text-ink underline underline-offset-4 cursor-pointer"
              >
                Share Your IELTS Result
              </button>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-subtle hover:text-ink underline underline-offset-4"
              >
                XML Sitemap
              </a>
            </div>
          </div>

          {/* Mandatory Disclaimer (Item 23) */}
          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-ink-subtle leading-relaxed">
            <p>
              IELTS DECODED is not affiliated with or endorsed by IELTS, British Council, IDP or Cambridge. Band scores are estimates. Individual results vary. Educational purposes only.
            </p>
            <p className="font-mono tabular-nums shrink-0">
              © {new Date().getFullYear()} IELTS DECODED
            </p>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          MOBILE-ONLY STICKY BOTTOM BAR (Shown on landing page; /guides has its own bundle bar)
         ===================================================================== */}
      {currentRoute === 'home' && (
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper border-t border-rule px-4 py-2 transition-transform duration-200 ${
            pastHero && !keyboardOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
          }`}
          aria-hidden={!pastHero || keyboardOpen}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[11px] text-ink truncate">
                Free 38-page PDF Guide
              </p>
              <p className="font-mono text-[10px] text-ink-muted truncate tabular-nums">
                Instant direct PDF download
              </p>
            </div>

            <button
              type="button"
              onClick={() => openRescueModal('Mobile Sticky Bar - Free Rescue Guide')}
              className="group/btn min-h-[40px] px-4 py-2 inline-flex items-center gap-1.5 bg-violet-pen text-white text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RedPen type="underline" seed={0} drawOnHover>
                Download Free Guide
              </RedPen>
              <IconArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          FREE RESCUE GUIDE & 5-PAGE SAMPLE CHAPTER MODAL
         ===================================================================== */}
      <FreeRescueModal
        isOpen={rescueModalOpen}
        sourceLabel={rescueModalSource}
        sampleModuleId={sampleModuleId}
        onClose={() => {
          setRescueModalOpen(false);
          setSampleModuleId(null);
        }}
      />

      {/* =====================================================================
          CONVERSION ACTION MODALS (I've Paid, Batch Application, Share Result, Waitlist)
         ===================================================================== */}
      <ConversionActionModal
        activeModal={activeActionModal}
        defaultProduct={actionModalDefaultProduct}
        onClose={() => setActiveActionModal(null)}
      />

      {/* =====================================================================
          FLOATING CIRCULAR WHATSAPP BUTTON (Bottom-right corner, always visible)
         ===================================================================== */}
      <a
        href={wa(floatingWaTarget)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleWaAction(floatingWaTarget)}
        aria-label={`Message Jubayer Siddiki on WhatsApp (${SITE_CONFIG.whatsapp.displayNumber})`}
        title={`Message Jubayer Siddiki on WhatsApp (${SITE_CONFIG.whatsapp.displayNumber})`}
        className={`group fixed right-4 sm:right-6 z-40 w-14 h-14 rounded-full bg-violet-pen hover:bg-violet-pen-hover text-white border border-rule-strong shadow-md flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-pen ${
          currentRoute === 'guides' || (pastHero && !keyboardOpen)
            ? 'bottom-20 md:bottom-6'
            : 'bottom-5 md:bottom-6'
        }`}
      >
        <IconWhatsApp className="w-6 h-6 transition-transform duration-200 group-hover:scale-105" />
      </a>

      {/* =====================================================================
          WHATSAPP DIRECT DISPATCH BAR
         ===================================================================== */}
      {waSheetKeyword && (
        <div
          role="region"
          aria-label="WhatsApp direct link and message copy"
          className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 sm:w-[420px] z-50 bg-paper border border-rule-strong shadow-lg p-4"
        >
          <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-rule">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-examiner-red block">
                WhatsApp Direct · {SITE_CONFIG.whatsapp.displayNumber}
              </span>
              <p className="font-serif text-base text-ink mt-0.5">
                Opening WhatsApp chat with Jubayer Siddiki…
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWaSheetKeyword(null)}
              aria-label="Close WhatsApp helper"
              className="p-1 text-ink-muted hover:text-ink cursor-pointer"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 p-2.5 bg-ivory border border-rule font-mono text-xs text-ink">
            "{getWaMessageText(waSheetKeyword)}"
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={wa(waSheetKeyword)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-[38px] px-3 py-1.5 bg-violet-pen hover:bg-violet-pen-hover text-white font-mono text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>Open wa.me/{SITE_CONFIG.whatsapp.internationalNumber}</span>
              <IconArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => copyToClipboard(SITE_CONFIG.whatsapp.displayNumber, 'number')}
              className="min-h-[38px] px-3 py-1.5 border border-rule bg-surface-elevated hover:border-ink font-mono text-xs text-ink cursor-pointer"
            >
              {copiedState === 'number' ? 'Copied number ✓' : 'Copy number'}
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard(getWaMessageText(waSheetKeyword), 'message')}
              className="min-h-[38px] px-3 py-1.5 border border-rule bg-surface-elevated hover:border-ink font-mono text-xs text-ink cursor-pointer"
            >
              {copiedState === 'message' ? 'Copied text ✓' : 'Copy message'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
