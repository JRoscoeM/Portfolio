-- Personal habit and workout tracker schema for Neon/PostgreSQL.
-- Safe to rerun against the same migration state; seed rows are only inserted when missing.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tracker_users (
    id TEXT PRIMARY KEY,
    display_name VARCHAR(80) NOT NULL,
    timezone VARCHAR(80) NOT NULL DEFAULT 'America/Denver',
    weight_unit VARCHAR(4) NOT NULL DEFAULT 'lb',
    distance_unit VARCHAR(4) NOT NULL DEFAULT 'mi',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tracker_users_weight_unit_check CHECK (weight_unit IN ('lb', 'kg')),
    CONSTRAINT tracker_users_distance_unit_check CHECK (distance_unit IN ('mi', 'km'))
);

CREATE TABLE IF NOT EXISTS tracker_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES tracker_users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(24),
    icon VARCHAR(40),
    tracking_type VARCHAR(16) NOT NULL DEFAULT 'boolean',
    unit VARCHAR(32),
    target_value NUMERIC(12, 2) NOT NULL DEFAULT 1,
    schedule_type VARCHAR(16) NOT NULL DEFAULT 'daily',
    days_of_week SMALLINT[] NOT NULL DEFAULT '{}',
    target_days_per_week SMALLINT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tracker_habits_id_user_unique UNIQUE (id, user_id),
    CONSTRAINT tracker_habits_tracking_type_check
        CHECK (tracking_type IN ('boolean', 'count', 'duration')),
    CONSTRAINT tracker_habits_target_value_check CHECK (target_value > 0),
    CONSTRAINT tracker_habits_schedule_type_check
        CHECK (schedule_type IN ('daily', 'weekdays', 'weekly')),
    CONSTRAINT tracker_habits_days_of_week_check
        CHECK (days_of_week <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::SMALLINT[]),
    CONSTRAINT tracker_habits_target_days_check
        CHECK (target_days_per_week IS NULL OR target_days_per_week BETWEEN 1 AND 7),
    CONSTRAINT tracker_habits_weekday_schedule_check
        CHECK (schedule_type <> 'weekdays' OR cardinality(days_of_week) > 0),
    CONSTRAINT tracker_habits_weekly_schedule_check
        CHECK (schedule_type <> 'weekly' OR target_days_per_week IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS tracker_habit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES tracker_users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL,
    entry_date DATE NOT NULL,
    value NUMERIC(12, 2),
    status VARCHAR(16) NOT NULL DEFAULT 'complete',
    note TEXT,
    target_value_snapshot NUMERIC(12, 2) NOT NULL,
    unit_snapshot VARCHAR(32),
    tracking_type_snapshot VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tracker_habit_entries_habit_fk
        FOREIGN KEY (habit_id, user_id)
        REFERENCES tracker_habits(id, user_id) ON DELETE CASCADE,
    CONSTRAINT tracker_habit_entries_unique UNIQUE (user_id, habit_id, entry_date),
    CONSTRAINT tracker_habit_entries_value_check CHECK (value IS NULL OR value >= 0),
    CONSTRAINT tracker_habit_entries_target_snapshot_check CHECK (target_value_snapshot > 0),
    CONSTRAINT tracker_habit_entries_status_check
        CHECK (status IN ('complete', 'partial', 'skipped')),
    CONSTRAINT tracker_habit_entries_tracking_type_check
        CHECK (tracking_type_snapshot IN ('boolean', 'count', 'duration'))
);

CREATE TABLE IF NOT EXISTS tracker_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES tracker_users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(40) NOT NULL,
    muscle_group VARCHAR(40),
    tracking_type VARCHAR(16) NOT NULL,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tracker_exercises_id_user_unique UNIQUE (id, user_id),
    CONSTRAINT tracker_exercises_user_name_unique UNIQUE (user_id, name),
    CONSTRAINT tracker_exercises_tracking_type_check
        CHECK (tracking_type IN ('strength', 'bodyweight', 'assisted', 'duration', 'distance'))
);

CREATE TABLE IF NOT EXISTS tracker_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES tracker_users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tracker_routines_id_user_unique UNIQUE (id, user_id),
    CONSTRAINT tracker_routines_user_name_unique UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS tracker_routine_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES tracker_users(id) ON DELETE CASCADE,
    routine_id UUID NOT NULL,
    exercise_id UUID NOT NULL,
    position SMALLINT NOT NULL,
    notes TEXT,
    target_sets SMALLINT,
    target_reps_min SMALLINT,
    target_reps_max SMALLINT,
    target_weight_kg NUMERIC(10, 3),
    target_duration_seconds INTEGER,
    target_distance_meters NUMERIC(12, 2),
    target_rest_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tracker_routine_exercises_routine_fk
        FOREIGN KEY (routine_id, user_id)
        REFERENCES tracker_routines(id, user_id) ON DELETE CASCADE,
    CONSTRAINT tracker_routine_exercises_exercise_fk
        FOREIGN KEY (exercise_id, user_id)
        REFERENCES tracker_exercises(id, user_id) ON DELETE NO ACTION,
    CONSTRAINT tracker_routine_exercises_position_unique UNIQUE (routine_id, position),
    CONSTRAINT tracker_routine_exercises_target_sets_check
        CHECK (target_sets IS NULL OR target_sets BETWEEN 1 AND 30),
    CONSTRAINT tracker_routine_exercises_target_reps_check
        CHECK (
            (target_reps_min IS NULL OR target_reps_min >= 0)
            AND (target_reps_max IS NULL OR target_reps_max >= 0)
            AND (target_reps_min IS NULL OR target_reps_max IS NULL OR target_reps_min <= target_reps_max)
        ),
    CONSTRAINT tracker_routine_exercises_target_weight_check
        CHECK (target_weight_kg IS NULL OR target_weight_kg >= 0),
    CONSTRAINT tracker_routine_exercises_target_duration_check
        CHECK (target_duration_seconds IS NULL OR target_duration_seconds >= 0),
    CONSTRAINT tracker_routine_exercises_target_distance_check
        CHECK (target_distance_meters IS NULL OR target_distance_meters >= 0),
    CONSTRAINT tracker_routine_exercises_target_rest_check
        CHECK (target_rest_seconds IS NULL OR target_rest_seconds BETWEEN 0 AND 3600)
);

CREATE TABLE IF NOT EXISTS tracker_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES tracker_users(id) ON DELETE CASCADE,
    routine_id UUID,
    name VARCHAR(100) NOT NULL,
    notes TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    weight_unit_snapshot VARCHAR(4) NOT NULL,
    distance_unit_snapshot VARCHAR(4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tracker_workouts_id_user_unique UNIQUE (id, user_id),
    CONSTRAINT tracker_workouts_routine_fk
        FOREIGN KEY (routine_id, user_id)
        REFERENCES tracker_routines(id, user_id) ON DELETE NO ACTION,
    CONSTRAINT tracker_workouts_completed_after_start_check CHECK (completed_at >= started_at),
    CONSTRAINT tracker_workouts_weight_unit_check CHECK (weight_unit_snapshot IN ('lb', 'kg')),
    CONSTRAINT tracker_workouts_distance_unit_check CHECK (distance_unit_snapshot IN ('mi', 'km'))
);

CREATE TABLE IF NOT EXISTS tracker_workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES tracker_users(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL,
    exercise_id UUID NOT NULL,
    position SMALLINT NOT NULL,
    exercise_name_snapshot VARCHAR(100) NOT NULL,
    tracking_type_snapshot VARCHAR(16) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tracker_workout_exercises_id_user_unique UNIQUE (id, user_id),
    CONSTRAINT tracker_workout_exercises_workout_fk
        FOREIGN KEY (workout_id, user_id)
        REFERENCES tracker_workouts(id, user_id) ON DELETE CASCADE,
    CONSTRAINT tracker_workout_exercises_exercise_fk
        FOREIGN KEY (exercise_id, user_id)
        REFERENCES tracker_exercises(id, user_id) ON DELETE NO ACTION,
    CONSTRAINT tracker_workout_exercises_position_unique UNIQUE (workout_id, position),
    CONSTRAINT tracker_workout_exercises_tracking_type_check
        CHECK (tracking_type_snapshot IN ('strength', 'bodyweight', 'assisted', 'duration', 'distance'))
);

CREATE TABLE IF NOT EXISTS tracker_workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES tracker_users(id) ON DELETE CASCADE,
    workout_exercise_id UUID NOT NULL,
    set_number SMALLINT NOT NULL,
    set_type VARCHAR(16) NOT NULL DEFAULT 'working',
    reps SMALLINT,
    weight_kg NUMERIC(10, 3),
    duration_seconds INTEGER,
    distance_meters NUMERIC(12, 2),
    rpe NUMERIC(3, 1),
    is_completed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tracker_workout_sets_exercise_fk
        FOREIGN KEY (workout_exercise_id, user_id)
        REFERENCES tracker_workout_exercises(id, user_id) ON DELETE CASCADE,
    CONSTRAINT tracker_workout_sets_number_unique UNIQUE (workout_exercise_id, set_number),
    CONSTRAINT tracker_workout_sets_type_check
        CHECK (set_type IN ('warmup', 'working', 'drop', 'failure', 'cooldown')),
    CONSTRAINT tracker_workout_sets_reps_check CHECK (reps IS NULL OR reps >= 0),
    CONSTRAINT tracker_workout_sets_weight_check CHECK (weight_kg IS NULL OR weight_kg >= 0),
    CONSTRAINT tracker_workout_sets_duration_check CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    CONSTRAINT tracker_workout_sets_distance_check CHECK (distance_meters IS NULL OR distance_meters >= 0),
    CONSTRAINT tracker_workout_sets_rpe_check CHECK (rpe IS NULL OR rpe BETWEEN 0 AND 10),
    CONSTRAINT tracker_workout_sets_metric_check
        CHECK (
            reps IS NOT NULL
            OR weight_kg IS NOT NULL
            OR duration_seconds IS NOT NULL
            OR distance_meters IS NOT NULL
        )
);

CREATE INDEX IF NOT EXISTS idx_tracker_habits_user_active
    ON tracker_habits (user_id, archived_at, created_at);
CREATE INDEX IF NOT EXISTS idx_tracker_habit_entries_user_date
    ON tracker_habit_entries (user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_habit_entries_habit_date
    ON tracker_habit_entries (habit_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_exercises_user_active
    ON tracker_exercises (user_id, is_archived, name);
CREATE INDEX IF NOT EXISTS idx_tracker_routines_user_active
    ON tracker_routines (user_id, is_archived, name);
CREATE INDEX IF NOT EXISTS idx_tracker_routine_exercises_exercise
    ON tracker_routine_exercises (exercise_id);
CREATE INDEX IF NOT EXISTS idx_tracker_workouts_user_completed
    ON tracker_workouts (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_workouts_routine
    ON tracker_workouts (routine_id);
CREATE INDEX IF NOT EXISTS idx_tracker_workout_exercises_exercise
    ON tracker_workout_exercises (exercise_id);

INSERT INTO tracker_users (id, display_name, timezone, weight_unit, distance_unit)
VALUES ('owner', 'Roscoe', 'America/Denver', 'lb', 'mi')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tracker_exercises (user_id, name, category, muscle_group, tracking_type)
VALUES
    ('owner', 'Back Squat', 'barbell', 'legs', 'strength'),
    ('owner', 'Bench Press', 'barbell', 'chest', 'strength'),
    ('owner', 'Deadlift', 'barbell', 'posterior chain', 'strength'),
    ('owner', 'Overhead Press', 'barbell', 'shoulders', 'strength'),
    ('owner', 'Barbell Row', 'barbell', 'back', 'strength'),
    ('owner', 'Romanian Deadlift', 'barbell', 'hamstrings', 'strength'),
    ('owner', 'Dumbbell Bench Press', 'dumbbell', 'chest', 'strength'),
    ('owner', 'Leg Press', 'machine', 'legs', 'strength'),
    ('owner', 'Pull-Up', 'bodyweight', 'back', 'bodyweight'),
    ('owner', 'Lat Pulldown', 'machine', 'back', 'strength'),
    ('owner', 'Running', 'cardio', NULL, 'distance'),
    ('owner', 'Cycling', 'cardio', NULL, 'distance'),
    ('owner', 'Walking', 'cardio', NULL, 'distance'),
    ('owner', 'Rowing', 'cardio', 'full body', 'distance'),
    ('owner', 'Plank', 'bodyweight', 'core', 'duration')
ON CONFLICT (user_id, name) DO NOTHING;

COMMIT;
