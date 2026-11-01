/**
 * main.js — Página principal: carga y publicación de reseñas
 *
 * VULNERABILIDAD #1 — XSS (Cross-Site Scripting):
 * La función renderReviews() inserta el contenido de las reseñas
 * usando innerHTML. Si una reseña contiene HTML o JavaScript,
 * el navegador lo interpreta y ejecuta.
 *
 * Ejemplo de payload: <img src=x onerror="alert('XSS!')">
 */

// Genera estrellas en texto
function stars(n) {
  return '⭐'.repeat(n);
}

/**
 * Renderiza la lista de reseñas en el DOM.
 *
 * ⚠️ VULNERABILIDAD XSS: los campos movie, author y text se insertan
 * con innerHTML sin escapar. Un atacante puede inyectar código HTML/JS.
 */
function renderReviews(reviews) {
  const container = document.getElementById('reviews-container');
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = '<p class="loading">No hay reseñas aún. ¡Sé el primero!</p>';
    return;
  }

  // ⚠️ innerHTML interpreta HTML — no usar con datos no confiables
  container.innerHTML = reviews
    .map(
      (r) => `
      <div class="review-card">
        <div class="review-header">
          <span class="movie-title">${r.movie}</span>
          <span class="review-meta">por ${r.author}</span>
        </div>
        <p class="review-text">${r.text}</p>
        <span class="review-rating">${stars(r.rating)}</span>
      </div>
    `
    )
    .join('');
}

// Carga las reseñas desde la API
async function loadReviews() {
  try {
    const res = await fetch('/api/reviews');
    const reviews = await res.json();
    renderReviews(reviews);
  } catch (err) {
    document.getElementById('reviews-container').innerHTML =
      '<p class="loading">Error al cargar las reseñas.</p>';
  }
}

// Manejo del formulario de nueva reseña
document.addEventListener('DOMContentLoaded', () => {
  loadReviews();

  const form = document.getElementById('form-review');
  const msg = document.getElementById('form-msg');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
      movie: document.getElementById('movie').value,
      author: document.getElementById('author').value,
      text: document.getElementById('text').value,
      rating: document.getElementById('rating').value,
    };

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        msg.className = 'msg success';
        msg.textContent = '¡Reseña publicada exitosamente!';
        msg.style.display = 'block';
        form.reset();
        loadReviews(); // Recarga para mostrar la nueva reseña (y ejecutar cualquier payload XSS)
        setTimeout(() => (msg.style.display = 'none'), 3000);
      } else {
        const data = await res.json();
        msg.className = 'msg error';
        msg.textContent = data.error || 'Error al publicar la reseña.';
        msg.style.display = 'block';
      }
    } catch (err) {
      msg.className = 'msg error';
      msg.textContent = 'Error de conexión.';
      msg.style.display = 'block';
    }
  });
});
