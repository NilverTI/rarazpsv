import { siteContent } from "./data/site-content.js";
import { renderHeader } from "./components/Header/Header.js";
import { renderFooter } from "./components/Footer/Footer.js";
import { renderMainSections } from "./components/sections-index.js";
import { renderConversionPage } from "./components/Conversion/ConversionPage.js";
import { initRevealAnimations } from "./core/animations.js";
import { initMenu } from "./core/menu.js";
import { initForms } from "./core/forms.js";
import { initRouter } from "./core/router.js";
import { $ } from "./utils/dom.js";
import { initAuth, getSession } from "./utils/auth.js";
import { initAuthUI } from "./core/auth-ui.js";
import { getConductores, revalidateConductores, getDriversMetadata } from "./utils/drivers-store.js";
import { getCachedCompanySnapshot } from "./utils/trucky.js";

const TRUCKY_SYNC_INTERVAL_MS = 10 * 60 * 1000;
let lastAppliedSnapshotSignature = null;
let truckySyncIntervalId = null;

/**
 * Main Application Orchestrator
 */
function renderApp() {
  const header = $("#site-header");
  const main = $("#main-content");
  const footer = $("#site-footer");
  const pageType = document.body.dataset.page;

  if (!header || !main || !footer) return;

  // Global Components
  header.innerHTML = renderHeader(siteContent);
  footer.innerHTML = renderFooter(siteContent);

  // Page-specific Content
  if (pageType === "index") {
    main.innerHTML = renderMainSections(siteContent);
    initRouter(); // Only needed for scroll-spy navigation on index
  } else if (pageType === "conversion" || pageType === "booking") {
    main.innerHTML = renderConversionPage(siteContent);
    window.scrollTo(0, 0);
  }
}

/**
 * Optimized Statistics Update
 */
function applyHeroStats(stats) {
  if (!stats) return;
  
  try {
    siteContent.hero.stats = siteContent.hero.stats.map(s => {
      const label = (s.label || "").toLowerCase();
      if (label.includes("km recorridos")) return { ...s, value: stats.kmRecorridos };
      if (label.includes("conductores")) return { ...s, value: stats.conductoresActivos };
      if (label.includes("servicios")) return { ...s, value: stats.serviciosRealizados };
      return s;
    });

    if (document.body.dataset.page === "index") {
      const main = $("#main-content");
      if (main) {
        main.innerHTML = renderMainSections(siteContent);
        initRevealAnimations();
        initRouter();
      }
    }
  } catch (e) {
    console.error("Layout: Stats update failed.", e.message);
  }
}

async function integrateDrivers() {
  try {
    // SWR Pattern: getConductores returns cache instantly and revalidates in background
    const drivers = await getConductores((updatedDrivers) => {
      if (!updatedDrivers || updatedDrivers.length === 0) return;
      
      siteContent.drivers = updatedDrivers;
      renderApp();
      initRevealAnimations();
      console.log("Drivers Sync Engine: UI updated with fresh background data.");
    });

    if (drivers && drivers.length > 0) {
      siteContent.drivers = drivers;
      renderApp();
    }

    // Update Hero Stats (Safe sync fallback)
    const meta = getDriversMetadata();
    if (meta?.heroStats) {
      applyHeroStats(meta.heroStats);
    }
  } catch (error) {
    console.warn("Drivers Sync Engine: Graceful degradation in effect.", error.message);
  }
}

function initSyncCycles() {
  const sync = () => {
    if (document.body.dataset.page !== "index") return;
    if (document.visibilityState === "hidden") return;
    integrateDrivers();
  };

  sync();

  if (!truckySyncIntervalId) {
    truckySyncIntervalId = window.setInterval(sync, TRUCKY_SYNC_INTERVAL_MS);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") sync();
  });

  window.addEventListener("focus", sync);
  window.addEventListener("online", sync);
}

function bootstrap() {
  document.documentElement.classList.remove("no-js");

  // Phase 1: Sudden Deep Hydration (Sync Metadata)
  try {
    const meta = getDriversMetadata();
    if (meta?.heroStats) {
      applyHeroStats(meta.heroStats);
      console.log("Bootstrap: Hero stats hydrated instantly.");
    }
  } catch (e) {
    console.warn("Bootstrap: Sync hydration skipped.");
  }

  // Initial Sync Start (Will fire background revalidation)
  integrateDrivers();

  // Phase 2: Initial Render (Will use cached data if available)
  renderApp();
  initRevealAnimations();
  initMenu();
  initForms();

  if (document.body.dataset.page === "index") {
    initSyncCycles();
  }

  // Auth Initialization
  initAuth();
  initAuthUI();
  getSession().then(session => {
    if (session) {
      console.log("Authenticated as:", session.user.email);
      document.documentElement.classList.add("is-authenticated");
    }
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", bootstrap);
}
