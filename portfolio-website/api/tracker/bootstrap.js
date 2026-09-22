const { getTrackerServices, noStore, OWNER_ID, requireOwner } = require("../_lib/tracker-auth");
const {
  kilogramsToWeight,
  exerciseTrackingTypeForApi,
  isDate,
  mapExercise,
  mapHabit,
  mapHabitEntry,
  mapProfile,
  methodNotAllowed,
  metersToDistance,
  oneQueryValue,
  serverError,
} = require("../_lib/tracker-api");

function routineRowsToJson(rows, profile) {
  const routines = new Map();

  for (const row of rows) {
    if (!routines.has(row.routine_id)) {
      routines.set(row.routine_id, {
        id: row.routine_id,
        name: row.routine_name,
        description: row.routine_description,
        exercises: [],
      });
    }
    if (row.routine_exercise_id) {
      routines.get(row.routine_id).exercises.push({
        id: row.routine_exercise_id,
        exerciseId: row.exercise_id,
        name: row.exercise_name,
        trackingType: exerciseTrackingTypeForApi(row.tracking_type),
        position: row.position,
        notes: row.notes,
        targetSets: row.target_sets,
        targetRepsMin: row.target_reps_min,
        targetRepsMax: row.target_reps_max,
        targetWeight: kilogramsToWeight(row.target_weight_kg, profile.weight_unit),
        targetDurationSeconds: row.target_duration_seconds,
        targetDistance: metersToDistance(row.target_distance_meters, profile.distance_unit),
        restSeconds: row.target_rest_seconds,
      });
    }
  }
  return Array.from(routines.values());
}

function workoutSummary(row, profile) {
  return {
    id: row.id,
    routineId: row.routine_id,
    name: row.name,
    notes: row.notes,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    endedAt: row.completed_at,
    durationSeconds: Number(row.duration_seconds),
    exerciseCount: Number(row.exercise_count),
    setCount: Number(row.set_count),
    volume: kilogramsToWeight(row.volume_kg, profile.weight_unit),
    totalVolume: kilogramsToWeight(row.volume_kg, profile.weight_unit),
    volumeUnit: profile.weight_unit,
    distance: metersToDistance(row.distance_meters, profile.distance_unit),
    distanceUnit: profile.distance_unit,
  };
}

function workoutDetailsById(rows, profile) {
  const workouts = new Map();
  for (const row of rows) {
    if (!workouts.has(row.workout_id)) {
      workouts.set(row.workout_id, new Map());
    }
    const exercises = workouts.get(row.workout_id);
    if (!exercises.has(row.workout_exercise_id)) {
      exercises.set(row.workout_exercise_id, {
        id: row.workout_exercise_id,
        exerciseId: row.exercise_id,
        name: row.exercise_name_snapshot,
        trackingType: exerciseTrackingTypeForApi(row.tracking_type_snapshot),
        position: row.exercise_position,
        notes: row.exercise_notes,
        sets: [],
      });
    }
    if (row.set_id) {
      exercises.get(row.workout_exercise_id).sets.push({
        id: row.set_id,
        position: row.set_number,
        setType: row.set_type,
        reps: row.reps,
        weight: kilogramsToWeight(row.weight_kg, profile.weight_unit),
        weightUnit: profile.weight_unit,
        durationSeconds: row.duration_seconds,
        distance: metersToDistance(row.distance_meters, profile.distance_unit),
        distanceUnit: profile.distance_unit,
        rpe: row.rpe === null ? null : Number(row.rpe),
        completed: row.is_completed,
      });
    }
  }

  return new Map(
    Array.from(workouts, ([workoutId, exercises]) => [workoutId, Array.from(exercises.values())])
  );
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const services = getTrackerServices(res);
  if (!services || !requireOwner(req, res, services)) {
    return;
  }

  try {
    const requestedFrom = oneQueryValue(req.query && req.query.from);
    const defaultFrom = new Date(Date.now() - 89 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const from = isDate(requestedFrom) ? requestedFrom : defaultFrom;

    const profileRows = await services.sql`
      SELECT display_name, timezone, weight_unit, distance_unit
      FROM tracker_users
      WHERE id = ${OWNER_ID}
      LIMIT 1
    `;
    if (!profileRows.length) {
      return res.status(500).json({ error: "Tracker owner profile is missing. Run the tracker migration." });
    }
    const profileRow = profileRows[0];

    const [habitRows, entryRows, exerciseRows, routineRows, workoutRows] = await Promise.all([
      services.sql`
        SELECT id, name, description, color, icon, tracking_type, unit, target_value,
               schedule_type, days_of_week, target_days_per_week, start_date, archived_at
        FROM tracker_habits
        WHERE user_id = ${OWNER_ID}
        ORDER BY archived_at NULLS FIRST, created_at, name
      `,
      services.sql`
        SELECT e.id, e.habit_id, e.entry_date, e.value, e.status, e.note
        FROM tracker_habit_entries e
        JOIN tracker_habits h ON h.id = e.habit_id AND h.user_id = e.user_id
        WHERE e.user_id = ${OWNER_ID}
          AND e.entry_date >= ${from}::date
        ORDER BY e.entry_date DESC
      `,
      services.sql`
        SELECT id, name, category, muscle_group, tracking_type
        FROM tracker_exercises
        WHERE user_id = ${OWNER_ID} AND is_archived = FALSE
        ORDER BY category, name
      `,
      services.sql`
        SELECT r.id AS routine_id, r.name AS routine_name, r.description AS routine_description,
               re.id AS routine_exercise_id, re.exercise_id, re.position, re.notes,
               re.target_sets, re.target_reps_min, re.target_reps_max,
               re.target_weight_kg, re.target_duration_seconds, re.target_distance_meters,
               re.target_rest_seconds,
               e.name AS exercise_name, e.tracking_type
        FROM tracker_routines r
        LEFT JOIN tracker_routine_exercises re
          ON re.routine_id = r.id AND re.user_id = r.user_id
        LEFT JOIN tracker_exercises e
          ON e.id = re.exercise_id AND e.user_id = re.user_id
        WHERE r.user_id = ${OWNER_ID} AND r.is_archived = FALSE
        ORDER BY r.created_at, re.position
      `,
      services.sql`
        SELECT w.id, w.routine_id, w.name, w.notes, w.started_at, w.completed_at,
               EXTRACT(EPOCH FROM (w.completed_at - w.started_at))::integer AS duration_seconds,
               COUNT(DISTINCT we.id)::integer AS exercise_count,
               COUNT(ws.id)::integer AS set_count,
               COALESCE(SUM(ws.weight_kg * ws.reps) FILTER (WHERE ws.is_completed), 0) AS volume_kg,
               COALESCE(SUM(ws.distance_meters) FILTER (WHERE ws.is_completed), 0) AS distance_meters
        FROM tracker_workouts w
        LEFT JOIN tracker_workout_exercises we
          ON we.workout_id = w.id AND we.user_id = w.user_id
        LEFT JOIN tracker_workout_sets ws
          ON ws.workout_exercise_id = we.id AND ws.user_id = we.user_id
        WHERE w.user_id = ${OWNER_ID}
        GROUP BY w.id
        ORDER BY w.completed_at DESC
        LIMIT 12
      `,
    ]);

    const entriesByHabit = new Map();
    for (const row of entryRows) {
      if (!entriesByHabit.has(row.habit_id)) {
        entriesByHabit.set(row.habit_id, []);
      }
      entriesByHabit.get(row.habit_id).push(mapHabitEntry(row));
    }

    const workoutIds = workoutRows.map((row) => row.id);
    let workoutDetailRows = [];
    if (workoutIds.length) {
      workoutDetailRows = await services.sql`
        SELECT we.workout_id, we.id AS workout_exercise_id, we.exercise_id,
               we.position AS exercise_position, we.exercise_name_snapshot,
               we.tracking_type_snapshot, we.notes AS exercise_notes,
               ws.id AS set_id, ws.set_number, ws.set_type, ws.reps, ws.weight_kg,
               ws.duration_seconds, ws.distance_meters, ws.rpe, ws.is_completed
        FROM tracker_workout_exercises we
        LEFT JOIN tracker_workout_sets ws
          ON ws.workout_exercise_id = we.id AND ws.user_id = we.user_id
        WHERE we.user_id = ${OWNER_ID} AND we.workout_id = ANY(${workoutIds}::uuid[])
        ORDER BY we.workout_id, we.position, ws.set_number
      `;
    }
    const detailsByWorkout = workoutDetailsById(workoutDetailRows, profileRow);

    return res.status(200).json({
      profile: mapProfile(profileRow),
      habits: habitRows.map((row) => mapHabit(row, entriesByHabit.get(row.id) || [])),
      routines: routineRowsToJson(routineRows, profileRow),
      exercises: exerciseRows.map(mapExercise),
      workouts: workoutRows.map((row) => ({
        ...workoutSummary(row, profileRow),
        exercises: detailsByWorkout.get(row.id) || [],
      })),
    });
  } catch (error) {
    return serverError(res, "tracker bootstrap error", error);
  }
};
