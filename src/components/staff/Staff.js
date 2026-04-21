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
      .map((driver) => {
        if (!driver) return "";

        // Compatibility & Sanitization Layer: Zero-flicker resilience
        const nombre = String(driver.nombre || driver.name || "Miembro Staff");
        const rol = String(driver.rol || driver.role || "Conductor Certificado");
        const foto = String(driver.foto || driver.image || "assets/images/staff/defecto.jpg");
        const roleTone = String(driver.frente?.roleTone || driver.roleTone || "default");

        // Ensure metrics are always a valid object even if syncing fails
        const rawMetrics = driver.metrics || driver.stats || {};
        const metrics = {
          nivel: String(rawMetrics.nivel || "Expert"),
          kmMes: String(rawMetrics.kmMes || "0 km"),
          distanciaTotal: String(rawMetrics.distanciaTotal || rawMetrics.total || "0 km"),
          servicios: parseInt(rawMetrics.servicios || rawMetrics.jobs || 0, 10) || 0
        };

        const badges = Array.isArray(driver.badges) ? driver.badges : (rol === "Administrador" ? ["Staff"] : []);
        const bio = String(driver.reverso?.bio || driver.bio || "Staff certificado para operaciones logísticas VIP.");
        const profileUrl = driver.reverso?.profileUrl || driver.profileUrl || null;
        const id = String(driver.id || driver.truckyId || "PSV-CON");

        return `
                <article class="staff-card-flip" data-reveal>
                  <div class="staff-card-inner">
                    <!-- Front Face -->
                    <div class="staff-card-front">
                      <div class="staff-photo-wrapper">
                        <img src="${escapeHtml(foto)}" alt="${escapeHtml(nombre)}" loading="lazy" onerror="this.src='assets/images/staff/defecto.jpg'">
                      </div>
                      <div class="staff-info-front">
                        <h3 class="staff-name-modern">${escapeHtml(nombre)}</h3>
                        <div class="staff-badges-container">
                          ${badges.map(b => `<span class="staff-badge-mini">${escapeHtml(b)}</span>`).join("")}
                        </div>
                      </div>
                      <div class="staff-role-badge staff-role-badge--${escapeHtml(roleTone)}">${escapeHtml(rol)}</div>
                    </div>
 
                     <!-- Back Face (Technical Dashboard) -->
                    <div class="staff-card-back">
                      <div class="staff-back-header">
                        <h4>Performance Profile</h4>
                        <div class="staff-id-tag">ID: PSV-${escapeHtml(String(id))}</div>
                      </div>
                      
                      <div class="staff-stats-dashboard">
                        <div class="staff-stat-row">
                          <span class="stat-label">Nivel Trucky</span>
                          <span class="stat-value highlight-gold">${escapeHtml(metrics.nivel || "Expert")}</span>
                        </div>
                        <div class="staff-stat-row">
                          <span class="stat-label">KM del mes</span>
                          <span class="stat-value" data-stat="km-month">${escapeHtml(metrics.kmMes || "0 km")}</span>
                        </div>
                        <div class="staff-stat-row">
                          <span class="stat-label">Distancia total</span>
                          <span class="stat-value highlight-cyan">${escapeHtml(metrics.distanciaTotal || "0 km")}</span>
                        </div>
                        <div class="staff-stat-row">
                          <span class="stat-label">Servicios</span>
                          <span class="stat-value">${escapeHtml(String(metrics.servicios || 0))}</span>
                        </div>
                      </div>
 
                      <div class="staff-footer-back">
                        <p class="staff-bio-back">${escapeHtml(bio)}</p>
                        ${profileUrl ? `
                          <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="trucky-btn-premium">
                            Ver en Trucky
                          </a>
                        ` : ""}
                      </div>
                    </div>
                  </div>
                </article>`;
      })
      .join("")}
        </div>
      </div>
    </section>`;
}
