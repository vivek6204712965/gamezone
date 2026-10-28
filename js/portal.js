const GAMES = [
  {
    id: 'snake',
    title: 'Snake Neon',
    category: 'arcade',
    categoryLabel: 'Arcade',
    icon: '🐍',
    bg: 'linear-gradient(135deg, #064e3b, #022c22)',
    badge: 'Popular',
    rating: '4.9',
    plays: '42K+',
    desc: 'Classic neon snake! Eat glowing orbs, grow your tail, and beat your highest score.',
    path: 'games/snake/index.html'
  },
  {
    id: 'tetris',
    title: 'Tetris Block Master',
    category: 'puzzle',
    categoryLabel: 'Puzzle',
    icon: '🧱',
    bg: 'linear-gradient(135deg, #4c1d95, #2e1065)',
    badge: 'Classic',
    rating: '5.0',
    plays: '58K+',
    desc: 'The legendary block-stacking puzzle with SRS rotation, ghost piece, and hold piece.',
    path: 'games/tetris/index.html'
  },
  {
    id: '2048',
    title: '2048 Deluxe',
    category: 'puzzle',
    categoryLabel: 'Puzzle',
    icon: '🔢',
    bg: 'linear-gradient(135deg, #78350f, #451a03)',
    badge: 'Brain Game',
    rating: '4.8',
    plays: '39K+',
    desc: 'Slide and merge identical numbered tiles until you reach the glorious 2048 tile!',
    path: 'games/2048/index.html'
  },
  {
    id: 'flappy',
    title: 'Flappy Cyber',
    category: 'action',
    categoryLabel: 'Action',
    icon: '🐦',
    bg: 'linear-gradient(135deg, #075985, #0c4a6e)',
    badge: 'Addictive',
    rating: '4.7',
    plays: '64K+',
    desc: 'Flap through tricky cyber pipe gaps without crashing in this rhythm reflex game.',
    path: 'games/flappy/index.html'
  },
  {
    id: 'breakout',
    title: 'Breakout Neon',
    category: 'arcade',
    categoryLabel: 'Arcade',
    icon: '🏓',
    bg: 'linear-gradient(135deg, #881337, #4c0519)',
    badge: 'Retro',
    rating: '4.8',
    plays: '31K+',
    desc: 'Smash colorful brick formations with power-ups like multi-ball, lasers, and extra lives.',
    path: 'games/breakout/index.html'
  },
  {
    id: 'dino',
    title: 'Dino Runner',
    category: 'action',
    categoryLabel: 'Action',
    icon: '🦖',
    bg: 'linear-gradient(135deg, #064e3b, #1e293b)',
    badge: 'Endless',
    rating: '4.9',
    plays: '75K+',
    desc: 'Sprint through the endless desert, jumping over cacti and ducking under pterodactyls.',
    path: 'games/dino/index.html'
  },
  {
    id: 'space-invaders',
    title: 'Galaxy Defender',
    category: 'action',
    categoryLabel: 'Action',
    icon: '👾',
    bg: 'linear-gradient(135deg, #581c87, #1e1b4b)',
    badge: 'Sci-Fi',
    rating: '4.9',
    plays: '46K+',
    desc: 'Defend planet Earth from descending waves of alien invaders and laser strikes.',
    path: 'games/space-invaders/index.html'
  },
  {
    id: 'pong',
    title: 'Pong Retro Arena',
    category: 'retro',
    categoryLabel: 'Retro',
    icon: '🏓',
    bg: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
    badge: '2-Player',
    rating: '4.6',
    plays: '28K+',
    desc: 'The original table tennis arcade battle. Play solo against the smart AI or with a friend!',
    path: 'games/pong/index.html'
  },
  {
    id: 'memory',
    title: 'Memory Match',
    category: 'puzzle',
    categoryLabel: 'Puzzle',
    icon: '🃏',
    bg: 'linear-gradient(135deg, #831843, #500724)',
    badge: 'Casual',
    rating: '4.7',
    plays: '25K+',
    desc: 'Test your brain memory by flipping cards and discovering matching emoji pairs.',
    path: 'games/memory/index.html'
  },
  {
    id: 'tictactoe',
    title: 'XO Master',
    category: 'retro',
    categoryLabel: 'Retro',
    icon: '⭕',
    bg: 'linear-gradient(135deg, #0369a1, #1e1b4b)',
    badge: '1v1 AI',
    rating: '4.8',
    plays: '52K+',
    desc: 'Tic-Tac-Toe reimagined with neon glow, Minimax unbeatable AI, and local 2-Player.',
    path: 'games/tictactoe/index.html'
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper Classic',
    category: 'puzzle',
    categoryLabel: 'Puzzle',
    icon: '💣',
    bg: 'linear-gradient(135deg, #14532d, #052e16)',
    badge: 'Strategy',
    rating: '4.9',
    plays: '37K+',
    desc: 'Uncover safe tiles without detonating hidden mines using logic numbers and flags.',
    path: 'games/minesweeper/index.html'
  },
  {
    id: 'connect4',
    title: 'Connect Four',
    category: 'retro',
    categoryLabel: 'Retro',
    icon: '🔴',
    bg: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
    badge: 'Strategy',
    rating: '4.8',
    plays: '34K+',
    desc: 'Drop tokens into the grid to form a line of 4 consecutive discs before your opponent!',
    path: 'games/connect4/index.html'
  }
];

// State
let currentCategory = 'all';
let searchQuery = '';
let favorites = JSON.parse(localStorage.getItem('gamezone_favorites') || '[]');

// DOM Elements
const gamesGrid = document.getElementById('gamesGrid');
const gameCountEl = document.getElementById('gameCount');
const searchInput = document.getElementById('searchInput');
const catTabs = document.querySelectorAll('.cat-tab');
const surpriseBtn = document.getElementById('surpriseBtn');
const heroPlayBtn = document.getElementById('heroPlayBtn');

// Modal Elements
const playerModal = document.getElementById('playerModal');
const gameIframe = document.getElementById('gameIframe');
const playerTitle = document.getElementById('playerTitle');
const playerTag = document.getElementById('playerTag');
const closeModalBtn = document.getElementById('closeModalBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const reloadGameBtn = document.getElementById('reloadGameBtn');
const openTabBtn = document.getElementById('openTabBtn');

function renderGames() {
  const filtered = GAMES.filter(g => {
    const matchesCat = currentCategory === 'all' || 
                       (currentCategory === 'favorites' ? favorites.includes(g.id) : g.category === currentCategory);
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  gameCountEl.textContent = `Showing ${filtered.length} games`;
  gamesGrid.innerHTML = '';

  if (filtered.length === 0) {
    gamesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #94a3b8;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🎮</div>
        <h3>No games found</h3>
        <p style="font-size: 0.9rem; margin-top: 6px;">Try searching for another keyword or change category!</p>
      </div>
    `;
    return;
  }

  filtered.forEach(game => {
    const isFav = favorites.includes(game.id);
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="card-thumbnail" style="background: ${game.bg};">
        <span class="thumbnail-icon">${game.icon}</span>
        <span class="badge-tag">${game.badge}</span>
        <button class="fav-btn ${isFav ? 'active' : ''}" title="Favorite" data-id="${game.id}">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-body">
        <div class="card-title-row">
          <div class="card-title">${game.title}</div>
          <div class="card-rating">★ ${game.rating}</div>
        </div>
        <div class="card-desc">${game.desc}</div>
        <div class="card-footer">
          <span class="card-category">● ${game.categoryLabel}</span>
          <button class="card-play-btn">Play Now ▶</button>
        </div>
      </div>
    `;

    // Click to play
    card.addEventListener('click', (e) => {
      if (e.target.closest('.fav-btn')) return; // Fav button handled separately
      openGame(game);
    });

    // Favorite click
    const favBtn = card.querySelector('.fav-btn');
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(game.id);
    });

    gamesGrid.appendChild(card);
  });
}

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem('gamezone_favorites', JSON.stringify(favorites));
  renderGames();
}

function openGame(game) {
  playerTitle.textContent = game.title;
  playerTag.textContent = game.categoryLabel;
  gameIframe.src = game.path;
  playerModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeGame() {
  playerModal.classList.remove('active');
  gameIframe.src = '';
  document.body.style.overflow = '';
}

// Events
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderGames();
});

catTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    catTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentCategory = tab.dataset.category;
    renderGames();
  });
});

surpriseBtn.addEventListener('click', () => {
  const randomGame = GAMES[Math.floor(Math.random() * GAMES.length)];
  openGame(randomGame);
});

heroPlayBtn.addEventListener('click', () => {
  openGame(GAMES[0]); // Snake or Featured
});

closeModalBtn.addEventListener('click', closeGame);

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    if (gameIframe.requestFullscreen) {
      gameIframe.requestFullscreen();
    } else if (gameIframe.webkitRequestFullscreen) {
      gameIframe.webkitRequestFullscreen();
    }
  } else {
    document.exitFullscreen();
  }
});

reloadGameBtn.addEventListener('click', () => {
  const currentSrc = gameIframe.src;
  gameIframe.src = '';
  setTimeout(() => { gameIframe.src = currentSrc; }, 50);
});

openTabBtn.addEventListener('click', () => {
  if (gameIframe.src) {
    window.open(gameIframe.src, '_blank');
  }
});

// Close modal on Escape
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && playerModal.classList.contains('active')) {
    closeGame();
  }
});

// Click outside modal wrapper to close
playerModal.addEventListener('click', (e) => {
  if (e.target === playerModal) {
    closeGame();
  }
});

// Initial Render
renderGames();
