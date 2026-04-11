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

function bootstrap() {
  document.documentElement.classList.remove("no-js");
  renderApp();
  initRevealAnimations();
  initMenu();
  initForms();
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", bootstrap);
}
