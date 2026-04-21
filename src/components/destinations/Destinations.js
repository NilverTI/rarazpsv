import { escapeHtml } from "../../utils/dom.js";
import { renderSectionHeading } from "../shared/render-utils.js";

/**
 * Destinations Section Renderer
 */
export function renderDestinations({ destinations }) {
  return `
    <section class="section section--soft" id="destinos">
      <div class="site-width">
        ${renderSectionHeading(
          "Conectando Experiencias",
          "Destinos Principales",
          "Rutas clave y logistica de vanguardia conectando los puntos mas importantes del pais."
        )}

        <div class="destination-grid destination-grid--compact">
          ${destinations
            .map(
              (dest) => `
                <article class="destination-card-modern" data-reveal>
                  <div class="dest-image-wrapper">
                    <img src="${escapeHtml(dest.image)}" alt="${escapeHtml(dest.alt)}" loading="lazy" decoding="async" fetchpriority="low">
                    <span class="dest-badge-high">${escapeHtml(dest.badge)}</span>
                  </div>
                  <div class="dest-content-glass">
                    <h3 class="dest-title-modern">${escapeHtml(dest.title)}</h3>
                    <p class="dest-desc-modern">${escapeHtml(dest.description)}</p>
                    <div class="dest-meta-row">
                      ${dest.meta.map((meta) => `<span class="dest-meta-tag">${escapeHtml(meta)}</span>`).join("")}
                    </div>
                    <a href="booking.html" class="dest-cta-minimal">${escapeHtml(dest.cta)} -></a>
                  </div>
                </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}
