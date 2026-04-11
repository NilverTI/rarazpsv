import { $$ } from "../utils/dom.js";

/**
 * Handles reveal-on-scroll animations using IntersectionObserver
 */
export function initRevealAnimations() {
  const revealElements = $$("[data-reveal]");
  if (!revealElements.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
  );

  revealElements.forEach((element) => observer.observe(element));
}
