const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// ============================================================
// VULNERABILIDAD #2: Credenciales hardcodeadas directamente
// en el código fuente. Cualquiera con acceso al repositorio
// o al archivo puede ver usuario y contraseña en texto plano.
// ============================================================
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// Base de datos en memoria (simulada)
let reviews = [
  {
    id: 1,
    movie: 'Inception',
    author: 'Carlos',
    text: 'Una obra maestra del cine moderno.',
    rating: 5,
  },
  {
    id: 2,
    movie: 'The Matrix',
    author: 'María',
    text: 'Filosofía y acción en perfecta armonía.',
    rating: 5,
  },
  {
    id: 3,
    movie: 'Interstellar',
    author: 'Luis',
    text: 'Visualmente impresionante, aunque algo confusa al final.',
    rating: 4,
  },
];

let nextId = 4;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- API: Obtener todas las reseñas ---
app.get('/api/reviews', (req, res) => {
  res.json(reviews);
});

// --- API: Agregar una reseña ---
// VULNERABILIDAD #1 (lado servidor): El texto de la reseña
// se guarda y retorna sin ningún tipo de sanitización.
app.post('/api/reviews', (req, res) => {
  const { movie, author, text, rating } = req.body;

  if (!movie || !author || !text || !rating) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  // ⚠️ No se sanitiza ni escapa ningún campo antes de almacenarlo
  const newReview = {
    id: nextId++,
    movie,
    author,
    text,
    rating: parseInt(rating),
  };

  reviews.push(newReview);
  res.status(201).json(newReview);
});

// --- API: Login ---
// VULNERABILIDAD #2: Credenciales comparadas en texto plano.
// No hay hashing, no hay sesión real, solo devuelve un flag.
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // ⚠️ No se genera un token de sesión seguro.
    // El cliente manejará el "estado" de autenticación por su cuenta.
    return res.json({ success: true, message: 'Login exitoso.' });
  }

  res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
});

// --- API: Eliminar una reseña (ruta "protegida") ---
// VULNERABILIDAD #2: La "protección" es solo un header que
// el cliente envía. No hay validación real en el servidor.
app.delete('/api/reviews/:id', (req, res) => {
  // ⚠️ Solo verifica un header arbitrario, no una sesión real.
  const isAdmin = req.headers['x-admin'] === 'true';

  if (!isAdmin) {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }

  const id = parseInt(req.params.id);
  const index = reviews.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Reseña no encontrada.' });
  }

  reviews.splice(index, 1);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Credenciales de admin: admin / admin123');
});
