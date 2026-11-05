const crypto = require("node:crypto");
const { getTrackerServices, noStore, OWNER_ID, requireOwner } = require("../_lib/tracker-auth");
const {
  cleanText,
  distanceToMeters,
  exerciseTrackingTypeForApi,
  finiteNumber,
  isUuid,
  kilogramsToWeight,
  methodNotAllowed,
  metersToDistance,
  oneQueryValue,
  parseTimestamp,
  poundsToKilograms,
  readBody,
  serverError,
} = require("../_lib/tracker-api");

const SET_TYPES = new Set(["warmup", "working", "drop", "failure", "cooldown"]);
const WEIGHT_UNITS = new Set(["lb", "kg"]);
const DISTANCE_UNITS = new Set(["mi", "km"]);

function mapSummary(row, profile) {
  return {
    id: row.id,
    routineId: row.routine_id,
    name: row.name,
    notes: row.notes,
    startedAt: row.started_at,
    endedAt: row.completed_at,
    completedAt: row.completed_at,
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

async function loadSummaries(sql, profile, limit, id = null) {
  const rows = await sql`
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
      AND (${id}::uuid IS NULL OR w.id = ${id}::uuid)
    GROUP BY w.id
    ORDER BY w.completed_at DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => mapSummary(row, profile));
}

async function loadWorkout(sql, profile, id) {
  const summaries = await loadSummaries(sql, profile, 1, id);
  if (!summaries.length) {
    return null;
  }

  const rows = await sql`
    SELECT we.id AS workout_exercise_id, we.exercise_id, we.position AS exercise_position,
           we.exercise_name_snapshot, we.tracking_type_snapshot, we.notes AS exercise_notes,
           ws.id AS set_id, ws.set_number, ws.set_type, ws.reps, ws.weight_kg,
           ws.duration_seconds, ws.distance_meters, ws.rpe, ws.is_completed,
           w.weight_unit_snapshot, w.distance_unit_snapshot
    FROM tracker_workout_exercises we
    JOIN tracker_workouts w ON w.id = we.workout_id AND w.user_id = we.user_id
    LEFT JOIN tracker_workout_sets ws
      ON ws.workout_exercise_id = we.id AND ws.user_id = we.user_id
    WHERE we.workout_id = ${id}::uuid AND we.user_id = ${OWNER_ID}
    ORDER BY we.position, ws.set_number
  `;

  const exercises = new Map();
  for (const row of rows) {
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
        weight: kilogramsToWeight(row.weight_kg, row.weight_unit_snapshot),
        weightUnit: row.weight_unit_snapshot,
        durationSeconds: row.duration_seconds,
        distance: metersToDistance(row.distance_meters, row.distance_unit_snapshot),
        distanceUnit: row.distance_unit_snapshot,
        rpe: row.rpe === null ? null : Number(row.rpe),
        completed: row.is_completed,
      });
    }
  }

  return { ...summaries[0], exercises: Array.from(exercises.values()) };
}

function parseSet(raw, fallbackPosition, profile) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const position = finiteNumber(raw.position ?? raw.setNumber ?? fallbackPosition, { minimum: 1, maximum: 100, integer: true });
  const setType = raw.setType || "working";
  const reps = finiteNumber(raw.reps, { minimum: 0, maximum: 10000, integer: true });
  const weight = finiteNumber(raw.weight, { minimum: 0, maximum: 100000 });
  const durationSeconds = finiteNumber(raw.durationSeconds, { minimum: 0, maximum: 604800, integer: true });
  const distance = finiteNumber(raw.distance, { minimum: 0, maximum: 100000 });
  const rpe = finiteNumber(raw.rpe, { minimum: 0, maximum: 10 });
  const completed = raw.completed === undefined ? true : raw.completed;
  const weightUnit = raw.weightUnit || profile.weight_unit;
  const distanceUnit = raw.distanceUnit || profile.distance_unit;

  if (position === undefined || !SET_TYPES.has(setType) || reps === undefined || weight === undefined ||
      durationSeconds === undefined || distance === undefined || rpe === undefined ||
      typeof completed !== "boolean" || !WEIGHT_UNITS.has(weightUnit) || !DISTANCE_UNITS.has(distanceUnit) ||
      (reps === null && weight === null && durationSeconds === null && distance === null)) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    position,
    setType,
    reps,
    weightKg: poundsToKilograms(weight, weightUnit),
    durationSeconds,
    distanceMeters: distanceToMeters(distance, distanceUnit),
    rpe,
    completed,
  };
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (!["GET", "POST"].includes(req.method)) {
    return methodNotAllowed(res, ["GET", "POST"]);
  }

  const services = getTrackerServices(res);
  if (!services || !requireOwner(req, res, services)) {
    return;
  }

  try {
    const profileRows = await services.sql`
      SELECT weight_unit, distance_unit
      FROM tracker_users
      WHERE id = ${OWNER_ID}
      LIMIT 1
    `;
    if (!profileRows.length) {
      return res.status(500).json({ error: "Tracker owner profile is missing. Run the tracker migration." });
    }
    const profile = profileRows[0];

    if (req.method === "GET") {
      const id = oneQueryValue(req.query && req.query.id);
      if (id !== undefined) {
        if (!isUuid(id)) {
          return res.status(400).json({ error: "A valid workout id is required." });
        }
        const workout = await loadWorkout(services.sql, profile, id);
        return workout
          ? res.status(200).json({ workout })
          : res.status(404).json({ error: "Workout not found." });
      }
      const requestedLimit = finiteNumber(oneQueryValue(req.query && req.query.limit) ?? 20, {
        minimum: 1,
        maximum: 50,
        integer: true,
      });
      if (requestedLimit === undefined) {
        return res.status(400).json({ error: "Invalid history limit." });
      }
      const workouts = await loadSummaries(services.sql, profile, requestedLimit);
      return res.status(200).json({ workouts });
    }

    const body = readBody(req);
    const name = body && cleanText(body.name, 100, { required: true });
    const notes = body && cleanText(body.notes, 2000);
    const startedAt = body && parseTimestamp(body.startedAt);
    const endedAt = body && parseTimestamp(body.endedAt || body.completedAt);
    const routineId = body && (body.routineId || null);
    const exercises = body && body.exercises;

    if (!body || !name || notes === undefined ||
        !startedAt || !endedAt || new Date(endedAt) < new Date(startedAt) ||
        (routineId !== null && !isUuid(routineId)) || !Array.isArray(exercises) ||
        exercises.length < 1 || exercises.length > 40) {
      return res.status(400).json({ error: "Invalid completed workout details." });
    }

    if (routineId) {
      const routineRows = await services.sql`
        SELECT id FROM tracker_routines
        WHERE id = ${routineId}::uuid AND user_id = ${OWNER_ID} AND is_archived = FALSE
        LIMIT 1
      `;
      if (!routineRows.length) {
        return res.status(400).json({ error: "Routine is unavailable." });
      }
    }

    const parsedExercises = [];
    const exercisePositions = new Set();
    for (let index = 0; index < exercises.length; index += 1) {
      const item = exercises[index];
      const position = item && finiteNumber(item.position ?? index + 1, { minimum: 1, maximum: 100, integer: true });
      const exerciseNotes = item && cleanText(item.notes, 1000);
      if (!item || !isUuid(item.exerciseId) || position === undefined || exercisePositions.has(position) ||
          exerciseNotes === undefined ||
          !Array.isArray(item.sets) || item.sets.length < 1 || item.sets.length > 50) {
        return res.status(400).json({ error: `Invalid workout exercise at position ${index + 1}.` });
      }
      exercisePositions.add(position);

      const sets = item.sets.map((set, setIndex) => parseSet(set, setIndex + 1, profile));
      const setPositions = new Set(sets.filter(Boolean).map((set) => set.position));
      if (sets.some((set) => !set) || setPositions.size !== sets.length) {
        return res.status(400).json({ error: `Invalid set data for workout exercise at position ${position}.` });
      }
      parsedExercises.push({
        id: crypto.randomUUID(),
        exerciseId: item.exerciseId,
        position,
        notes: exerciseNotes,
        sets,
      });
    }

    const exerciseIds = Array.from(new Set(parsedExercises.map((item) => item.exerciseId)));
    const catalogRows = await services.sql`
      SELECT id, name, tracking_type
      FROM tracker_exercises
      WHERE user_id = ${OWNER_ID} AND is_archived = FALSE AND id = ANY(${exerciseIds}::uuid[])
    `;
    if (catalogRows.length !== exerciseIds.length) {
      return res.status(400).json({ error: "One or more exercises are unavailable." });
    }
    const catalog = new Map(catalogRows.map((row) => [row.id, row]));

    const workoutId = crypto.randomUUID();
    const queries = [
      services.sql`
        INSERT INTO tracker_workouts (
          id, user_id, routine_id, name, notes, started_at, completed_at,
          weight_unit_snapshot, distance_unit_snapshot
        ) VALUES (
          ${workoutId}::uuid, ${OWNER_ID}, ${routineId}::uuid, ${name}, ${notes},
          ${startedAt}::timestamptz, ${endedAt}::timestamptz,
          ${profile.weight_unit}, ${profile.distance_unit}
        )
      `,
      ...parsedExercises.map((item) => {
        const definition = catalog.get(item.exerciseId);
        return services.sql`
          INSERT INTO tracker_workout_exercises (
            id, user_id, workout_id, exercise_id, position,
            exercise_name_snapshot, tracking_type_snapshot, notes
          ) VALUES (
            ${item.id}::uuid, ${OWNER_ID}, ${workoutId}::uuid, ${item.exerciseId}::uuid,
            ${item.position}, ${definition.name}, ${definition.tracking_type}, ${item.notes}
          )
        `;
      }),
      ...parsedExercises.flatMap((item) => item.sets.map((set) => services.sql`
        INSERT INTO tracker_workout_sets (
          id, user_id, workout_exercise_id, set_number, set_type, reps,
          weight_kg, duration_seconds, distance_meters, rpe, is_completed
        ) VALUES (
          ${set.id}::uuid, ${OWNER_ID}, ${item.id}::uuid, ${set.position}, ${set.setType},
          ${set.reps}, ${set.weightKg}, ${set.durationSeconds}, ${set.distanceMeters},
          ${set.rpe}, ${set.completed}
        )
      `)),
    ];
    await services.sql.transaction(queries);

    const workout = await loadWorkout(services.sql, profile, workoutId);
    return res.status(201).json({ workout });
  } catch (error) {
    return serverError(res, "tracker workouts error", error);
  }
};
