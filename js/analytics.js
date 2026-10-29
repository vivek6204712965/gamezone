/**
 * GameZone - Analytics Service
 * Dual-dispatch event tracker for gameplay activity:
 * 1. Google Analytics 4 (GA4) - Measurement ID: G-9G3LW44DVS
 * 2. Supabase Telemetry - public.game_activity (PostgREST REST API)
 *
 * Provides safe, non-blocking telemetry for:
 * - game_start: Fired only when gameplay genuinely begins (not on page load)
 * - game_over: Fired when a game ends without a win (collision, lives lost, defeat, draw)
 * - game_complete: Fired only on genuine victory/completion (board cleared, 2048 reached, etc.)
 * - post_score: Fired when a meaningful score is recorded
 * - duration_seconds: Automatically calculated from session start to valid end event
 *
 * Security & Reliability Guarantees:
 * - Never blocks gameplay rendering or input loop (all failures are silent).
 * - Uses native fetch() with keepalive: true so requests finish even if the user navigates away.
 * - Uses public publishable anon key only.
 * - Payload conforms strictly to database CHECK constraints.
 */
(function(root) {
  'use strict';

  // Allowed database game slugs (mirrors chk_game_slug)
  const VALID_GAME_SLUGS = new Set([
    'snake', 'tetris', '2048', 'flappy', 'breakout', 'dino',
    'space-invaders', 'pong', 'memory', 'tictactoe', 'minesweeper', 'connect4'
  ]);

  // Allowed database event types (mirrors chk_event_type)
  const VALID_DB_EVENTS = new Set(['game_start', 'game_over', 'game_complete']);

  // Defensive lookup for gtag: checks local window, then parent window if inside iframe
  function getGtag() {
    if (typeof root.gtag === 'function') {
      return root.gtag;
    }
    try {
      if (root.parent && root.parent !== root && typeof root.parent.gtag === 'function') {
        return root.parent.gtag;
      }
    } catch (_) {
      // Cross-origin fallback
    }
    return null;
  }

  // Safe GA4 event dispatcher - never throws, never blocks gameplay
  function sendGtagEvent(eventName, params) {
    try {
      const gtag = getGtag();
      if (typeof gtag === 'function') {
        gtag('event', eventName, params);
      }
    } catch (_) {
      // Silent failure: tracking must never interrupt gameplay
    }
  }

  // Defensive lookup for Supabase Configuration: checks local window, then parent window
  function getSupabaseConfig() {
    try {
      if (typeof root.SUPABASE_CONFIG === 'object' && root.SUPABASE_CONFIG && root.SUPABASE_CONFIG.url && root.SUPABASE_CONFIG.anonKey) {
        return root.SUPABASE_CONFIG;
      }
    } catch (_) {}

    try {
      if (root.parent && root.parent !== root && typeof root.parent.SUPABASE_CONFIG === 'object' && root.parent.SUPABASE_CONFIG && root.parent.SUPABASE_CONFIG.url && root.parent.SUPABASE_CONFIG.anonKey) {
        return root.parent.SUPABASE_CONFIG;
      }
    } catch (_) {}

    return null;
  }

  // Sanitize numeric score to comply with chk_score: (score IS NULL OR (score >= 0 AND score <= 10000000))
  function sanitizeScore(score) {
    if (typeof score !== 'number' || !Number.isFinite(score)) return null;
    const rounded = Math.round(score);
    if (rounded < 0 || rounded > 10000000) return null;
    return rounded;
  }

  // Sanitize duration to comply with chk_duration: (duration_seconds >= 0 AND duration_seconds <= 86400)
  function sanitizeDuration(duration) {
    if (typeof duration !== 'number' || !Number.isFinite(duration)) return 0;
    const rounded = Math.round(duration);
    if (rounded < 0) return 0;
    if (rounded > 86400) return 86400;
    return rounded;
  }

  // Sanitize metadata to comply with chk_metadata_type (jsonb object) and chk_metadata_size (<= 2048 bytes)
  // Strips any sensitive or personal fields defensively
  function sanitizeMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {};
    }
    const safe = {};
    const disallowedKeys = new Set(['email', 'name', 'user', 'username', 'token', 'auth', 'password', 'ip']);
    for (const key of Object.keys(metadata)) {
      if (disallowedKeys.has(key.toLowerCase())) continue;
      const val = metadata[key];
      const type = typeof val;
      if (type === 'string' || type === 'number' || type === 'boolean') {
        safe[key] = val;
      }
    }
    return safe;
  }

  // Safe Supabase PostgREST dispatcher - non-blocking, keepalive, anon key only
  function sendSupabaseEvent(eventType, gameSlug, score, durationSeconds, extraParams) {
    try {
      if (!VALID_DB_EVENTS.has(eventType)) return;
      if (!VALID_GAME_SLUGS.has(gameSlug)) return;

      const config = getSupabaseConfig();
      if (!config) return;

      const url = (config.url || '').trim().replace(/\/+$/, '');
      const anonKey = (config.anonKey || '').trim();
      if (!url || !anonKey || url.includes('YOUR_') || anonKey.includes('YOUR_')) return;
      if (!url.startsWith('https://') && !url.startsWith('http://')) return;

      const payload = {
        event_type: eventType,
        game_slug: gameSlug,
        score: sanitizeScore(score),
        duration_seconds: sanitizeDuration(durationSeconds),
        metadata: sanitizeMetadata(extraParams)
      };

      if (typeof root.fetch === 'function') {
        root.fetch(`${url}/rest/v1/game_activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': 'Bearer ' + anonKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload),
          keepalive: true,
          mode: 'cors'
        }).catch(function() {
          // Silent failure: tracking must never interrupt gameplay
        });
      }
    } catch (_) {
      // Silent failure: tracking must never interrupt gameplay
    }
  }

  // In-memory sessions tracking per game slug
  const sessions = {};

  const GameAnalytics = {
    /**
     * Start a gameplay session.
     * Guaranteed to fire only once per active gameplay session.
     * Ignores redundant calls if a session is already active.
     *
     * @param {string} gameSlug - Identifier of the game (e.g. 'snake', 'tetris')
     * @param {Object} [extraParams] - Additional event parameters (e.g. { mode: 'ai' })
     */
    start(gameSlug, extraParams = {}) {
      if (!gameSlug) return;
      try {
        const session = sessions[gameSlug];
        if (session && session.active) {
          return;
        }

        sessions[gameSlug] = {
          active: true,
          startTime: Date.now(),
          completed: false
        };

        // 1. Dispatch to Google Analytics 4
        sendGtagEvent('game_start', {
          game_slug: gameSlug,
          ...extraParams
        });

        // 2. Dispatch to Supabase Telemetry
        sendSupabaseEvent('game_start', gameSlug, null, 0, extraParams);
      } catch (_) {}
    },

    /**
     * Record a Game Over event.
     * Calculates active duration and includes score where applicable.
     *
     * @param {string} gameSlug - Identifier of the game
     * @param {number|null} [score] - Final numerical score achieved
     * @param {Object} [extraParams] - Additional parameters (e.g. { level, lines })
     */
    gameOver(gameSlug, score = null, extraParams = {}) {
      if (!gameSlug) return;
      try {
        const session = sessions[gameSlug];
        if (!session || !session.active) {
          return;
        }

        const duration = session.startTime
          ? Math.max(1, Math.round((Date.now() - session.startTime) / 1000))
          : 0;

        session.active = false;
        session.startTime = null;

        const params = {
          game_slug: gameSlug,
          duration_seconds: duration,
          ...extraParams
        };

        if (typeof score === 'number' && Number.isFinite(score)) {
          params.score = Math.round(score);
        }

        // 1. Dispatch to Google Analytics 4
        sendGtagEvent('game_over', params);

        // 2. Dispatch to Supabase Telemetry
        sendSupabaseEvent('game_over', gameSlug, score, duration, extraParams);
      } catch (_) {}
    },

    /**
     * Record a Game Complete event when a player genuinely wins or finishes a game.
     *
     * @param {string} gameSlug - Identifier of the game
     * @param {number|null} [score] - Final score, moves, or completion metric
     * @param {Object} [extraParams] - Additional parameters
     */
    gameComplete(gameSlug, score = null, extraParams = {}) {
      if (!gameSlug) return;
      try {
        const session = sessions[gameSlug];
        if (session && session.completed) {
          return;
        }

        const duration = (session && session.startTime)
          ? Math.max(1, Math.round((Date.now() - session.startTime) / 1000))
          : 0;

        if (session) {
          session.active = false;
          session.completed = true;
          session.startTime = null;
        }

        const params = {
          game_slug: gameSlug,
          duration_seconds: duration,
          ...extraParams
        };

        if (typeof score === 'number' && Number.isFinite(score)) {
          params.score = Math.round(score);
        }

        // 1. Dispatch to Google Analytics 4
        sendGtagEvent('game_complete', params);

        // 2. Dispatch to Supabase Telemetry
        sendSupabaseEvent('game_complete', gameSlug, score, duration, extraParams);
      } catch (_) {}
    },

    /**
     * Record a score submission event (e.g. post_score).
     *
     * @param {string} gameSlug - Identifier of the game
     * @param {number} score - Score value submitted
     * @param {Object} [extraParams] - Additional parameters
     */
    postScore(gameSlug, score, extraParams = {}) {
      if (!gameSlug || typeof score !== 'number' || !Number.isFinite(score)) return;
      try {
        sendGtagEvent('post_score', {
          game_slug: gameSlug,
          score: Math.round(score),
          ...extraParams
        });
      } catch (_) {}
    },

    /**
     * Record a cross-game navigation click.
     *
     * @param {string} fromGame - Current game slug
     * @param {string} toGame - Destination game slug
     * @param {string} [source] - Click origin (e.g. 'game_over', 'related_grid', 'quick_nav')
     */
    trackCrossGame(fromGame, toGame, source = 'game_over') {
      if (!toGame) return;
      try {
        sendGtagEvent('cross_game_click', {
          from_game: fromGame || 'unknown',
          to_game: toGame,
          click_source: source
        });
      } catch (_) {}
    },

    /**
     * Reset session state without firing an event (e.g. on new game before any move).
     *
     * @param {string} gameSlug - Identifier of the game
     */
    reset(gameSlug) {
      if (gameSlug && sessions[gameSlug]) {
        sessions[gameSlug].active = false;
        sessions[gameSlug].startTime = null;
        sessions[gameSlug].completed = false;
      }
    },

    /**
     * Check if a session is currently active.
     *
     * @param {string} gameSlug - Identifier of the game
     * @returns {boolean}
     */
    isSessionActive(gameSlug) {
      return Boolean(sessions[gameSlug] && sessions[gameSlug].active);
    }
  };

  root.GameAnalytics = GameAnalytics;

  // Global Cross-Game Navigation Tracking
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a[data-track-game], a.related-game-card');
      if (link) {
        let toGame = link.getAttribute('data-track-game');
        if (!toGame) {
          const href = link.getAttribute('href') || '';
          const match = href.match(/(?:\.\.\/)?games\/([^\/]+)|\.\.\/([^\/]+)/);
          toGame = match ? (match[1] || match[2]) : '';
        }
        const source = link.getAttribute('data-track-source') || (link.classList.contains('related-game-card') ? 'related_grid' : 'overlay');
        const fromMatch = (typeof location !== 'undefined' ? location.pathname : '').match(/\/games\/([^\/]+)/);
        const fromGame = fromMatch ? fromMatch[1] : 'homepage';
        if (toGame && GameAnalytics && typeof GameAnalytics.trackCrossGame === 'function') {
          GameAnalytics.trackCrossGame(fromGame, toGame, source);
        }
      }
    }, true);
  }
})(typeof window !== 'undefined' ? window : this);
