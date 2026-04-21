import { escapeHtml } from "../../utils/dom.js";

/**
 * Hero Section Renderer
 */
export function renderHero({ hero }) {
  return `
    <section class="section section--hero" id="inicio">
      <div class="hero-stage">
        <img class="hero-bg" src="assets/images/bus1.png" alt="Bus Turismo Raraz en ruta">
        <div class="hero-overlay" aria-hidden="true"></div>

        <div class="site-width hero-container-split">
          <div class="hero-metrics-bar" data-reveal>
            ${hero.stats
              .map(
                (stat) => `
                <div class="glass-metric">
                  <span class="metric-value">${escapeHtml(stat.value)}</span>
                  <span class="metric-label">${escapeHtml(stat.label)}</span>
                </div>`
              )
              .join("")}
          </div>

          <div class="hero-content hero-content--professional" data-reveal>
            <div class="hero-header-row">
              <span class="hero-eyebrow-accent">${escapeHtml(hero.eyebrow)}</span>
            </div>
            
            <h1 class="hero-title--premium">${escapeHtml(hero.title)}</h1>
            <p class="hero-subtitle--featured">${escapeHtml(hero.description)}</p>
            
            <div class="hero-text-block">
              <p class="hero-description--refined">${escapeHtml(hero.secondary)}</p>
            </div>

            <div class="hero-actions-refined">
              <a href="${escapeHtml(hero.primaryCta.href)}" class="btn btn--premium-glow">
                ${escapeHtml(hero.primaryCta.label)} &rarr;
              </a>
              <a href="${escapeHtml(hero.secondaryCta.href)}" class="btn btn--premium-outline">
                ${escapeHtml(hero.secondaryCta.label)}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

