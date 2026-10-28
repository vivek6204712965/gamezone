/**
 * GameZone - Database Service
 * Connects to Supabase to fetch game records from public.games
 */
const GameZoneDB = {
  client: null,
  status: 'idle', // 'idle' | 'loading' | 'connected' | 'empty' | 'error' | 'unconfigured'
  lastError: null,

  /**
   * Verify whether the Supabase Project URL and publishable key have been provided.
   * Ensures neither placeholder values nor blank values trigger network calls.
   */
  isConfigured() {
    const config = window.SUPABASE_CONFIG;
    if (!config) return false;
    const url = (config.url || '').trim();
    const key = (config.anonKey || '').trim();
    if (!url || !key) return false;
    if (url.includes('YOUR_') || key.includes('YOUR_')) return false;
    if (!url.startsWith('https://') && !url.startsWith('http://')) return false;
    return true;
  },

  /**
   * Initialize and return the Supabase client instance.
   */
  getClient() {
    if (this.client) return this.client;
    if (!this.isConfigured()) return null;

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      console.warn('GameZoneDB: Supabase library not loaded. Ensure CDN script is reachable.');
      return null;
    }

    try {
      this.client = window.supabase.createClient(
        window.SUPABASE_CONFIG.url.trim(),
        window.SUPABASE_CONFIG.anonKey.trim()
      );
      return this.client;
    } catch (err) {
      console.error('GameZoneDB: Failed to initialize Supabase client:', err);
      this.lastError = err;
      return null;
    }
  },

  /**
   * Fetch game records from the public.games table.
   * Expected columns: id, name, slug, category, description, created_at
   *
   * @returns {Promise<{data: Array|null, error: Error|null, status: string}>}
   */
  async fetchGames() {
    if (!this.isConfigured()) {
      this.status = 'unconfigured';
      return { data: null, error: null, status: 'unconfigured' };
    }

    const client = this.getClient();
    if (!client) {
      this.status = 'error';
      const err = new Error('Supabase client could not be initialized.');
      this.lastError = err;
      return { data: null, error: err, status: 'error' };
    }

    this.status = 'loading';
    try {
      const { data, error } = await client
        .from('games')
        .select('id, name, slug, category, description, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        this.status = 'error';
        this.lastError = error;
        console.warn('GameZoneDB: Supabase query returned an error:', error.message || error);
        return { data: null, error, status: 'error' };
      }

      if (!Array.isArray(data) || data.length === 0) {
        this.status = 'empty';
        return { data: [], error: null, status: 'empty' };
      }

      this.status = 'connected';
      return { data, error: null, status: 'connected' };
    } catch (err) {
      this.status = 'error';
      this.lastError = err;
      console.warn('GameZoneDB: Network or connection error while querying games:', err.message || err);
      return { data: null, error: err, status: 'error' };
    }
  }
};

if (typeof window !== 'undefined') {
  window.GameZoneDB = GameZoneDB;
}
