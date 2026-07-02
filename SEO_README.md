# NariCare Production-Ready SEO Optimization

This document outlines the end-to-end SEO, accessibility, performance, and discoverability implementation completed for NariCare (`https://www.naricaree.com/`).

---

## Implemented SEO Core Architecture

### 1. Dynamic Routing & Tab Synchronization (SPA SEO)
We converted the single-page tab transitions into crawlable, state-driven, clean URLs:
* `/` — Landing Page (Home)
* `/about` — Landing Page (Auto-scroll to Story/Science)
* `/features` — Landing Page (Auto-scroll to Experience)
* `/contact` — Support & Feedback portal
* `/privacy` — Privacy Policy & security parameters
* `/terms` — General Terms of Service
* `/dashboard` — Main Analytics Dashboard (Tab: Home)
* `/calendar` — Cycle & Phase calendar view
* `/prediction-lab` — Dynamic predictive hormone laboratory
* `/logger` — Daily biometric logging view
* `/insights` — Personalized correlations and charts
* `/profile` — Private profile controls and report exports

When users toggle tabs inside the dashboard interface, the URL path updates automatically (using history replace state) to ensure that specific views are fully shareable and crawlable by search bots.

### 2. Custom Lightweight SEO Controller (`src/components/SEO.tsx`)
A high-performance React component was created to dynamically update page headers on route changes without external heavy library dependencies:
* **Dynamic Title Tags**: Tailored format matching `Title | NariCare` (e.g. `Cycle Prediction Lab | NariCare`).
* **Dynamic Meta Descriptions**: Customized 150–160 character descriptions rich with target terms (*women's health, AI period tracker, hormone cycle, symptom analytics*) without keyword stuffing.
* **Canonical Link Tags**: Dynamic linking to avoid duplicate parameters (e.g. mapping `/landingpage` back to `/`).
* **Open Graph & Twitter Cards**: Configured standard preview elements (`og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`, `twitter:card`, `twitter:image`) for WhatsApp, Discord, LinkedIn, and Twitter previews.
* **JSON-LD Schema Markup**: Automatic script injection into the DOM head on route transition.

### 3. Rich Schema Markup (JSON-LD)
We integrated fully valid, highly descriptive search engine schemas:
* **Organization**: Branded details, logo, contact points, and verified creator profiles.
* **WebSite**: Website context with potential search actions (`SearchAction` support).
* **SoftwareApplication**: Declarations for the AI tracking application, platform category, and free access model.
* **MedicalWebPage**: Medical description parameters for health forecasting and cycle predictions, avoiding unsupported clinical claims.
* **FAQPage**: Diagnostic query context about prediction methodology.
* **BreadcrumbList**: Structured trail coordinates for path navigation tracking.
* **Person (Creator)**: Connects the designer & developer **Alok Yadav** with matching credentials and portfolio routes.

### 4. Accessibility & Semantic Landmarks
* **HTML5 Semantic Elements**: Replaced generic containers with `<header>`, `<main id="main-content">`, `<section>`, `<footer>`, and `<nav>`.
* **Skip-to-Content Link**: Hidden skip anchor positioned at the top of the body for keyboard-only and screen reader navigation.
* **Viewport & Lang Declaration**: HTML configuration with strict `lang="en"`, `<meta charset="utf-8">`, viewport sizes, and theme colors.

### 5. Media & Performance SEO
* **Image Tag Optimizations**: Explicit `width` and `height` declarations to mitigate cumulative layout shift (CLS), async `decoding`, lazy `loading` parameters, and descriptive `alt` captions.
* **Performance Enhancements**: Integrated preconnect and DNS prefetch links for critical external resources (`fonts.googleapis.com`, `fonts.gstatic.com`) directly in `index.html`.

### 6. Crawl Directives & Offline Support
* **Robots.txt**: Standard production index configuration in `public/robots.txt` referencing sitemap locations while blocking secure dashboards or API patterns (`/onboarding`, `/auth-success`, `/welcome`).
* **Sitemap.xml**: Comprehensive sitemap in `public/sitemap.xml` mapping paths with appropriate crawler frequencies and weights.
* **PWA Service Worker & Manifest**:
  * Enhanced `public/manifest.json` with app orientations, theme colors (`#a53556`), and maskable icon configurations.
  * Extended `public/sw.js` to implement static asset caching (`ASSETS_TO_CACHE`) and navigation fallback logic to ensure offline responsiveness.

---

## Dynamic Meta Tags Summary

| Route | Canonical Target | Page Title | Meta Description |
| :--- | :--- | :--- | :--- |
| `/` | `https://www.naricaree.com/` | NariCare \| AI Women's Health & Smart Period Tracker | NariCare is an AI-powered biological intelligence platform helping women understand cycles, predict symptoms, and track health patterns dynamically. |
| `/about` | `https://www.naricaree.com/about` | About Us \| NariCare | Meet the team and view the technical design philosophy behind NariCare's AI women's health platform. |
| `/features` | `https://www.naricaree.com/features` | Platform Features \| NariCare | Explore NariCare's smart period logs, LH ovulation predictions, neural symptom mapping, and private vault features. |
| `/contact` | `https://www.naricaree.com/contact` | Contact Us \| NariCare | Get in touch with NariCare. Send design feedback, request feature support, or ask developer questions. |
| `/privacy` | `https://www.naricaree.com/privacy` | Privacy Policy \| NariCare | Learn how NariCare protects your biological tracking data and cycle history with zero-knowledge encryption and local-first policies. |
| `/terms` | `https://www.naricaree.com/terms` | Terms of Service \| NariCare | Read the terms of service and conditions governing your use of NariCare's AI tracking models and metabolic forecasts. |
| `/dashboard` | `https://www.naricaree.com/dashboard` | Dashboard \| NariCare | NariCare health dashboard. Monitor cycle stages, symptoms, and autonomic metrics instantly. |
| `/calendar` | `https://www.naricaree.com/calendar` | Cycle Calendar \| NariCare | NariCare menstrual cycle calendar. Schedule and align events dynamically to biological phases. |
| `/prediction-lab` | `https://www.naricaree.com/prediction-lab` | Cycle Prediction Lab \| NariCare | NariCare cycle prediction lab. Volumetric projection of future hormonal curves and LH surges. |
| `/logger` | `https://www.naricaree.com/logger` | Health Logger \| NariCare | NariCare daily health logger. Log mood, sleep quality, symptoms, and hydration levels. |
| `/insights` | `https://www.naricaree.com/insights` | Women's Health Insights \| NariCare | NariCare women's health insights. AI-powered metabolic analysis and cycle correlation maps. |
| `/profile` | `https://www.naricaree.com/profile` | Profile \| NariCare | Manage your NariCare private profile and parameters. Export health reports or delete records. |
| `/404` | `https://www.naricaree.com/404` | 404 - Page Not Found \| NariCare | The page you are looking for does not exist. Return to NariCare home for smart period tracking and body analytics. |
