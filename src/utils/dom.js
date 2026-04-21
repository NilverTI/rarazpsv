/**
 * DOM Utilities & Shared Helpers
 */

let toastTimeoutId = null;

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function setMenuState(isOpen) {
  const toggleButton = $("[data-menu-toggle]");
  const header = $("#site-header");
  const body = document.body;

  if (!toggleButton || !header) return;

  toggleButton.setAttribute("aria-expanded", String(isOpen));
  header.classList.toggle("is-menu-open", isOpen);
  body.style.overflow = isOpen ? "hidden" : "";
}

export function showToast(message) {
  const toast = $("#site-toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("is-visible");

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toastTimeoutId = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 4000);
}
