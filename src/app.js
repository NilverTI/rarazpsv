import { siteContent } from "./data/site-content.js";
import { renderHeader } from "./components/Header/Header.js";
import { renderFooter } from "./components/Footer/Footer.js";
import { renderMainSections } from "./components/sections-index.js";
import { renderConversionPage } from "./components/Conversion/ConversionPage.js";
import { renderStaffCards } from "./components/staff/Staff.js";
import { initRevealAnimations } from "./core/animations.js";
import { initMenu } from "./core/menu.js";
import { initForms } from "./core/forms.js";
import { initRouter } from "./core/router.js";
import { $ } from "./utils/dom.js";
import { initAuth, getSession } from "./utils/auth.js";
import { initAuthUI } from "./core/auth-ui.js";
import { getConductores, getDriversMetadata } from "./utils/drivers-store.js";
import { getCachedCompanySnapshot } from "./utils/trucky.js";

const COMPANY_ID = "41299";
const TRUCKY_SYNC_INTERVAL_MS = 10 * 60 * 1000;
const TRUCKY_EVENT_SYNC_DEBOUNCE_MS = 1200;
const TRUCKY_EVENT_SYNC_COOLDOWN_MS = 45 * 1000;

let truckySyncIntervalId = null;
let hasRenderedShell = false;
let hasRenderedPage = false;
let renderedDriversSignature = null;
let renderedHeroStatsSignature = null;
let integrateDriversPromise = null;
let syncDebounceId = null;
let lastDriversSyncAt = 0;

function getHeroStatsState() {
  return siteContent.hero.stats.reduce((accumulator, stat) => {
    if (stat?.key) {
      accumulator[stat.key] = stat.value;
    }

    return accumulator;
  }, {});
}

function createHeroStatsSignature(stats) {
  return ["kmRecorridos", "conductoresActivos", "serviciosRealizados"]
    .map((key) => String(stats?.[key] ?? ""))
    .join("|");
}

function createDriversSignature(drivers) {
  if (!Array.isArray(drivers) || drivers.length === 0) return "empty";

  return drivers
    .map((driver) => {
      const identity = driver.id || driver.truckyId || driver.nombre || driver.name || "driver";
      const jobs = driver.metrics?.servicios || driver.stats?.jobs || 0;
      const total = driver.metrics?.distanciaTotal || driver.stats?.total || "0";
      return `${identity}:${jobs}:${total}`;
    })
    .join("|");
}

function setHeroStatsState(stats) {
  if (!stats) return;

  siteContent.hero.stats = siteContent.hero.stats.map((stat) => {
    if (!stat?.key || stats[stat.key] == null) return stat;
    return { ...stat, value: String(stats[stat.key]) };
  });
}

function renderShell() {
  if (hasRenderedShell) return;

  const header = $("#site-header");
  const footer = $("#site-footer");
  if (!header || !footer) return;

  header.innerHTML = renderHeader(siteContent);
  footer.innerHTML = renderFooter(siteContent);
  hasRenderedShell = true;
}

function renderCurrentPage() {
  if (hasRenderedPage) return;

  const main = $("#main-content");
  const pageType = document.body.dataset.page;
  if (!main) return;

  if (pageType === "index") {
    main.innerHTML = renderMainSections(siteContent);
    renderedDriversSignature = createDriversSignature(siteContent.drivers);
    renderedHeroStatsSignature = createHeroStatsSignature(getHeroStatsState());
  } else if (pageType === "conversion" || pageType === "booking") {
    main.innerHTML = renderConversionPage(siteContent);
    window.scrollTo(0, 0);
  }

  hasRenderedPage = true;
}

function patchHeroStats(stats) {
  if (!stats || document.body.dataset.page !== "index") return;

  setHeroStatsState(stats);

  const nextSignature = createHeroStatsSignature(getHeroStatsState());
  if (nextSignature === renderedHeroStatsSignature) return;

  Object.entries(stats).forEach(([key, value]) => {
    if (value == null) return;

    const statValueNode = document.querySelector(`[data-hero-stat-value="${key}"]`);
    if (statValueNode) {
      statValueNode.textContent = String(value);
    }
  });

  renderedHeroStatsSignature = nextSignature;
}

function patchDriversGrid(drivers) {
  if (!Array.isArray(drivers) || drivers.length === 0) return;

  siteContent.drivers = drivers;

  if (document.body.dataset.page !== "index") return;

  const nextSignature = createDriversSignature(drivers);
  if (nextSignature === renderedDriversSignature) return;

  const staffGrid = document.querySelector("[data-staff-grid]");
  if (!staffGrid) return;

  staffGrid.innerHTML = renderStaffCards(drivers);
  initRevealAnimations(staffGrid);
  renderedDriversSignature = nextSignature;
}

function hydrateAppStateFromCache() {
  try {
    const cachedSnapshot = getCachedCompanySnapshot(COMPANY_ID);
    if (cachedSnapshot?.snapshot?.heroStats) {
      setHeroStatsState(cachedSnapshot.snapshot.heroStats);
    }

    if (cachedSnapshot?.snapshot?.drivers?.length) {
      siteContent.drivers = cachedSnapshot.snapshot.drivers;
    }

    const metadata = getDriversMetadata();
    if (metadata?.heroStats) {
      setHeroStatsState(metadata.heroStats);
    }
  } catch (error) {
    console.warn("Bootstrap: cache hydration skipped.", error.message);
  }
}

async function integrateDrivers() {
  if (integrateDriversPromise) return integrateDriversPromise;

  integrateDriversPromise = (async () => {
    try {
      const drivers = await getConductores((updatedDrivers) => {
        if (!updatedDrivers || updatedDrivers.length === 0) return;

        patchDriversGrid(updatedDrivers);

        const latestMetadata = getDriversMetadata();
        if (latestMetadata?.heroStats) {
          patchHeroStats(latestMetadata.heroStats);
        }

        console.log("Drivers Sync Engine: UI updated with fresh background data.");
      });

      if (drivers?.length) {
        patchDriversGrid(drivers);
      }

      const metadata = getDriversMetadata();
      if (metadata?.heroStats) {
        patchHeroStats(metadata.heroStats);
      }
    } catch (error) {
      console.warn("Drivers Sync Engine: Graceful degradation in effect.", error.message);
    } finally {
      integrateDriversPromise = null;
    }
  })();

  return integrateDriversPromise;
}

function initSyncCycles() {
  const runSync = () => {
    if (document.body.dataset.page !== "index") return;
    if (document.visibilityState === "hidden") return;
    lastDriversSyncAt = Date.now();
    integrateDrivers();
  };

  const scheduleSync = ({ immediate = false, force = false } = {}) => {
    const invoke = () => {
      syncDebounceId = null;

      if (!force && Date.now() - lastDriversSyncAt < TRUCKY_EVENT_SYNC_COOLDOWN_MS) {
        return;
      }

      runSync();
    };

    if (immediate) {
      if (syncDebounceId) {
        clearTimeout(syncDebounceId);
        syncDebounceId = null;
      }
      invoke();
      return;
    }

    if (syncDebounceId) {
      clearTimeout(syncDebounceId);
    }

    syncDebounceId = window.setTimeout(invoke, TRUCKY_EVENT_SYNC_DEBOUNCE_MS);
  };

  scheduleSync({ immediate: true, force: true });

  if (!truckySyncIntervalId) {
    truckySyncIntervalId = window.setInterval(() => {
      scheduleSync({ immediate: true });
    }, TRUCKY_SYNC_INTERVAL_MS);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      scheduleSync();
    }
  });

  window.addEventListener("focus", () => scheduleSync());
  window.addEventListener("online", () => scheduleSync({ immediate: true }));
}

function bootstrap() {
  document.documentElement.classList.remove("no-js");

  hydrateAppStateFromCache();
  renderShell();
  renderCurrentPage();
  initRevealAnimations();
  initMenu();
  initForms();

  if (document.body.dataset.page === "index") {
    initRouter();
    initSyncCycles();
  }

  const authButton = document.querySelector("#auth-member-btn");
  if (authButton) {
    initAuth();
    initAuthUI();
    getSession().then((session) => {
      if (!session) return;

      console.log("Authenticated as:", session.user.email);
      document.documentElement.classList.add("is-authenticated");
    });
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", bootstrap);
}
