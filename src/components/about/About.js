import { escapeHtml } from "../../utils/dom.js";
import { ICONS } from "../../data/icons.js";

/**
 * About Section Renderer
 */
export function renderAbout({ about }) {
  return `
    <section class="section section--soft" id="nosotros">
      <div class="site-width">
        <div class="about-dashboard">
          <!-- Main Content: Narrative + Advantages -->
          <div class="about-main-col" data-reveal>
            <div class="about-narrative">
              <span class="eyebrow">${escapeHtml(about.eyebrow)}</span>
              <h2 class="section-title">${escapeHtml(about.header)}</h2>
              <p class="about-copy-compact">${escapeHtml(about.description)}</p>
            </div>

            <div class="about-advantages-compact">
              <h3 class="advantages-subtitle">${escapeHtml(about.advantagesTitle)}</h3>
              <div class="advantage-tokens">
                ${about.advantages
                  .map(
                    (item) => `
                  <div class="advantage-token">
                    <div class="token-icon-mini">${ICONS[item.icon] ?? ""}</div>
                    <span class="token-label">${escapeHtml(item.title)}</span>
                  </div>`
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <!-- Sidebar: Stats + Values -->
          <aside class="about-sidebar" data-reveal>
            <div class="sidebar-group stats-focus">
              ${about.facts
                .map(
                  (fact) => `
                <div class="stat-mini">
                  <strong>${escapeHtml(fact.value)}</strong>
                  <span>${escapeHtml(fact.label)}</span>
                </div>`
                )
                .join("")}
            </div>

            <div class="sidebar-group values-stack">
              <span class="sidebar-label">Pilares Operativos</span>
              ${about.values
                .map(
                  (item) => `
                <article class="value-item-mini">
                  <div class="value-icon-mini">${ICONS[item.icon] ?? ""}</div>
                  <div class="value-text-mini">
                    <h4>${escapeHtml(item.title)}</h4>
                    <p>${escapeHtml(item.desc)}</p>
                  </div>
                </article>`
                )
                .join("")}
            </div>
          </aside>
        </div>
      </div>
    </section>`;
}
