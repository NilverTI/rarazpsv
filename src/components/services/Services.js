import { escapeHtml } from "../../utils/dom.js";
import { ICONS } from "../../data/icons.js";

/**
 * Services (Servicios) Section Renderer
 */
export function renderServices({ services }) {
  // Duplicate services for seamless looping in the ticker
  const tickerItems = [...services, ...services, ...services];

  return `
    <section class="section--ticker" id="servicios">
      <div class="ticker-container">
        <div class="ticker-track">
          ${tickerItems
            .map(
              (service) => `
              <div class="ticker-item">
                <span class="ticker-icon">${ICONS[service.icon] ?? ""}</span>
                <span class="ticker-title">${escapeHtml(service.title)}</span>
              </div>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}
