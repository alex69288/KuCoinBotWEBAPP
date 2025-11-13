const express = require('express');
const path = require('path');

const app = express();

// Обслуживание статических файлов из папки dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: все маршруты ведут к index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/assets/') || req.path.startsWith('/vite.svg')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 4173;
app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});