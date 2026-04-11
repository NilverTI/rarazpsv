import { escapeHtml } from "../../utils/dom.js";
import { ICONS } from "../../data/icons.js";

/**
 * Shared rendering helpers for the UI
 */

export function renderSectionHeading(eyebrow, title, description, centered = false) {
  const headClass = centered ? "section-head-centered" : "section-head";
  const eyebrowClass = centered ? "eyebrow eyebrow--cyan" : "eyebrow";
  const titleClass = centered ? "section-title section-title--white" : "section-title";
  const copyClass = centered ? "section-copy-centered" : "section-copy";

  return `
    <div class="${headClass}" data-reveal>
      <div>
        <span class="${eyebrowClass}">${escapeHtml(eyebrow)}</span>
        <h2 class="${titleClass}">${escapeHtml(title)}</h2>
      </div>
      <p class="${copyClass}">${escapeHtml(description)}</p>
    </div>`;
}

export function renderNavLinks(nav, className = "nav-link", enableTracking = true, rootPath = "") {
  return nav
    .map(({ id, label, icon }) => {
      const href = id === "inicio" ? `${rootPath}#top` : `${rootPath}#${escapeHtml(id)}`;
      const iconHtml = icon && ICONS[icon] ? `<span class="nav-icon">${ICONS[icon]}</span>` : "";
      return `
        <a class="${className}" href="${href}"${enableTracking ? ` data-nav-link="${escapeHtml(id)}"` : ""}>
          ${iconHtml}<span>${escapeHtml(label)}</span>
        </a>`;
    })
    .join("");
}
