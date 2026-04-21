import { $$, setMenuState } from "../utils/dom.js";

let routerCleanup = null;

/**
 * Handles scroll-spy active navigation and link behavior
 */
export function initRouter() {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

  if (routerCleanup) {
    routerCleanup();
    routerCleanup = null;
  }

  const sections = $$("main section[id]");
  const links = $$("[data-nav-link]");
  if (!sections.length || !links.length) return;

  const listenerController = new AbortController();
  const visibleSections = new Map();
  const firstSectionId = sections[0].id;
  const lastSectionId = sections[sections.length - 1].id;

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

  const updateActiveLink = () => {
    const scrollPos = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    if (scrollPos < 100) {
      setActiveLink(firstSectionId);
      return;
    }

    if (scrollPos + windowHeight >= docHeight - 50) {
      setActiveLink(lastSectionId);
      return;
    }

    let currentId = firstSectionId;
    let bestRatio = 0;

    visibleSections.forEach((ratio, sectionId) => {
      if (ratio >= bestRatio) {
        bestRatio = ratio;
        currentId = sectionId;
      }
    });

    setActiveLink(currentId);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleSections.set(entry.target.id, entry.intersectionRatio);
          return;
        }

        visibleSections.delete(entry.target.id);
      });

      updateActiveLink();
    },
    {
      rootMargin: "-18% 0px -45% 0px",
      threshold: [0.15, 0.35, 0.55, 0.75],
    }
  );

  sections.forEach((section) => observer.observe(section));

  links.forEach((link) => {
    link.addEventListener("click", () => setMenuState(false), {
      signal: listenerController.signal,
    });
  });

  window.addEventListener("scroll", updateActiveLink, {
    passive: true,
    signal: listenerController.signal,
  });

  updateActiveLink();

  routerCleanup = () => {
    observer.disconnect();
    visibleSections.clear();
    listenerController.abort();
  };
}
