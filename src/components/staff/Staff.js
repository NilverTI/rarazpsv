import { escapeHtml } from "../../utils/dom.js";
import { renderSectionHeading } from "../shared/render-utils.js";

/**
 * Staff (Drivers) Section Renderer
 */
export function renderStaff({ drivers }) {
  return `
    <section class="section section--light" id="conductores">
      <div class="site-width">
        ${renderSectionHeading(
          "Staff Experto",
          "Conductores Certificados",
          "Personal altamente calificado con rigurosos protocolos de seguridad y hospitalidad VIP."
        )}

        <div class="staff-grid-flip">
          ${drivers
            .map(
              (driver) => `
                <article class="staff-card-flip" data-reveal>
                  <div class="staff-card-inner">
                    <!-- Front Face -->
                    <div class="staff-card-front">
                      <div class="staff-photo-wrapper">
                        <img src="${escapeHtml(driver.image)}" alt="${escapeHtml(driver.name)}" loading="lazy">
                      </div>
                      <div class="staff-info-front">
                        <h3 class="staff-name-modern">${escapeHtml(driver.name)}</h3>
                      </div>
                      <div class="staff-role-badge">${escapeHtml(driver.role)}</div>
                    </div>

                    <!-- Back Face (Technical Dashboard) -->
                    <div class="staff-card-back">
                      <div class="staff-back-header">
                        <h4>Performance Profile</h4>
                        <div class="staff-id-tag">ID: PSV-${driver.name.substring(0, 3).toUpperCase()}</div>
                      </div>
                      
                      <div class="staff-stats-dashboard">
                        <div class="staff-stat-row">
                          <span class="stat-label">Ruta Pref.</span>
                          <span class="stat-value">${escapeHtml(driver.stats.ruta)}</span>
                        </div>
                        <div class="staff-stat-row">
                          <span class="stat-label">Nivel Trucky</span>
                          <span class="stat-value highlight-gold">${escapeHtml(driver.stats.nivel)}</span>
                        </div>
                        <div class="staff-stat-row">
                          <span class="stat-label">KM del mes</span>
                          <span class="stat-value">${escapeHtml(driver.stats.kmMes)}</span>
                        </div>
                        <div class="staff-stat-row">
                          <span class="stat-label">Distancia total</span>
                          <span class="stat-value highlight-cyan">${escapeHtml(driver.stats.total)}</span>
                        </div>
                      </div>

                      <p class="staff-bio-back">${escapeHtml(driver.bio)}</p>
                    </div>
                  </div>
                </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}
