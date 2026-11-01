/**
 * auth.js — Manejo de "autenticación" en el cliente
 *
 * VULNERABILIDAD #2:
 * El estado de autenticación se guarda únicamente en localStorage.
 * No hay tokens firmados, no hay verificación del servidor.
 * Cualquiera puede manipular localStorage desde la consola del navegador
 * para simular que está autenticado como administrador.
 */

function isLoggedIn() {
  // ⚠️ Verificación puramente en el cliente — no es confiable
  return localStorage.getItem('isAdmin') === 'true';
}

function logout() {
  localStorage.removeItem('isAdmin');
  window.location.href = '/index.html';
}

// Actualiza la barra de navegación según el estado de "sesión"
function updateNav() {
  const navLogin = document.getElementById('nav-login');
  const navAdmin = document.getElementById('nav-admin');

  if (!navLogin || !navAdmin) return;

  if (isLoggedIn()) {
    navLogin.style.display = 'none';
    navAdmin.style.display = 'flex';
    navAdmin.style.alignItems = 'center';
    navAdmin.style.gap = '1rem';
  } else {
    navLogin.style.display = 'inline';
    navAdmin.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', updateNav);
