// The account that owned the tracker before sign-up was opened. Its data stays under this id.
const OWNER_ID = "owner";

// Starter exercise catalog given to every account: [name, category, muscle group, tracking type].
// Mirrors the seed in db/migrations/001_tracker.sql.
const STARTER_EXERCISES = [
  ["Back Squat", "barbell", "legs", "strength"],
  ["Bench Press", "barbell", "chest", "strength"],
  ["Deadlift", "barbell", "posterior chain", "strength"],
  ["Overhead Press", "barbell", "shoulders", "strength"],
  ["Barbell Row", "barbell", "back", "strength"],
  ["Romanian Deadlift", "barbell", "hamstrings", "strength"],
  ["Dumbbell Bench Press", "dumbbell", "chest", "strength"],
  ["Leg Press", "machine", "legs", "strength"],
  ["Pull-Up", "bodyweight", "back", "bodyweight"],
  ["Lat Pulldown", "machine", "back", "strength"],
  ["Running", "cardio", null, "distance"],
  ["Cycling", "cardio", null, "distance"],
  ["Walking", "cardio", null, "distance"],
  ["Rowing", "cardio", "full body", "distance"],
  ["Plank", "bodyweight", "core", "duration"],
];

// Creates the account and its starter catalog on first sign-in. Safe to repeat: existing rows are left alone.
async function ensureUser(sql, userId, displayName) {
  const names = STARTER_EXERCISES.map((exercise) => exercise[0]);
  const categories = STARTER_EXERCISES.map((exercise) => exercise[1]);
  const muscleGroups = STARTER_EXERCISES.map((exercise) => exercise[2]);
  const trackingTypes = STARTER_EXERCISES.map((exercise) => exercise[3]);

  await sql.transaction([
    sql`
      INSERT INTO tracker_users (id, display_name)
      VALUES (${userId}, ${String(displayName).slice(0, 80)})
      ON CONFLICT (id) DO NOTHING
    `,
    sql`
      INSERT INTO tracker_exercises (user_id, name, category, muscle_group, tracking_type)
      SELECT ${userId}, seed.name, seed.category, seed.muscle_group, seed.tracking_type
      FROM UNNEST(${names}::text[], ${categories}::text[], ${muscleGroups}::text[], ${trackingTypes}::text[])
        AS seed(name, category, muscle_group, tracking_type)
      ON CONFLICT (user_id, name) DO NOTHING
    `,
  ]);
}

module.exports = {
  OWNER_ID,
  ensureUser,
};
