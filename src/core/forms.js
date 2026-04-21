import { $$, showToast } from "../utils/dom.js";

/**
 * Handles professional form submissions with feedback
 */
export function initForms(root = document) {
  const forms = $$("[data-form]", root);
  forms.forEach((form) => {
    if (form.dataset.formBound === "true") return;
    form.dataset.formBound = "true";

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      const defaultLabel = submitButton?.dataset.defaultLabel ?? (submitButton?.textContent || "Enviar");

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalText = defaultLabel;
        submitButton.textContent = "Enviando...";
      }

      window.setTimeout(() => {
        form.reset();

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitButton.dataset.originalText;
        }

        showToast(form.dataset.successMessage || "Mensaje enviado correctamente.");
      }, 850);
    });
  });
}
