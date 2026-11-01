const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = 3000;

// ============================================================
// VULNERABILIDAD #2 — CÓDIGO INSEGURO (comentado):
//
// const ADMIN_USER = 'admin';
// const ADMIN_PASS = 'admin123';
//
// Las credenciales estaban hardcodeadas directamente en el
// código fuente en texto plano. Cualquiera con acceso al
// archivo podía leerlas.
// ============================================================

// CORRECCIÓN: las credenciales se leen desde variables de entorno
// definidas en el archivo .env, que está excluido del repositorio.
// const ADMIN_USER = process.env.ADMIN_USER;
// const ADMIN_PASS = process.env.ADMIN_PASS;

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

// ============================================================
// CORRECCIÓN — Control de sesión en el servidor con express-session.
// La sesión se almacena en memoria del servidor. El cliente
// solo recibe una cookie con un ID de sesión opaco, sin
// información de autenticación manipulable.
// ============================================================
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,   // La cookie no es accesible desde JavaScript
      secure: false,    // false porque el entorno es HTTP local
      maxAge: 1000 * 60 * 60, // 1 hora de vida
    },
  })
);

app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// CORRECCIÓN — Middleware de autorización real en el servidor.
//
// CÓDIGO INSEGURO (comentado):
// La ruta DELETE verificaba solo un header arbitrario:
//   const isAdmin = req.headers['x-admin'] === 'true';
// Cualquier cliente podía enviarlo sin haberse autenticado.
//
// CORRECCIÓN: se verifica que exista una sesión activa en el
// servidor antes de permitir operaciones privilegiadas.
// ============================================================
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }
  return res.status(403).json({ error: 'Acceso denegado. Sesión no válida.' });
}

// --- API: Obtener todas las reseñas ---
app.get('/api/reviews', (req, res) => {
  res.json(reviews);
});

// --- API: Agregar una reseña ---
// VULNERABILIDAD #1 — CÓDIGO INSEGURO (comentado):
// El texto se guardaba sin ningún tipo de sanitización:
//
// const newReview = {
//   id: nextId++,
//   movie,
//   author,
//   text,
//   rating: parseInt(rating),
// };
//
// CORRECCIÓN: se aplica escape de caracteres HTML sobre todos
// los campos de texto antes de almacenarlos, neutralizando
// cualquier payload XSS en el origen.
app.post('/api/reviews', (req, res) => {
  const { movie, author, text, rating } = req.body;

  if (!movie || !author || !text || !rating) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  const newReview = {
    id: nextId++,
    movie: escapeHTML(movie),
    author: escapeHTML(author),
    text: escapeHTML(text),
    rating: parseInt(rating),
  };

  reviews.push(newReview);
  res.status(201).json(newReview);
});

// --- API: Login ---
// VULNERABILIDAD #2 — CÓDIGO INSEGURO (comentado):
//
// if (username === ADMIN_USER && password === ADMIN_PASS) {
//   return res.json({ success: true, message: 'Login exitoso.' });
//   // No se generaba ninguna sesión. El cliente guardaba
//   // localStorage.isAdmin = 'true' y manejaba el estado solo.
// }
//
// CORRECCIÓN: tras validar credenciales, se crea una sesión
// real en el servidor. El cliente no recibe ningún dato de
// autenticación, solo una cookie de sesión opaca.
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.json({ success: true, message: 'Login exitoso.' });
  }

  res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
});

// --- API: Cerrar sesión ---
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// --- API: Verificar sesión activa (para que el cliente sepa si está autenticado) ---
app.get('/api/session', (req, res) => {
  res.json({ isAdmin: req.session.isAdmin === true });
});

// --- API: Eliminar una reseña (protegida con sesión real) ---
// VULNERABILIDAD #2 — CÓDIGO INSEGURO (comentado):
//
// app.delete('/api/reviews/:id', (req, res) => {
//   const isAdmin = req.headers['x-admin'] === 'true';
//   if (!isAdmin) return res.status(403).json({ error: 'Acceso denegado.' });
//   ...
// });
//
// CORRECCIÓN: el middleware requireAdmin verifica la sesión
// del servidor antes de permitir el acceso a esta ruta.
app.delete('/api/reviews/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = reviews.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Reseña no encontrada.' });
  }

  reviews.splice(index, 1);
  res.json({ success: true });
});

// --- Función de escape HTML ---
// Convierte caracteres especiales en entidades HTML,
// neutralizando cualquier markup o script inyectado.
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
