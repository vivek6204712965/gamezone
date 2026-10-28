/**
 * GameZone - Portal Application
 * Integrates built-in playable games with Supabase public.games database service.
 */

const BUILTIN_GAMES = [
  {
    id: 'snake',
    slug: 'snake',
    title: 'Snake Neon',
    category: 'arcade',
    categoryLabel: 'Arcade',
    icon: '🐍',
    bg: 'linear-gradient(135deg, #064e3b, #022c22)',
    badge: 'Popular',
    desc: 'Classic neon snake! Eat glowing orbs, grow your tail, and beat your highest score.',
    path: 'games/snake/index.html'
  },
  {
    id: 'tetris',
    slug: 'tetris',
    title: 'Tetris Block Master',
    category: 'puzzle',
    categoryLabel: 'Puzzle',
    icon: '🧱',
    bg: 'linear-gradient(135deg, #4c1d95, #2e1065)',
    badge: 'Classic',
    desc: 'The legendary block-stacking puzzle with SRS rotation, ghost piece, and hold piece.',
    path: 'games/tetris/index.html'
  },
  {
    id: '2048',
    slug: '2048',
    title: '2048 Deluxe',
    category: 'puzzle',
    categoryLabel: 'Puzzle',
    icon: '🔢',
    bg: 'linear-gradient(135deg, #78350f, #451a03)',
    badge: 'Brain Game',
    desc: 'Slide and merge identical numbered tiles until you reach the glorious 2048 tile!',
    path: 'games/2048/index.html'
  },
  {
    id: 'flappy',
    slug: 'flappy',
    title: 'Flappy Cyber',
    category: 'action',
    categoryLabel: 'Action',
    icon: '🐦',
    bg: 'linear-gradient(135deg, #075985, #0c4a6e)',
    badge: 'Addictive',
    desc: 'Flap through tricky cyber pipe gaps without crashing in this rhythm reflex game.',
    path: 'games/flappy/index.html'
  },
  {
    id: 'breakout',
    slug: 'breakout',
    title: 'Breakout Neon',
    category: 'arcade',
    categoryLabel: 'Arcade',
    icon: '🏓',
    bg: 'linear-gradient(135deg, #881337, #4c0519)',
    badge: 'Retro',
    desc: 'Smash colorful brick formations with power-ups like multi-ball, lasers, and extra lives.',
    path: 'games/breakout/index.html'
  },
  {
    id: 'dino',
    slug: 'dino',
    title: 'Dino Runner',
    category: 'action',
    categoryLabel: 'Action',
    icon: '🦖',
    bg: 'linear-gradient(135deg, #064e3b, #1e293b)',
    badge: 'Endless',
    desc: 'Sprint through the endless desert, jumping over cacti and ducking under pterodactyls.',
    path: 'games/dino/index.html'
  },
  {
    id: 'space-invaders',
    slug: 'space-invaders',
    title: 'Galaxy Defender',
    category: 'action',
    categoryLabel: 'Action',
    icon: '👾',
    bg: 'linear-gradient(135deg, #581c87, #1e1b4b)',
    badge: 'Sci-Fi',
    desc: 'Defend planet Earth from descending waves of alien invaders and laser strikes.',
    path: 'games/space-invaders/index.html'
  },
  {
    id: 'pong',
    slug: 'pong',
    title: 'Pong Retro Arena',
    category: 'retro',
    categoryLabel: 'Retro',
    icon: '🏓',
    bg: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
    badge: '2-Player',
    desc: 'The original table tennis arcade battle. Play solo against the smart AI or with a friend!',
    path: 'games/pong/index.html'
  },
  {
    id: 'memory',
    slug: 'memory',
    title: 'Memory Match',
    category: 'puzzle',
    categoryLabel: 'Puzzle',
    icon: '🃏',
    bg: 'linear-gradient(135deg, #831843, #500724)',
    badge: 'Casual',
    desc: 'Test your brain memory by flipping cards and discovering matching emoji pairs.',
    path: 'games/memory/index.html'
  },
  {
    id: 'tictactoe',
    slug: 'tictactoe',
    title: 'XO Master',
    category: 'retro',
    categoryLabel: 'Retro',
    icon: '⭕',
    bg: 'linear-gradient(135deg, #0369a1, #1e1b4b)',
    badge: '1v1 AI',
    desc: 'Tic-Tac-Toe reimagined with neon glow, Minimax unbeatable AI, and local 2-Player.',
    path: 'games/tictactoe/index.html'
  },
  {
    id: 'minesweeper',
    slug: 'minesweeper',
    title: 'Minesweeper Classic',
    category: 'puzzle',
    categoryLabel: 'Puzzle',
    icon: '💣',
    bg: 'linear-gradient(135deg, #14532d, #052e16)',
    badge: 'Strategy',
    desc: 'Uncover safe tiles without detonating hidden mines using logic numbers and flags.',
    path: 'games/minesweeper/index.html'
  },
  {
    id: 'connect4',
    slug: 'connect4',
    title: 'Connect Four',
    category: 'retro',
    categoryLabel: 'Retro',
    icon: '🔴',
    bg: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
    badge: 'Strategy',
    desc: 'Drop tokens into the grid to form a line of 4 consecutive discs before your opponent!',
    path: 'games/connect4/index.html'
  }
];

// Active game catalog (initialized with built-in games for immediate offline rendering)
let activeGames = [...BUILTIN_GAMES];

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
const dbStatusBadge = document.getElementById('dbStatusBadge');
const dbStatusText = document.getElementById('dbStatusText');

// Modal Elements
const playerModal = document.getElementById('playerModal');
const gameIframe = document.getElementById('gameIframe');
const playerTitle = document.getElementById('playerTitle');
const playerTag = document.getElementById('playerTag');
const closeModalBtn = document.getElementById('closeModalBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const reloadGameBtn = document.getElementById('reloadGameBtn');
const openTabBtn = document.getElementById('openTabBtn');

/**
 * Format category label with initial capital letter
 */
function formatCategory(category) {
  if (!category) return 'Arcade';
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

/**
 * Fallback icon by category for dynamic database records
 */
function getCategoryIcon(category) {
  const c = (category || '').toLowerCase();
  switch (c) {
    case 'puzzle': return '🧩';
    case 'action': return '🚀';
    case 'retro': return '👾';
    case 'strategy': return '♟️';
    case 'sports': return '⚽';
    default: return '🕹️';
  }
}

/**
 * Fallback background gradient by category
 */
function getCategoryGradient(category) {
  const c = (category || '').toLowerCase();
  switch (c) {
    case 'puzzle': return 'linear-gradient(135deg, #4c1d95, #1e1b4b)';
    case 'action': return 'linear-gradient(135deg, #075985, #082f49)';
    case 'retro': return 'linear-gradient(135deg, #1e3a8a, #0f172a)';
    default: return 'linear-gradient(135deg, #1e293b, #0f172a)';
  }
}

/**
 * Update the database status indicator in the UI
 */
function updateDbStatus(status, text, tooltip = '') {
  if (!dbStatusBadge || !dbStatusText) return;

  dbStatusBadge.className = 'db-status-badge ' + status;
  dbStatusText.textContent = text;
  if (tooltip) {
    dbStatusBadge.title = tooltip;
  }
}

/**
 * Fetch records from Supabase and synchronize the game catalog
 */
async function syncDatabase() {
  if (!window.GameZoneDB) {
    updateDbStatus('notice', 'Local Mode', 'Database service not loaded');
    return;
  }

  if (!window.GameZoneDB.isConfigured()) {
    updateDbStatus(
      'notice',
      'Local Mode (Supabase not configured)',
      'Add Project URL and publishable key to js/supabase-config.js to sync with public.games'
    );
    return;
  }

  updateDbStatus('loading', 'Connecting to Supabase...');

  try {
    const result = await window.GameZoneDB.fetchGames();

    if (result.status === 'unconfigured') {
      updateDbStatus(
        'notice',
        'Local Mode (Supabase not configured)',
        'Configure js/supabase-config.js to connect'
      );
    } else if (result.status === 'empty') {
      // Table is empty: preserve all existing built-in games
      updateDbStatus(
        'connected',
        'Supabase Connected (0 records)',
        'Table public.games is empty. Showing local catalog.'
      );
    } else if (result.status === 'error') {
      // Graceful error state: fall back to built-in games
      updateDbStatus(
        'error',
        'Database Notice (Local games active)',
        result.error ? result.error.message : 'Could not query public.games'
      );
    } else if (result.status === 'connected' && Array.isArray(result.data)) {
      // Convert database records to playable cards
      const dbGames = result.data.map(rec => {
        const slug = (rec.slug || rec.name || '').toLowerCase().trim();
        const matchedBuiltin = BUILTIN_GAMES.find(bg => bg.slug === slug || bg.id === slug);

        return {
          id: slug || String(rec.id),
          dbId: rec.id,
          slug: slug,
          title: rec.name || (matchedBuiltin ? matchedBuiltin.title : 'Untitled Game'),
          category: (rec.category || (matchedBuiltin ? matchedBuiltin.category : 'arcade')).toLowerCase(),
          categoryLabel: formatCategory(rec.category || (matchedBuiltin ? matchedBuiltin.categoryLabel : 'Arcade')),
          desc: rec.description || (matchedBuiltin ? matchedBuiltin.desc : ''),
          icon: matchedBuiltin ? matchedBuiltin.icon : getCategoryIcon(rec.category),
          bg: matchedBuiltin ? matchedBuiltin.bg : getCategoryGradient(rec.category),
          badge: 'Cloud',
          path: matchedBuiltin ? matchedBuiltin.path : `games/${slug}/index.html`,
          created_at: rec.created_at
        };
      });

      // Merge: DB games first, and append any built-in games whose slugs are not in DB
      // This guarantees no existing game cards or links are deleted
      const nonOverlappingBuiltins = BUILTIN_GAMES.filter(
        bg => !dbGames.some(dg => dg.slug === bg.slug || dg.id === bg.id)
      );

      activeGames = [...dbGames, ...nonOverlappingBuiltins];

      updateDbStatus(
        'connected',
        `Supabase Synced (${result.data.length} games)`,
        `Successfully loaded ${result.data.length} game records from public.games`
      );

      renderGames();
    }
  } catch (err) {
    console.warn('GameZone: syncDatabase encountered an error:', err);
    updateDbStatus('error', 'Database Notice (Local games active)', err.message || '');
  }
}

/**
 * Render games based on category filter and search query
 */
function renderGames() {
  const filtered = activeGames.filter(g => {
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
        <span class="badge-tag">${game.badge || game.categoryLabel}</span>
        <button class="fav-btn ${isFav ? 'active' : ''}" title="Favorite" data-id="${game.id}">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-body">
        <div class="card-title-row">
          <div class="card-title">${game.title}</div>
          <span class="card-category-pill">${game.categoryLabel}</span>
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
      if (e.target.closest('.fav-btn')) return;
      openGame(game);
    });

    // Favorite toggle click
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
  const list = activeGames.length > 0 ? activeGames : BUILTIN_GAMES;
  const randomGame = list[Math.floor(Math.random() * list.length)];
  openGame(randomGame);
});

heroPlayBtn.addEventListener('click', () => {
  openGame(activeGames[0] || BUILTIN_GAMES[0]);
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

// 1. Initial Render (immediate offline display of built-in games)
renderGames();

// 2. Asynchronous Database Sync
syncDatabase();
