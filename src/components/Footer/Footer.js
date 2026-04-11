import { escapeHtml } from "../../utils/dom.js";
import { renderNavLinks } from "../shared/render-utils.js";

/**
 * Footer Component Renderer
 */
export function renderFooter({ company, nav, contact }) {
  const isSubPage = typeof document !== "undefined" && document.body.dataset.page !== "index";
  const root = isSubPage ? "index.html" : "";

  return `
    <div class="footer-top">
      <div class="site-width">
        <div class="footer-grid-premium">
          <div class="footer-col brand-col">
            <a class="brand brand--footer" href="${root}#inicio">
              <span class="brand-mark">
                <img src="assets/images/icon/logo.png" alt="Logo de Turismo Raraz">
              </span>
              <span class="brand-copy">
                <strong>${escapeHtml(company.name)}</strong>
                <small>${escapeHtml(company.tag)}</small>
              </span>
            </a>
            <p class="footer-brand-desc">${escapeHtml(company.description)}</p>
          </div>

          <div class="footer-col">
            <h4 class="footer-label-modern">Explorar</h4>
            <nav class="footer-nav-modern">
              ${renderNavLinks(nav, "footer-link-modern", false, root)}
            </nav>
          </div>

          <div class="footer-col">
            <h4 class="footer-label-modern">Sede Central</h4>
            <div class="footer-contact-item">
              <span class="footer-contact-label">Base Operativa</span>
              <span class="footer-contact-value">${escapeHtml(contact.cards[2].value)}</span>
              <span class="footer-contact-detail">${escapeHtml(contact.cards[2].detail)}</span>
            </div>
            <div class="footer-contact-item">
              <span class="footer-contact-label">Pais</span>
              <span class="footer-contact-value">Peru</span>
            </div>
          </div>

          <div class="footer-col contact-col">
            <h4 class="footer-label-modern">Reservas</h4>
            <div class="footer-contact-item">
              <span class="footer-contact-label">WhatsApp Corporativo</span>
              <a href="https://wa.me/51999555210" class="footer-contact-link-premium">
                ${escapeHtml(contact.cards[0].value)}
              </a>
            </div>
            <div class="footer-contact-item">
              <span class="footer-contact-label">Consultas Ejecutivas</span>
              <a href="mailto:reservas@rarazturismo.pe" class="footer-contact-link-premium">
                ${escapeHtml(contact.cards[1].value)}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom-premium">
      <div class="site-width">
        <div class="footer-bottom-inner">
          <p class="copyright-modern">
            &copy; 2026 <strong>Turismo Raraz [PSV]</strong>.
            <span>Diseno refinado, operacion clara y experiencia lista para produccion.</span>
          </p>
          <div class="footer-social-placeholders">
            <span class="social-placeholder-icon">FB</span>
            <span class="social-placeholder-icon">IG</span>
            <span class="social-placeholder-icon">WA</span>
          </div>
        </div>
      </div>
    </div>`;
}
