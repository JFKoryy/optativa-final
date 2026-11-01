/**
 * auth.js — Manejo de sesión en el cliente
 */

// ============================================================
// VULNERABILIDAD #2 — CÓDIGO INSEGURO (comentado):
//
// function isLoggedIn() {
//   return localStorage.getItem('isAdmin') === 'true';
// }
//
// El estado de autenticación se determinaba leyendo localStorage,
// un valor que cualquier usuario puede escribir desde la consola
// del navegador sin haber pasado por ningún proceso de login.
// ============================================================

// CORRECCIÓN: isLoggedIn ya no existe como función síncrona.
// La verificación se hace consultando /api/session al servidor,
// que comprueba si hay una sesión real activa. Cada archivo que
// necesita verificar el estado lo hace directamente con fetch.

// ============================================================
// VULNERABILIDAD #2 — CÓDIGO INSEGURO (comentado):
//
// function logout() {
//   localStorage.removeItem('isAdmin');
//   window.location.href = '/index.html';
// }
//
// "Cerrar sesión" solo borraba el flag del localStorage.
// No se notificaba al servidor, por lo que la sesión (si
// hubiera existido) nunca se destruía.
// ============================================================

// CORRECCIÓN: logout notifica al servidor para que destruya
// la sesión, luego redirige al inicio.
async function logout() {
  try {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    window.location.href = '/index.html';
  }
}

// Actualiza la barra de navegación consultando el servidor
async function updateNav() {
  const navLogin = document.getElementById('nav-login');
  const navAdmin = document.getElementById('nav-admin');
  if (!navLogin || !navAdmin) return;

  try {
    const res = await fetch('/api/session', { credentials: 'include' });
    const data = await res.json();

    if (data.isAdmin) {
      navLogin.style.display = 'none';
      navAdmin.style.display = 'flex';
      navAdmin.style.alignItems = 'center';
      navAdmin.style.gap = '1rem';
    } else {
      navLogin.style.display = 'inline';
      navAdmin.style.display = 'none';
    }
  } catch (err) {
    navLogin.style.display = 'inline';
    navAdmin.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', updateNav);
