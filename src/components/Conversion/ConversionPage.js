import { escapeHtml } from "../../utils/dom.js";

/**
 * Conversion (Booking/Join) Page Renderer
 */
export function renderConversionPage(content) {
  const { contact } = content;

  return `
    <section class="section hero-section" id="reserva">
      <div class="site-width">
        <div class="action-hero card" data-reveal>
          <div class="action-hero-content">
             <span class="eyebrow">Accion directa</span>
             <h1 class="section-title">Reserva tu salida online.</h1>
             <p>Completa los detalles de tu viaje y nuestro equipo comercial te enviara una cotizacion formal en menos de 2 horas.</p>
          </div>

          <form class="booking-form-v3" data-form data-success-message="Solicitud de reserva enviada. Nos contactaremos pronto.">
            <div class="form-grid-v3">
              <label class="field">
                <span>Fecha tentativa</span>
                <input type="date" name="date" required>
              </label>
              <label class="field">
                <span>Destino / Ruta</span>
                <input type="text" name="route" placeholder="Ej: Laguna Raraz" required>
              </label>
              <label class="field">
                <span>Pasajeros</span>
                <input type="number" name="pax" min="1" max="50" placeholder="Ej: 15" required>
              </label>
              <label class="field">
                 <span>WhatsApp de contacto</span>
                 <input type="tel" name="phone" placeholder="+51..." required>
              </label>
            </div>
            <button class="btn btn--primary btn--block btn--compact" type="submit">Solicitar cotizacion</button>
          </form>
        </div>
      </div>
    </section>

    <section class="section section--soft" id="contacto">
      <div class="site-width">
        <div class="dual-action-grid">
          <div class="card card--tight" data-reveal>
            <div class="card-body">
              <span class="eyebrow">Canales oficiales</span>
              <h3>Atencion al cliente</h3>
              <div class="contact-list-mini">
                ${contact.cards
                  .map(
                    (card) => `
                  <div class="contact-item-mini">
                    <strong>${escapeHtml(card.label)}</strong>
                    <p>${escapeHtml(card.value)}</p>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <div class="card card--tight" data-reveal>
            <div class="card-body">
              <span class="eyebrow">Talento</span>
              <h3>Unete a Turismo Raraz</h3>
              <p>Forma parte de la operacion turistica mas confiable del norte.</p>
              <form class="join-form-compact" data-form data-success-message="Postulacion recibida.">
                <input type="text" name="name" placeholder="Tu nombre" required>
                <input type="email" name="email" placeholder="Correo" required>
                <button class="btn btn--secondary btn--block btn--compact" type="submit">Enviar perfil</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
