import { $$, setMenuState } from "../utils/dom.js";

/**
 * Handles scroll-spy active navigation and link behavior
 */
export function initRouter() {
  const sections = $$("main section[id]");
  const links = $$("[data-nav-link]");
  if (!sections.length || !links.length) return;

  const setActiveLink = (id) => {
    links.forEach((link) => {
      const isActive = link.dataset.navLink === id;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const handleScroll = () => {
    const scrollPos = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    if (scrollPos < 100) {
      setActiveLink(sections[0].id);
      return;
    }

    if (scrollPos + windowHeight >= docHeight - 50) {
      setActiveLink(sections[sections.length - 1].id);
      return;
    }

    let currentId = sections[0].id;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= windowHeight * 0.45) {
        currentId = section.id;
      }
    }
    setActiveLink(currentId);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  links.forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });
}
