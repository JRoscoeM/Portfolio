-- Adds "X times every Y days" habit schedules (schedule_type 'interval').
-- Run after 001_tracker.sql. Safe to rerun.
-- Kept to a single statement (one ALTER TABLE is atomic on its own) so it runs in SQL editors
-- that send the whole script as one prepared statement.

ALTER TABLE tracker_habits
    ADD COLUMN IF NOT EXISTS interval_count SMALLINT,
    ADD COLUMN IF NOT EXISTS interval_days SMALLINT,
    DROP CONSTRAINT IF EXISTS tracker_habits_schedule_type_check,
    ADD CONSTRAINT tracker_habits_schedule_type_check
        CHECK (schedule_type IN ('daily', 'weekdays', 'weekly', 'interval')),
    DROP CONSTRAINT IF EXISTS tracker_habits_interval_check,
    ADD CONSTRAINT tracker_habits_interval_check
        CHECK (
            (interval_count IS NULL AND interval_days IS NULL)
            OR (interval_days BETWEEN 1 AND 90 AND interval_count BETWEEN 1 AND interval_days)
        ),
    DROP CONSTRAINT IF EXISTS tracker_habits_interval_schedule_check,
    ADD CONSTRAINT tracker_habits_interval_schedule_check
        CHECK (schedule_type <> 'interval' OR (interval_count IS NOT NULL AND interval_days IS NOT NULL));
