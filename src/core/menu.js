import { $, setMenuState } from "../utils/dom.js";

/**
 * Handles mobile menu toggle and responsive state
 */
export function initMenu() {
  const toggleButton = $("[data-menu-toggle]");
  const scrim = $("[data-menu-scrim]");
  if (!toggleButton || !scrim) return;

  toggleButton.addEventListener("click", () => {
    const isOpen = toggleButton.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  scrim.addEventListener("click", () => setMenuState(false));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuState(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) {
      setMenuState(false);
    }
  });
}
