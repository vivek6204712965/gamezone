-- ====================================================================
-- GameZone Telemetry & Activity Storage Migration (Hardened Security Revision)
-- File: supabase/migrations/20261028_create_game_activity.sql
--
-- PURPOSE:
-- Creates public.game_activity table, performance indexes, explicit
-- table/sequence grants, and strict Row Level Security (RLS) policies.
--
-- SECURITY DECISIONS:
-- 1. Strictly APPEND-ONLY: No UPDATE or DELETE policies are granted to ANY role.
-- 2. Public/Anon access: INSERT ONLY. SELECT is completely blocked.
-- 3. Identity Sequence: Dedicated USAGE grant scoped strictly to game_activity identity sequence.
-- 4. Untrusted Payload Defense: Strict CHECK constraints on event types,
--    game slugs, score boundaries, duration boundaries, JSON object type,
--    and max metadata size (<= 2048 bytes).
-- 5. Admin Authorization: SELECT is restricted strictly to verified admin email.
--    Never trusts user-editable user_metadata.
-- ====================================================================

-- 1. Table Creation with Strict Database Constraints
CREATE TABLE IF NOT EXISTS public.game_activity (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type text NOT NULL,
    game_slug text NOT NULL,
    score integer NULL,
    duration_seconds integer NOT NULL DEFAULT 0,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Database Integrity Constraints (Reject malformed or untrusted inputs)
    CONSTRAINT chk_event_type CHECK (event_type IN ('game_start', 'game_over', 'game_complete')),
    CONSTRAINT chk_game_slug CHECK (game_slug IN (
        'snake', 'tetris', '2048', 'flappy', 'breakout', 'dino',
        'space-invaders', 'pong', 'memory', 'tictactoe', 'minesweeper', 'connect4'
    )),
    CONSTRAINT chk_duration CHECK (duration_seconds >= 0 AND duration_seconds <= 86400),
    CONSTRAINT chk_score CHECK (score IS NULL OR (score >= 0 AND score <= 10000000)),
    CONSTRAINT chk_metadata_type CHECK (jsonb_typeof(metadata) = 'object'),
    CONSTRAINT chk_metadata_size CHECK (pg_column_size(metadata) <= 2048)
);

-- 2. Performance Indexes for Dashboard Aggregations
CREATE INDEX IF NOT EXISTS idx_game_activity_created_at
    ON public.game_activity (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_activity_slug_event
    ON public.game_activity (game_slug, event_type);

CREATE INDEX IF NOT EXISTS idx_game_activity_event_type
    ON public.game_activity (event_type);

-- 3. Explicit Table Grants (Least Privilege Principle)
REVOKE ALL ON TABLE public.game_activity FROM anon, authenticated, public;
GRANT INSERT ON TABLE public.game_activity TO anon;
GRANT INSERT, SELECT ON TABLE public.game_activity TO authenticated;

-- 4. Sequence Grants (Scoped Strictly to the Identity Sequence)
DO $$
DECLARE
    seq_name text;
BEGIN
    seq_name := pg_get_serial_sequence('public.game_activity', 'id');
    IF seq_name IS NOT NULL THEN
        EXECUTE 'REVOKE ALL ON SEQUENCE ' || seq_name || ' FROM anon, authenticated, public;';
        EXECUTE 'GRANT USAGE ON SEQUENCE ' || seq_name || ' TO anon, authenticated;';
    END IF;
END $$;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.game_activity ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy 1: Allow public (anon) & authenticated users to INSERT with validation
DROP POLICY IF EXISTS "allow_anon_insert_game_activity" ON public.game_activity;
CREATE POLICY "allow_anon_insert_game_activity"
ON public.game_activity
FOR INSERT
TO anon, authenticated
WITH CHECK (
    event_type IN ('game_start', 'game_over', 'game_complete')
    AND game_slug IN (
        'snake', 'tetris', '2048', 'flappy', 'breakout', 'dino',
        'space-invaders', 'pong', 'memory', 'tictactoe', 'minesweeper', 'connect4'
    )
    AND duration_seconds >= 0 AND duration_seconds <= 86400
    AND (score IS NULL OR (score >= 0 AND score <= 10000000))
    AND jsonb_typeof(metadata) = 'object'
    AND pg_column_size(metadata) <= 2048
);

-- 7. RLS Policy 2: Allow ONLY designated administrator to SELECT records
DROP POLICY IF EXISTS "allow_admin_select_game_activity" ON public.game_activity;
CREATE POLICY "allow_admin_select_game_activity"
ON public.game_activity
FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'email') = 'kumarvivek26012@gmail.com'
);

-- 8. Note on UPDATE and DELETE:
-- No policies are created for UPDATE or DELETE for any role.
-- PostgreSQL RLS defaults to DENY ALL, making public.game_activity strictly append-only.
