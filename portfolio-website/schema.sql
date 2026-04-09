CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS snake_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spotify_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL UNIQUE REFERENCES snake_players(id) ON DELETE CASCADE,
    spotify_user_id TEXT NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    scope TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS snake_rooms (
    id TEXT PRIMARY KEY,
    room_name TEXT NOT NULL,
    host_player_id UUID NOT NULL REFERENCES snake_players(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'lobby',
    music_mode TEXT NOT NULL DEFAULT 'host_control',
    spotify_connected BOOLEAN NOT NULL DEFAULT FALSE,
    realtime_server_url TEXT,
    current_track_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    CONSTRAINT snake_rooms_status_check
        CHECK (status IN ('lobby', 'starting', 'in_progress', 'finished', 'abandoned')),
    CONSTRAINT snake_rooms_music_mode_check
        CHECK (music_mode IN ('host_control', 'ambient_only'))
);

CREATE TABLE IF NOT EXISTS snake_room_members (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES snake_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES snake_players(id) ON DELETE CASCADE,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    connection_status TEXT NOT NULL DEFAULT 'connected',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    CONSTRAINT snake_room_members_connection_status_check
        CHECK (connection_status IN ('connected', 'disconnected', 'rejoining')),
    CONSTRAINT snake_room_members_room_player_unique
        UNIQUE (room_id, player_id)
);

CREATE TABLE IF NOT EXISTS spotify_room_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL UNIQUE REFERENCES snake_rooms(id) ON DELETE CASCADE,
    host_player_id UUID NOT NULL REFERENCES snake_players(id) ON DELETE RESTRICT,
    spotify_connection_id UUID NOT NULL REFERENCES spotify_connections(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    current_track_id TEXT,
    current_track_name TEXT,
    artist_name TEXT,
    album_image_url TEXT,
    playback_state TEXT,
    snapshot_taken_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT spotify_room_sessions_playback_state_check
        CHECK (playback_state IN ('playing', 'paused', 'idle') OR playback_state IS NULL)
);

CREATE TABLE IF NOT EXISTS snake_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL REFERENCES snake_rooms(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'in_progress',
    winner_player_id UUID REFERENCES snake_players(id) ON DELETE SET NULL,
    max_players INTEGER,
    summary JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT snake_matches_status_check
        CHECK (status IN ('in_progress', 'finished', 'abandoned'))
);

CREATE TABLE IF NOT EXISTS snake_match_players (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES snake_matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES snake_players(id) ON DELETE RESTRICT,
    display_name TEXT NOT NULL,
    final_score INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER NOT NULL DEFAULT 0,
    placement INTEGER,
    entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    eliminated_at TIMESTAMPTZ,
    disconnect_reason TEXT,
    CONSTRAINT snake_match_players_score_check
        CHECK (final_score >= 0 AND max_score >= 0),
    CONSTRAINT snake_match_players_match_player_unique
        UNIQUE (match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_snake_rooms_host_player_id
    ON snake_rooms (host_player_id);

CREATE INDEX IF NOT EXISTS idx_snake_room_members_room_id
    ON snake_room_members (room_id);

CREATE INDEX IF NOT EXISTS idx_snake_room_members_player_id
    ON snake_room_members (player_id);

CREATE INDEX IF NOT EXISTS idx_snake_matches_room_id
    ON snake_matches (room_id);

CREATE INDEX IF NOT EXISTS idx_snake_match_players_match_id
    ON snake_match_players (match_id);

CREATE INDEX IF NOT EXISTS idx_snake_match_players_player_id
    ON snake_match_players (player_id);

CREATE INDEX IF NOT EXISTS idx_snake_match_players_max_score
    ON snake_match_players (max_score DESC);
