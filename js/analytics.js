/**
 * GameZone - Analytics Service
 * Lightweight Google Analytics 4 (GA4) event tracker for gameplay activity.
 * Measurement ID: G-9G3LW44DVS
 *
 * Provides safe, non-blocking telemetry for:
 * - game_start: Fired only when gameplay genuinely begins (not on page load)
 * - game_over: Fired when a game ends without a win (collision, lives lost, defeat, draw)
 * - game_complete: Fired only on genuine victory/completion (board cleared, 2048 reached, etc.)
 * - post_score: Fired when a meaningful score is recorded
 * - duration_seconds: Automatically calculated from session start to valid end event
 */
(function(root) {
  'use strict';

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

  // Safe event dispatcher - never throws, never blocks gameplay
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

        sendGtagEvent('game_start', {
          game_slug: gameSlug,
          ...extraParams
        });
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

        sendGtagEvent('game_over', params);
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

        sendGtagEvent('game_complete', params);
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
})(typeof window !== 'undefined' ? window : this);
