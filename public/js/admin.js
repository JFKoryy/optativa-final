/**
 * admin.js — Panel de administración
 */

function stars(n) {
  return '⭐'.repeat(n);
}

// ============================================================
// VULNERABILIDAD #1 — CÓDIGO INSEGURO (comentado):
//
// function renderAdminReviews(reviews) {
//   const container = document.getElementById('admin-reviews-container');
//   if (reviews.length === 0) {
//     container.innerHTML = '<p class="loading">No hay reseñas para mostrar.</p>';
//     return;
//   }
//   container.innerHTML = `
//     <div class="admin-header">...</div>
//     ${reviews.map((r) => `
//       <div class="review-card" id="review-${r.id}">
//         <div class="review-header">
//           <span class="movie-title">${r.movie}</span>
//           <span class="review-meta">por ${r.author} &nbsp;${stars(r.rating)}</span>
//           <button class="btn-delete" onclick="deleteReview(${r.id})">🗑 Eliminar</button>
//         </div>
//         <p class="review-text">${r.text}</p>
//       </div>
//     `).join('')}
//   `;
// }
//
// Los campos r.movie, r.author y r.text se interpolaban en un
// template literal asignado a innerHTML, permitiendo que
// cualquier payload XSS almacenado se ejecutara también en
// el panel de administración.
// ============================================================

// CORRECCIÓN: se construye el DOM con createElement y textContent,
// igual que en main.js, para garantizar que ningún valor de
// las reseñas sea interpretado como HTML o JavaScript.
function renderAdminReviews(reviews) {
  const container = document.getElementById('admin-reviews-container');
  container.innerHTML = '';

  if (reviews.length === 0) {
    const p = document.createElement('p');
    p.className = 'loading';
    p.textContent = 'No hay reseñas para mostrar.';
    container.appendChild(p);
    return;
  }

  reviews.forEach((r) => {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.id = `review-${r.id}`;

    const header = document.createElement('div');
    header.className = 'review-header';

    const title = document.createElement('span');
    title.className = 'movie-title';
    title.textContent = r.movie;

    const meta = document.createElement('span');
    meta.className = 'review-meta';
    meta.textContent = `por ${r.author}  ${stars(r.rating)}`;

    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn-delete';
    btnDelete.textContent = '🗑 Eliminar';
    btnDelete.addEventListener('click', () => deleteReview(r.id));

    const text = document.createElement('p');
    text.className = 'review-text';
    text.textContent = r.text;

    header.appendChild(title);
    header.appendChild(meta);
    header.appendChild(btnDelete);
    card.appendChild(header);
    card.appendChild(text);
    container.appendChild(card);
  });
}

async function loadAdminReviews() {
  try {
    const res = await fetch('/api/reviews');
    const reviews = await res.json();
    renderAdminReviews(reviews);
  } catch (err) {
    const container = document.getElementById('admin-reviews-container');
    if (container) container.textContent = 'Error al cargar las reseñas.';
  }
}

// ============================================================
// VULNERABILIDAD #2 — CÓDIGO INSEGURO (comentado):
//
// async function deleteReview(id) {
//   if (!confirm('¿Eliminar esta reseña?')) return;
//   const res = await fetch(`/api/reviews/${id}`, {
//     method: 'DELETE',
//     headers: { 'x-admin': 'true' }, // header sin firma ni verificación
//   });
//   ...
// }
//
// El servidor aceptaba cualquier petición DELETE que incluyera
// el header x-admin: true, sin verificar ninguna sesión.
// ============================================================

// CORRECCIÓN: se elimina el header x-admin. La autorización
// la determina el servidor verificando la cookie de sesión,
// que el navegador envía automáticamente con credentials: 'include'.
async function deleteReview(id) {
  if (!confirm('¿Eliminar esta reseña?')) return;

  try {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (res.ok) {
      const card = document.getElementById(`review-${id}`);
      if (card) card.remove();
    } else if (res.status === 403) {
      alert('Sesión expirada. Por favor vuelve a iniciar sesión.');
      window.location.href = '/login.html';
    } else {
      alert('No se pudo eliminar la reseña.');
    }
  } catch (err) {
    alert('Error de conexión.');
  }
}

// ============================================================
// VULNERABILIDAD #2 — CÓDIGO INSEGURO (comentado):
//
// document.addEventListener('DOMContentLoaded', () => {
//   if (isLoggedIn()) {          // verificación solo en localStorage
//     adminContent.style.display = 'block';
//     loadAdminReviews();
//   } else {
//     adminDenied.style.display = 'block';
//   }
// });
//
// El acceso al panel dependía únicamente de un valor en
// localStorage que cualquier usuario podía manipular.
// ============================================================

// CORRECCIÓN: se consulta al servidor si existe una sesión activa
// antes de mostrar el contenido del panel.
document.addEventListener('DOMContentLoaded', async () => {
  const adminCheck = document.getElementById('admin-check');
  const adminContent = document.getElementById('admin-content');
  const adminDenied = document.getElementById('admin-denied');

  try {
    const res = await fetch('/api/session', { credentials: 'include' });
    const data = await res.json();

    adminCheck.style.display = 'none';

    if (data.isAdmin) {
      adminContent.style.display = 'block';
      loadAdminReviews();
    } else {
      adminDenied.style.display = 'block';
    }
  } catch (err) {
    adminCheck.style.display = 'none';
    adminDenied.style.display = 'block';
  }
});
