const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const ROUND_TICK_MS = 1200;
const BLUR_STEPS = [32, 24, 18, 14, 10, 7, 4, 2, 0];

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const imagesDir = path.join(__dirname, 'images');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(imagesDir));

function normalizeGuess(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function expectedAnswer(filename) {
  const base = path.parse(filename).name;
  return normalizeGuess(base.replace(/[-_]+/g, ' '));
}

function listImages() {
  if (!fs.existsSync(imagesDir)) return [];

  const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
  return fs
    .readdirSync(imagesDir)
    .filter((file) => allowedExt.has(path.extname(file).toLowerCase()));
}

const gameState = {
  players: new Map(),
  images: listImages(),
  round: null,
  timer: null,
};

function publicPlayers() {
  return Array.from(gameState.players.values()).map((player) => ({
    id: player.id,
    pseudo: player.pseudo,
    score: player.score,
  }));
}

function emitState() {
  io.emit('players:update', publicPlayers());
}

function stopRoundTimer() {
  if (gameState.timer) {
    clearInterval(gameState.timer);
    gameState.timer = null;
  }
}

function pickImage() {
  if (gameState.images.length === 0) return null;

  const lastImage = gameState.round?.image;
  let options = gameState.images;
  if (gameState.images.length > 1 && lastImage) {
    options = gameState.images.filter((img) => img !== lastImage);
  }

  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}

function startRound() {
  const image = pickImage();

  if (!image) {
    gameState.round = null;
    io.emit('round:waiting', {
      reason: "Ajoute des images dans le dossier /images pour démarrer la partie.",
    });
    return;
  }

  const answer = expectedAnswer(image);
  gameState.round = {
    image,
    answer,
    blurIndex: 0,
    winner: null,
  };

  io.emit('round:start', {
    imageUrl: `/images/${encodeURIComponent(image)}`,
    blur: BLUR_STEPS[0],
  });

  stopRoundTimer();
  gameState.timer = setInterval(() => {
    if (!gameState.round) return;

    const current = gameState.round;
    if (current.winner) {
      stopRoundTimer();
      return;
    }

    if (current.blurIndex < BLUR_STEPS.length - 1) {
      current.blurIndex += 1;
      io.emit('round:blur', { blur: BLUR_STEPS[current.blurIndex] });
      return;
    }

    io.emit('round:timeout', {
      answer: current.answer,
      imageUrl: `/images/${encodeURIComponent(current.image)}`,
    });

    stopRoundTimer();
    setTimeout(startRound, 3500);
  }, ROUND_TICK_MS);
}

io.on('connection', (socket) => {
  socket.emit('players:update', publicPlayers());

  if (gameState.round) {
    socket.emit('round:start', {
      imageUrl: `/images/${encodeURIComponent(gameState.round.image)}`,
      blur: BLUR_STEPS[gameState.round.blurIndex],
    });
  } else if (gameState.images.length === 0) {
    socket.emit('round:waiting', {
      reason: "Ajoute des images dans le dossier /images pour démarrer la partie.",
    });
  }

  socket.on('player:join', ({ pseudo }) => {
    const safePseudo = String(pseudo || '').trim().slice(0, 24);
    if (!safePseudo) return;

    gameState.players.set(socket.id, {
      id: socket.id,
      pseudo: safePseudo,
      score: gameState.players.get(socket.id)?.score ?? 0,
    });

    emitState();

    if (!gameState.round) {
      gameState.images = listImages();
      startRound();
    }
  });

  socket.on('guess:submit', ({ guess }) => {
    if (!gameState.round || gameState.round.winner) return;

    const player = gameState.players.get(socket.id);
    if (!player) return;

    const normalized = normalizeGuess(String(guess || ''));
    if (!normalized) return;

    io.emit('guess:feed', {
      pseudo: player.pseudo,
      guess: String(guess || '').trim().slice(0, 64),
    });

    if (normalized === gameState.round.answer) {
      gameState.round.winner = player.id;
      player.score += 1;
      emitState();

      io.emit('round:winner', {
        pseudo: player.pseudo,
        answer: gameState.round.answer,
        imageUrl: `/images/${encodeURIComponent(gameState.round.image)}`,
      });

      stopRoundTimer();
      setTimeout(startRound, 3200);
    }
  });

  socket.on('disconnect', () => {
    gameState.players.delete(socket.id);
    emitState();
  });
});

server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
