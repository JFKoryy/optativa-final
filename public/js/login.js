/**
 * login.js — Manejo del formulario de login
 *
 * VULNERABILIDAD #2:
 * Al recibir una respuesta exitosa del servidor, solo se guarda
 * un flag en localStorage. No hay tokens JWT, no hay cookies
 * de sesión HttpOnly, no hay verificación criptográfica.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Si ya está "autenticado", redirigir directo al admin
  if (isLoggedIn()) {
    window.location.href = '/admin.html';
    return;
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
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // ⚠️ "Autenticación" guardada solo en el cliente
        localStorage.setItem('isAdmin', 'true');
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
