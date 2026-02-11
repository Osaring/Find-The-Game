const socket = io();

const pseudoInput = document.getElementById('pseudoInput');
const guessInput = document.getElementById('guessInput');
const joinBtn = document.getElementById('joinBtn');
const guessBtn = document.getElementById('guessBtn');
const statusText = document.getElementById('status');
const playersList = document.getElementById('playersList');
const guessFeed = document.getElementById('guessFeed');
const gameImage = document.getElementById('gameImage');

let joined = false;

function setGuessEnabled(value) {
  guessInput.disabled = !value;
  guessBtn.disabled = !value;
}

function setStatus(message) {
  statusText.textContent = message;
}

function setImage(url, blur) {
  gameImage.src = url;
  gameImage.style.filter = `blur(${blur}px)`;
}

function appendFeed(text) {
  const li = document.createElement('li');
  li.textContent = text;
  guessFeed.prepend(li);

  while (guessFeed.children.length > 12) {
    guessFeed.removeChild(guessFeed.lastChild);
  }
}

joinBtn.addEventListener('click', () => {
  const pseudo = pseudoInput.value.trim();
  if (!pseudo) return;

  socket.emit('player:join', { pseudo });
  joined = true;
  pseudoInput.disabled = true;
  joinBtn.disabled = true;
  setGuessEnabled(true);
  guessInput.focus();
});

guessBtn.addEventListener('click', () => {
  const guess = guessInput.value.trim();
  if (!guess || !joined) return;

  socket.emit('guess:submit', { guess });
  guessInput.value = '';
  guessInput.focus();
});

guessInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    guessBtn.click();
  }
});

pseudoInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    joinBtn.click();
  }
});

socket.on('players:update', (players) => {
  playersList.innerHTML = '';

  if (!players.length) {
    const li = document.createElement('li');
    li.textContent = 'Aucun joueur connecté.';
    playersList.appendChild(li);
    return;
  }

  players
    .sort((a, b) => b.score - a.score)
    .forEach((player) => {
      const li = document.createElement('li');
      li.textContent = `${player.pseudo} — ${player.score} pt${player.score > 1 ? 's' : ''}`;
      playersList.appendChild(li);
    });
});

socket.on('round:waiting', ({ reason }) => {
  setStatus(reason);
  setGuessEnabled(false);
});

socket.on('round:start', ({ imageUrl, blur }) => {
  setStatus('Nouvelle manche ! Devine le nom du jeu.');
  setImage(imageUrl, blur);
  if (joined) setGuessEnabled(true);
});

socket.on('round:blur', ({ blur }) => {
  gameImage.style.filter = `blur(${blur}px)`;
});

socket.on('round:winner', ({ pseudo, answer, imageUrl }) => {
  setImage(imageUrl, 0);
  setStatus(`🏆 ${pseudo} a trouvé : ${answer}`);
  appendFeed(`✅ ${pseudo} gagne la manche (${answer})`);
});

socket.on('round:timeout', ({ answer, imageUrl }) => {
  setImage(imageUrl, 0);
  setStatus(`Temps écoulé ! Réponse : ${answer}`);
  appendFeed(`⌛ Personne n'a trouvé (${answer})`);
});

socket.on('guess:feed', ({ pseudo, guess }) => {
  appendFeed(`${pseudo} → ${guess}`);
});
