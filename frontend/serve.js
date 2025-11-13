const express = require('express');
const path = require('path');

const app = express();

// Обслуживание статических файлов из папки dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: все маршруты ведут к index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 4173;
app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});