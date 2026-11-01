/**
 * admin.js — Panel de administración
 *
 * VULNERABILIDAD #2:
 * El acceso al panel se verifica SOLO en el cliente via localStorage.
 * La operación de borrado envía el header x-admin: true, que el servidor
 * acepta sin ninguna validación real de identidad.
 */

function stars(n) {
  return '⭐'.repeat(n);
}

/**
 * Renderiza las reseñas con botón de eliminar para el admin.
 * El panel también hereda la vulnerabilidad XSS de innerHTML.
 */
function renderAdminReviews(reviews) {
  const container = document.getElementById('admin-reviews-container');

  if (reviews.length === 0) {
    container.innerHTML = '<p class="loading">No hay reseñas para mostrar.</p>';
    return;
  }

  container.innerHTML = `
    <div class="admin-header">
      <span>Película</span>
      <span>Autor</span>
      <span>Reseña</span>
      <span>Rating</span>
      <span>Acción</span>
    </div>
    ${reviews
      .map(
        (r) => `
      <div class="review-card" id="review-${r.id}">
        <div class="review-header">
          <span class="movie-title">${r.movie}</span>
          <span class="review-meta">por ${r.author} &nbsp;${stars(r.rating)}</span>
          <button class="btn-delete" onclick="deleteReview(${r.id})">🗑 Eliminar</button>
        </div>
        <p class="review-text">${r.text}</p>
      </div>
    `
      )
      .join('')}
  `;
}

async function loadAdminReviews() {
  try {
    const res = await fetch('/api/reviews');
    const reviews = await res.json();
    renderAdminReviews(reviews);
  } catch (err) {
    document.getElementById('admin-reviews-container').innerHTML =
      '<p class="loading">Error al cargar las reseñas.</p>';
  }
}

/**
 * Elimina una reseña.
 *
 * ⚠️ El servidor solo verifica el header x-admin: true.
 * Cualquiera puede hacer esta petición con curl o fetch desde la consola.
 */
async function deleteReview(id) {
  if (!confirm('¿Eliminar esta reseña?')) return;

  try {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      headers: {
        'x-admin': 'true', // ⚠️ Header sin firma ni verificación
      },
    });

    if (res.ok) {
      const card = document.getElementById(`review-${id}`);
      if (card) card.remove();
    } else {
      alert('No se pudo eliminar la reseña.');
    }
  } catch (err) {
    alert('Error de conexión.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const adminCheck = document.getElementById('admin-check');
  const adminContent = document.getElementById('admin-content');
  const adminDenied = document.getElementById('admin-denied');

  // ⚠️ VULNERABILIDAD #2: verificación solo en el cliente
  if (isLoggedIn()) {
    adminCheck.style.display = 'none';
    adminContent.style.display = 'block';
    loadAdminReviews();
  } else {
    adminCheck.style.display = 'none';
    adminDenied.style.display = 'block';
  }
});
