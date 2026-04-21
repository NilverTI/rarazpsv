/**
 * Auth UI Handlers for Turismo Raraz
 * Managed login/logout interactions and modals.
 */

import { $, showToast } from "../utils/dom.js";
import { login, logout, getSession } from "../utils/auth.js";

export function initAuthUI() {
  const authBtn = $("#auth-member-btn");
  if (!authBtn) return;
  if (authBtn.dataset.authBound === "true") return;

  authBtn.dataset.authBound = "true";

  authBtn.addEventListener("click", async () => {
    const session = await getSession();
    
    if (session) {
      if (confirm(`Sesión iniciada como ${session.user.email}. ¿Deseas cerrar sesión?`)) {
        await logout();
      }
    } else {
      // For now, we'll use a prompt to simulate the professional login flow
      // In a real project, this would trigger a hidden modal component
      const email = prompt("Email de miembro:");
      if (!email) return;
      
      const password = prompt("Contraseña:");
      if (!password) return;

      try {
        showToast("Iniciando sesión...");
        await login(email, password);
        showToast("¡Bienvenido, Staff!");
        window.location.reload();
      } catch (error) {
        showToast("Error de autenticación: " + error.message);
      }
    }
  });
}
