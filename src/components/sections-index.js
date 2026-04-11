import { renderHero } from "./hero/Hero.js";
import { renderAbout } from "./about/About.js";
import { renderDestinations } from "./destinations/Destinations.js";
import { renderStaff } from "./staff/Staff.js";
import { renderFleet } from "./fleet/Fleet.js";
import { renderServices } from "./services/Services.js";

/**
 * Aggregates all sections for the main application index page
 */
export function renderMainSections(data) {
  return `
    ${renderHero(data)}
    ${renderAbout(data)}
    ${renderServices(data)}
    ${renderDestinations(data)}
    ${renderStaff(data)}
    ${renderFleet(data)}
  `;
}
