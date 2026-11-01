/**
 * main.js — Página principal: carga y publicación de reseñas
 */

function stars(n) {
  return '⭐'.repeat(n);
}

// ============================================================
// VULNERABILIDAD #1 — CÓDIGO INSEGURO:
//
// function renderReviews(reviews) {
//   const container = document.getElementById('reviews-container');
//   if (!container) return;
//   if (reviews.length === 0) {
//     container.innerHTML = '<p class="loading">No hay reseñas aún. ¡Sé el primero!</p>';
//     return;
//   }
//   container.innerHTML = reviews
//     .map(
//       (r) => `
//       <div class="review-card">
//         <div class="review-header">
//           <span class="movie-title">${r.movie}</span>
//           <span class="review-meta">por ${r.author}</span>
//         </div>
//         <p class="review-text">${r.text}</p>
//         <span class="review-rating">${stars(r.rating)}</span>
//       </div>
//     `
//     )
//     .join('');
// }
//
// innerHTML interpreta HTML, por lo que cualquier payload
// inyectado en los campos de la reseña era ejecutado por el
// navegador al renderizar la lista.
// ============================================================

// CORRECCIÓN: se construye el DOM con createElement y textContent.
// textContent trata el valor siempre como texto plano, nunca
// como markup, eliminando la posibilidad de ejecución de código.
function renderReviews(reviews) {
  const container = document.getElementById('reviews-container');
  if (!container) return;

  container.innerHTML = '';

  if (reviews.length === 0) {
    const p = document.createElement('p');
    p.className = 'loading';
    p.textContent = 'No hay reseñas aún. ¡Sé el primero!';
    container.appendChild(p);
    return;
  }

  reviews.forEach((r) => {
    const card = document.createElement('div');
    card.className = 'review-card';

    const header = document.createElement('div');
    header.className = 'review-header';

    const title = document.createElement('span');
    title.className = 'movie-title';
    title.textContent = r.movie;

    const meta = document.createElement('span');
    meta.className = 'review-meta';
    meta.textContent = `por ${r.author}`;

    const text = document.createElement('p');
    text.className = 'review-text';
    text.textContent = r.text;

    const rating = document.createElement('span');
    rating.className = 'review-rating';
    rating.textContent = stars(r.rating);

    header.appendChild(title);
    header.appendChild(meta);
    card.appendChild(header);
    card.appendChild(text);
    card.appendChild(rating);
    container.appendChild(card);
  });
}

async function loadReviews() {
  try {
    const res = await fetch('/api/reviews');
    const reviews = await res.json();
    renderReviews(reviews);
  } catch (err) {
    const container = document.getElementById('reviews-container');
    if (container) container.textContent = 'Error al cargar las reseñas.';
  }
}

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
        loadReviews();
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
