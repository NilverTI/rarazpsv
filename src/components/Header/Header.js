import { escapeHtml } from "../../utils/dom.js";
import { renderNavLinks } from "../shared/render-utils.js";

/**
 * Header Component Renderer
 */
export function renderHeader({ company, nav }) {
  const isSubPage = typeof document !== "undefined" && document.body.dataset.page !== "index";
  const root = isSubPage ? "index.html" : "";

  return `
    <div class="dock-container">
      <div class="site-width header-shell dock-shell">
        <a class="brand dock-brand" href="${root}#inicio">
          <span class="brand-mark-dock">
            <img src="assets/images/icon/logo.png" alt="Logo">
          </span>
        </a>

        <nav class="nav-dock">
          ${renderNavLinks(nav, "dock-link", true, root)}
        </nav>

        <div class="dock-actions">
          <a href="#contacto" class="btn btn--dock-primary">
            Contacto
          </a>
        </div>
        
        <button class="menu-toggle-dock" aria-label="Menu" data-menu-toggle>
          <span></span><span></span><span></span>
        </button>
      </div>
      
      <div class="menu-drawer-dock">
        <div class="menu-drawer-head">
          <span>Menú de Navegación</span>
        </div>
        <nav class="nav-mobile">
          ${renderNavLinks(nav, "nav-link-mobile", true, root)}
          <a href="#contacto" class="nav-link-mobile">Contacto</a>
        </nav>
      </div>
      <div class="menu-scrim" data-menu-scrim></div>
    </div>`;
}

