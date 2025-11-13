const express = require('express');
const path = require('path');

try {
  const app = express();

  // Обслуживание статических файлов из папки dist
  app.use(express.static(path.join(__dirname, 'dist')));

  // SPA fallback: все маршруты ведут к index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Internal Server Error');
      }
    });
  });

  const PORT = process.env.PORT || 4173;
  const server = app.listen(PORT, () => {
    console.log(`Frontend server running on port ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
} catch (error) {
  console.error('Error starting server:', error);
  process.exit(1);
}