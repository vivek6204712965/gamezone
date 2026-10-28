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

// Safe localStorage wrapper (graceful fallback if localStorage is blocked/unavailable)
const safeStorage = {
  get(key, defaultValue = []) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;
      const parsed = JSON.parse(raw);
      return Array.isArray(defaultValue) && !Array.isArray(parsed) ? defaultValue : (parsed ?? defaultValue);
    } catch (err) {
      console.warn(`GameZone: safeStorage.get failed for "${key}":`, err);
      return defaultValue;
    }
  },
  getRaw(key) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (err) {
      console.warn(`GameZone: safeStorage.getRaw failed for "${key}":`, err);
      return null;
    }
  },
  set(key, value) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`GameZone: safeStorage.set failed for "${key}":`, err);
      return false;
    }
  }
};

/**
 * XSS-safe HTML string escaper
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// State
let currentCategory = 'all';
let searchQuery = '';
let favorites = safeStorage.get('gamezone_favorites', []);
let recentGames = safeStorage.get('gamezone_recent', []);

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
 * Check if a game is marked as favorite
 */
function isGameFavorite(game) {
  if (!game) return false;
  return favorites.includes(game.id) || (game.slug && favorites.includes(game.slug));
}

/**
 * Toggle favorite status of a game
 */
function toggleFavorite(id) {
  if (!id) return;
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  safeStorage.set('gamezone_favorites', favorites);
  renderGames();
}

/**
 * Record a game in the Recently Played list (max 10 unique games, newest first)
 */
function recordRecentlyPlayed(game) {
  if (!game) return;
  const id = game.id || game.slug;
  if (!id) return;

  // Remove if already in list to prevent duplicate and move to top
  recentGames = recentGames.filter(item => item !== id && item !== game.slug && item !== game.id);
  // Add to beginning of list
  recentGames.unshift(id);
  // Maintain maximum 10 unique games
  if (recentGames.length > 10) {
    recentGames = recentGames.slice(0, 10);
  }
  safeStorage.set('gamezone_recent', recentGames);
}

/**
 * Retrieve the saved best score label for a game, if a valid record exists.
 * Returns null if no record exists or if the game does not support a high score.
 */
function getGameBestScore(game) {
  if (!game) return null;
  const keyId = (game.slug || game.id || '').toLowerCase();

  let storageKey = null;
  let unit = '';
  let isMoves = false;
  let isWins = false;

  switch (keyId) {
    case 'snake':
      storageKey = 'snake_neon_best';
      break;
    case 'tetris':
      storageKey = 'tetris_master_best';
      break;
    case '2048':
      storageKey = '2048_deluxe_best';
      break;
    case 'flappy':
      storageKey = 'flappy_cyber_best';
      break;
    case 'breakout':
      storageKey = 'breakout_neon_best';
      break;
    case 'dino':
      storageKey = 'dino_runner_best';
      unit = 'm';
      break;
    case 'space-invaders':
      storageKey = 'galaxy_defender_best';
      break;
    case 'memory':
      storageKey = 'memory_match_best';
      isMoves = true;
      break;
    case 'minesweeper':
      storageKey = 'minesweeper_best_time';
      unit = 's';
      break;
    case 'pong':
      storageKey = 'pong_ai_wins';
      isWins = true;
      break;
    case 'tictactoe':
      storageKey = 'tictactoe_ai_wins';
      isWins = true;
      break;
    case 'connect4':
      storageKey = 'connect4_ai_wins';
      isWins = true;
      break;
    default:
      return null;
  }

  const raw = safeStorage.getRaw(storageKey);
  if (!raw) return null;

  const val = parseInt(raw, 10);
  if (!Number.isFinite(val) || val <= 0) return null;

  if (isMoves) {
    return `🏆 Best: ${val} ${val === 1 ? 'move' : 'moves'}`;
  }

  if (isWins) {
    return `🏆 Best: ${val} ${val === 1 ? 'win' : 'wins'}`;
  }

  return `🏆 Best: ${val.toLocaleString()}${unit}`;
}

/**
 * Render games based on category filter, favorites, recently played, and search query
 */
function renderGames() {
  let gamesToDisplay = [];

  if (currentCategory === 'recent') {
    // Map recentGames IDs to active game objects in exact recency order
    recentGames.forEach(recentId => {
      const game = activeGames.find(g => g.id === recentId || g.slug === recentId);
      if (game && !gamesToDisplay.some(existing => existing.id === game.id)) {
        gamesToDisplay.push(game);
      }
    });
  } else if (currentCategory === 'favorites') {
    gamesToDisplay = activeGames.filter(g => isGameFavorite(g));
  } else if (currentCategory === 'all') {
    gamesToDisplay = activeGames;
  } else {
    gamesToDisplay = activeGames.filter(g => g.category === currentCategory);
  }

  const q = searchQuery.toLowerCase().trim();
  const filtered = gamesToDisplay.filter(g => {
    if (!q) return true;
    const title = (g.title || '').toLowerCase();
    const desc = (g.desc || '').toLowerCase();
    const cat = (g.categoryLabel || '').toLowerCase();
    const slug = (g.slug || '').toLowerCase();
    return title.includes(q) || desc.includes(q) || cat.includes(q) || slug.includes(q);
  });

  // Accessible game count description
  if (currentCategory === 'favorites') {
    gameCountEl.textContent = `Showing ${filtered.length} favorite ${filtered.length === 1 ? 'game' : 'games'}`;
  } else if (currentCategory === 'recent') {
    gameCountEl.textContent = `Showing ${filtered.length} recently played ${filtered.length === 1 ? 'game' : 'games'}`;
  } else {
    gameCountEl.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? 'game' : 'games'}`;
  }

  gamesGrid.innerHTML = '';

  // Empty State handling
  if (filtered.length === 0) {
    let emptyHtml = '';
    if (currentCategory === 'favorites' && favorites.length === 0) {
      emptyHtml = `
        <div class="empty-state">
          <span class="empty-state-icon">❤️</span>
          <h3 class="empty-state-title">No favorite games yet</h3>
          <p class="empty-state-desc">Click the heart icon on any game card to add it to your favorites list for quick access!</p>
        </div>
      `;
    } else if (currentCategory === 'recent' && recentGames.length === 0) {
      emptyHtml = `
        <div class="empty-state">
          <span class="empty-state-icon">🕒</span>
          <h3 class="empty-state-title">No recently played games yet</h3>
          <p class="empty-state-desc">Launch any game to see it recorded here in your recently played list.</p>
        </div>
      `;
    } else if (q) {
      emptyHtml = `
        <div class="empty-state">
          <span class="empty-state-icon">🔍</span>
          <h3 class="empty-state-title">No games found</h3>
          <p class="empty-state-desc">No games match "<strong>${escapeHtml(searchQuery)}</strong>". Try another keyword or switch categories!</p>
        </div>
      `;
    } else {
      emptyHtml = `
        <div class="empty-state">
          <span class="empty-state-icon">🎮</span>
          <h3 class="empty-state-title">No games available</h3>
          <p class="empty-state-desc">No games found in this category. Try exploring other categories!</p>
        </div>
      `;
    }
    gamesGrid.innerHTML = emptyHtml;
    return;
  }

  // Render cards
  filtered.forEach(game => {
    const isFav = isGameFavorite(game);
    const bestScore = getGameBestScore(game);
    const safeTitle = escapeHtml(game.title);
    const safeDesc = escapeHtml(game.desc);
    const safeCatLabel = escapeHtml(game.categoryLabel);
    const safeBadge = escapeHtml(game.badge || game.categoryLabel);
    const safeIcon = escapeHtml(game.icon);
    const safeId = escapeHtml(game.id);
    const bestBadgeHtml = bestScore
      ? `<span class="card-best-badge" style="position: absolute; bottom: 10px; left: 10px; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px); border: 1px solid rgba(250, 204, 21, 0.45); color: #facc15; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; box-shadow: 0 0 10px rgba(250, 204, 21, 0.25); display: inline-flex; align-items: center; gap: 4px; z-index: 1; pointer-events: none; letter-spacing: 0.02em;">${escapeHtml(bestScore)}</span>`
      : '';

    const card = document.createElement('div');
    card.className = 'game-card';
    card.setAttribute('role', 'article');
    card.setAttribute('tabindex', '0');
    const ariaBest = bestScore ? `, ${bestScore.replace('🏆 ', '')}` : '';
    card.setAttribute('aria-label', `${game.title} - ${game.categoryLabel} game${ariaBest}`);

    card.innerHTML = `
      <div class="card-thumbnail">
        <span class="thumbnail-icon">${safeIcon}</span>
        <span class="badge-tag">${safeBadge}</span>
        ${bestBadgeHtml}
        <button
          type="button"
          class="fav-btn ${isFav ? 'active' : ''}"
          title="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
          aria-label="${isFav ? 'Remove ' + safeTitle + ' from favorites' : 'Add ' + safeTitle + ' to favorites'}"
          aria-pressed="${isFav ? 'true' : 'false'}"
          data-id="${safeId}">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-body">
        <div class="card-title-row">
          <div class="card-title">${safeTitle}</div>
          <span class="card-category-pill">${safeCatLabel}</span>
        </div>
        <div class="card-desc">${safeDesc}</div>
        <div class="card-footer">
          <span class="card-category">● ${safeCatLabel}</span>
          <button type="button" class="card-play-btn" aria-hidden="true" tabindex="-1">Play Now ▶</button>
        </div>
      </div>
    `;

    // Set background safely
    const thumb = card.querySelector('.card-thumbnail');
    if (thumb && game.bg) {
      thumb.style.background = game.bg;
    }

    // Click to play (skip if favorite button was clicked)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.fav-btn')) return;
      openGame(game);
    });

    // Keyboard support: Enter or Space launches game
    card.addEventListener('keydown', (e) => {
      if (e.target.closest('.fav-btn')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openGame(game);
      }
    });

    // Favorite toggle button
    const favBtn = card.querySelector('.fav-btn');
    if (favBtn) {
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(game.id);
      });
      favBtn.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFavorite(game.id);
        }
      });
    }

    gamesGrid.appendChild(card);
  });
}

function openGame(game) {
  if (!game) return;
  recordRecentlyPlayed(game);
  playerTitle.textContent = game.title;
  playerTag.textContent = game.categoryLabel;
  gameIframe.src = game.path;
  playerModal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // If currently in 'recent' view, re-render to reflect the newly moved game on top
  if (currentCategory === 'recent') {
    renderGames();
  }
}

function closeGame() {
  playerModal.classList.remove('active');
  gameIframe.src = '';
  document.body.style.overflow = '';
  renderGames();
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
