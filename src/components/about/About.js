import { escapeHtml } from "../../utils/dom.js";
import { ICONS } from "../../data/icons.js";

/**
 * About Section Renderer
 */
export function renderAbout({ about }) {
  return `
    <section class="section section--premium-about" id="nosotros">
      <div class="site-width">
        <!-- Dashboard Layout: Narrative + Operational Pillars -->
        <div class="about-dashboard-grid">
          <div class="about-narrative-main" data-reveal>
            <span class="eyebrow eyebrow--cyan">Sobre nosotros</span>
            <h2 class="section-title title-over-shadow">${escapeHtml(about.header)}</h2>
            <p class="about-desc-premium">${escapeHtml(about.description)}</p>
          </div>

          <div class="about-pillars-dashboard" data-reveal>
            ${about.values
              .map(
                (pillar) => `
              <div class="pillar-mini-card">
                <div class="pillar-mini-icon">${ICONS[pillar.icon] ?? ""}</div>
                <div class="pillar-mini-info">
                  <h3>${escapeHtml(pillar.title)}</h3>
                  <p>${escapeHtml(pillar.desc)}</p>
                </div>
              </div>`
              )
              .join("")}
          </div>
        </div>

        <!-- Competitive Advantages: Badge Row -->
        <div class="about-advantages-row" data-reveal>
          <div class="advantages-badge-list">
            ${about.advantages
              .map(
                (adv) => `
              <div class="adv-badge">
                <span class="adv-badge-icon">${ICONS[adv.icon] ?? ""}</span>
                <span class="adv-badge-text">${escapeHtml(adv.title)}</span>
              </div>`
              )
              .join("")}
          </div>
        </div>
      </div>
    </section>`;
}
