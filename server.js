const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    message: 'Serveur Node.js Find-The-Game initialisé ✅'
  }));
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
