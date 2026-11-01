/**
 * login.js — Manejo del formulario de login
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Si ya hay sesión activa en el servidor, redirigir al panel
  try {
    const res = await fetch('/api/session', { credentials: 'include' });
    const data = await res.json();
    if (data.isAdmin) {
      window.location.href = '/admin.html';
      return;
    }
  } catch (err) {
    // Si falla la consulta, continuar y mostrar el formulario
  }

  const form = document.getElementById('form-login');
  const msg = document.getElementById('login-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
    };

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      // ============================================================
      // VULNERABILIDAD #2 — CÓDIGO INSEGURO (comentado):
      //
      // if (res.ok && data.success) {
      //   localStorage.setItem('isAdmin', 'true'); // flag en el cliente
      //   window.location.href = '/admin.html';
      // }
      //
      // El estado de autenticación se guardaba en localStorage,
      // manipulable por cualquier usuario.
      // ============================================================

      // CORRECCIÓN: tras un login exitoso el servidor ya creó la
      // sesión. El cliente simplemente redirige; no guarda nada.
      if (res.ok && data.success) {
        window.location.href = '/admin.html';
      } else {
        msg.className = 'msg error';
        msg.textContent = data.message || 'Credenciales incorrectas.';
        msg.style.display = 'block';
      }
    } catch (err) {
      msg.className = 'msg error';
      msg.textContent = 'Error de conexión con el servidor.';
      msg.style.display = 'block';
    }
  });
});
