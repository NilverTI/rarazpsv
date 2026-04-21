import { $$ } from "../utils/dom.js";

let revealObserver = null;

function getRevealObserver() {
  if (revealObserver) return revealObserver;

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
  );

  return revealObserver;
}

/**
 * Handles reveal-on-scroll animations using IntersectionObserver
 */
export function initRevealAnimations(root = document) {
  const revealElements = $$("[data-reveal]", root).filter(
    (element) => element.dataset.revealBound !== "true"
  );
  if (!revealElements.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    revealElements.forEach((element) => {
      element.dataset.revealBound = "true";
      element.classList.add("is-visible");
    });
    return;
  }

  const observer = getRevealObserver();

  revealElements.forEach((element) => {
    element.dataset.revealBound = "true";
    observer.observe(element);
  });
}
