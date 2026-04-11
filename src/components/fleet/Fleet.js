import { escapeHtml } from "../../utils/dom.js";
import { renderSectionHeading } from "../shared/render-utils.js";

/**
 * Fleet (Flota) Section Renderer
 */
export function renderFleet({ fleet }) {
  return `
    <section class="section section--soft" id="flota">
      <div class="site-width">
        ${renderSectionHeading(
          "Unidades Premium",
          "Nuestra Flota",
          "Unidades modernas para grupos grandes y traslados privados con el mas alto standard ejecutivo."
        )}

        <div class="fleet-grid-premium">
          ${fleet
            .map(
              (item) => `
                <article class="fleet-card-premium" data-reveal>
                  <div class="fleet-image-wrapper">
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">
                    <span class="fleet-badge-accent">${escapeHtml(item.accent)}</span>
                  </div>
                  <div class="fleet-content-glass">
                    <div class="fleet-header-row">
                      <h3 class="fleet-title-modern">${escapeHtml(item.title)}</h3>
                      <div class="fleet-divider-line"></div>
                    </div>
                    <p class="fleet-desc-modern">${escapeHtml(item.description)}</p>
                    <div class="fleet-features-minimal">
                      ${item.features.map(f => `<span class="fleet-feat-tag">${escapeHtml(f)}</span>`).join("")}
                    </div>
                  </div>
                </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}
