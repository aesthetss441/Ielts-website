# IELTS DECODED — World-Class Technical & On-Page SEO Plan

This plan upgrades **IELTS DECODED** into a fully server-prerendered, entity-rich, multi-route search powerhouse engineered to rank **#1 on Google** for `"ielts decoded"`, `"Jubayer Siddiki IELTS"`, and high-intent IELTS tool/mentorship searches in Bangladesh—even when hosted on a `.run.app` / AI Studio domain.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> All three strategic SEO choices have been confirmed from your answers and are built directly into this plan:

- **Confirmed Decision 1 (Active Origin Indexing)**: Dynamic canonical URLs, OpenGraph URLs, Sitemaps, and Schema.org `@id` graphs will automatically resolve to whichever live domain is serving the request (your `.run.app` URL right now, or `ieltsdecoded.com` whenever visited via custom domain) so Google indexes and ranks your live link immediately without ignoring it as a duplicate of another domain.
- **Confirmed Decision 2 (Full-Funnel Keyword Architecture)**: In addition to dominating the exact brand query **`"ielts decoded"`**, each sub-page will target a dedicated keyword cluster:
  - `/` (Homepage): *IELTS DECODED, Jubayer Siddiki IELTS, Academic IELTS Mentorship Bangladesh, IELTS Band 7+ Score Rescue*
  - `/diagnostic` & `/writing-checker`: *Free IELTS Writing Task 2 Checker, IELTS Essay Evaluator Band Descriptors, IELTS Band Score Calculator*
  - `/study-plan`: *Free IELTS Study Plan Generator, Personalized Day-by-Day IELTS Routine PDF*
  - `/guides`: *IELTS Self-Prep Books PDF Bangladesh, IELTS Listening Reading Writing Speaking Module Guides*
  - `/tips` & `/case-study`: *Most Common IELTS Mistakes & Tips, Band 6.0 to 7.5 IELTS Writing Essay Red-Pen Breakdown*
- **Confirmed Decision 3 (Server-Side SEO Pre-Rendering + Google Search Console Support)**: The Express server will inject route-specific `<title>`, `<meta name="description">`, `<link rel="canonical">`, route-specific JSON-LD Schema, and crawlable semantic HTML summaries directly into the initial HTTP response before JavaScript even runs—plus support Google Search Console verification (`GOOGLE_SITE_VERIFICATION` meta tag and verification route).

---

### 1. Overview & Core Concept

- **What It Does**: Eliminates the #1 reason React Single-Page Applications fail to rank on Google (empty `<div id="root"></div>` HTML and mismatched hardcoded canonical domains) and replaces it with server-side route metadata injection, semantic crawlable HTML snapshots, complete XML sitemaps across all 7 routes, `llms.txt` for AI search engines (ChatGPT/Perplexity/Google AI Overviews), and deep Schema.org knowledge-graph markup.
- **Target Audience / Persona**: Googlebot, Bingbot, social crawlers (WhatsApp, Facebook, LinkedIn, X), AI search crawlers, and IELTS candidates searching for **"IELTS DECODED"**, **"Jubayer Siddiki IELTS"**, or free IELTS diagnostic tools.
- **Key Value**: Ensures that when anyone searches **"ielts decoded"** on Google, Google sees an authoritative, fast, self-canonicalized website with rich sitelinks (Writing Checker, Study Plan Generator, Self-Prep Guides, Common Mistakes & Tips, FAQ snippets) and ranks it #1.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Google Search Result Experience (SERP)**: Searching `"ielts decoded"` displays the main brand title, rich FAQ dropdowns, course/product pricing snippets, and direct sitelinks to `/diagnostic`, `/study-plan`, `/guides`, `/tips`, and `/case-study`.
  2. **Social Link Sharing Experience**: Pasting any route URL (`/`, `/diagnostic`, `/study-plan`, `/guides`, `/tips`, `/case-study`) into WhatsApp, Messenger, Facebook, or LinkedIn renders the high-resolution `1200×630` hero preview card with a tailored page title and description for that exact page.
  3. **Internal Semantic Navigation**: Every page maintains clean crawlable `<a href="...">` links in the header and footer so search crawlers traverse all 7 routes (`Home`, `Writing Checker`, `Study Plan`, `Guides`, `Common Mistakes & Tips`, `Band 6.0 to 7.5 Case Study`, `Band Calculator`) in a single pass.
- **Visual Identity & Theme**:
  - Preserves your exact **Academic Editorial** aesthetic (`#FAF7F2` warm paper, `#141413` ink, `#C8102E` examiner red pen, `#5B21B6` action violet, `Fraunces` display serif + `Plus Jakarta Sans` + `JetBrains Mono`).
  - Zero visual clutter added to the student-facing UI—all crawler pre-rendering and structured data work seamlessly under the hood and in semantic footer links.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dynamic Host-Aware Canonical & Sitemap Generation vs. Hardcoded Domain**
  - *Chosen Approach*: Dynamically detect the request origin (`https://<actual-host>`) on the server for `<link rel="canonical">`, `og:url`, `og:image`, `/robots.txt`, and `/sitemap.xml`.
  - *Why*: Previously, `index.html`, `robots.txt`, and `sitemap.xml` hardcoded `https://ieltsdecoded.com/`. When Google crawls a `.run.app` URL and sees `<link rel="canonical" href="https://ieltsdecoded.com/">`, Google **refuses to index the `.run.app` URL** because the page itself tells Google that another domain is the canonical version! Making it host-aware immediately unlocks indexing on `.run.app` while still working automatically on `ieltsdecoded.com`.
- **Decision 2: Server-Side Route HTML & Crawl Snapshot Injection vs. Client-Only React SEO**
  - *Chosen Approach*: When a request hits `/`, `/guides`, `/diagnostic`, `/writing-checker`, `/study-plan`, `/tips`, or `/case-study`, the server injects that exact route's `<title>`, `<meta name="description">`, `<link rel="canonical">`, JSON-LD structured data, and a semantic crawlable HTML summary inside `<div id="root">` (which React cleanly hydrates/replaces on mount).
  - *Why*: Googlebot indexes server-rendered HTML on the first pass without waiting in the deferred JavaScript rendering queue. Every sub-page becomes an independent, indexable landing page in Google Search.
- **Decision 3: Entity & Brand Authority Graph (`SameAs`, `EducationalOrganization`, `Person`, `ItemList` Sitelinks)**
  - *Chosen Approach*: Connect **IELTS DECODED** (`EducationalOrganization` + `Brand`) to **Jubayer Siddiki** (`Person`, Founder & Author, Overall Band 8.0) and your official Facebook page (`https://www.facebook.com/profile.php?id=61587895062537`), plus `SiteNavigationElement` and `BreadcrumbList` schemas.
  - *Why*: Explicitly linking the brand name `"IELTS DECODED"`, founder name, social profile, and sub-pages in a unified `@graph` is the strongest signal to Google's Knowledge Graph that this site is the #1 official home of `"IELTS DECODED"`.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Incoming Search Crawler / User Request                   │
│     GET / | /diagnostic | /writing-checker | /study-plan | /guides | ...   │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     Express SEO Engine & Route Injector                    │
│  ┌──────────────────────────┬───────────────────────┬───────────────────┐  │
│  │ Dynamic Origin Resolver  │ Per-Route SEO Matrix  │ Crawlable HTML    │  │
│  │ (Detects .run.app or     │ (Unique Title, Meta,  │ Snapshot inside   │  │
│  │  custom domain host)     │  Canonical, OG, JSON) │ <div id="root">   │  │
│  └──────────────────────────┴───────────────────────┴───────────────────┘  │
└───────────┬─────────────────────────────────┬──────────────────────────────┘
            │                                 │
            ▼                                 ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────────┐
│   Dynamic Crawl & AI Endpoints    │ │     Client-Side React Hydration      │
│ • /robots.txt (Host-aware)        │ │ • Client Route SEO Manager syncs     │
│ • /sitemap.xml (All 7 routes +    │ │   document.title, meta description,  │
│   image metadata, host-aware)     │ │   canonical, and og:url on SPA nav   │
│ • /llms.txt (AI Search index)     │ │ • Semantic <a href> internal links   │
│ • /google*.html Verification      │ │   for all 7 indexable routes         │
└───────────────────────────────────┘ └──────────────────────────────────────┘
```

- **Data Model & Per-Route SEO Registry**:
  - Central route registry covering all 7 indexable routes (`/`, `/guides`, `/diagnostic`, `/writing-checker`, `/study-plan`, `/tips`, `/case-study`) with:
    - Exact-match branded title (`IELTS DECODED — ...`)
    - 140–160 character high-CTR meta description
    - Route-specific `BreadcrumbList` and primary entity schema (`Course`, `Product`, `SoftwareApplication`, `Article`, `FAQPage`)
    - Pre-rendered semantic `<h1>`, `<h2>`, copy, and internal navigation links so crawlers see 100% real content on every URL.
- **Interactive Component & State Mapping**:
  - When a user navigates client-side between tabs (`Home`, `Writing Checker`, `Study Plan`, `Guides`, `Common Mistakes & Tips`, `Case Study`), the client SEO synchronizer updates `document.title`, `<meta name="description">`, `<link rel="canonical">`, and `meta[property="og:url"]` in real time.
  - All footer and header route links use real `href="/..."` attributes alongside smooth SPA click handlers so Googlebot discovers and follows every sub-page naturally.
