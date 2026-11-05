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
  poundsToKilograms,
  readBody,
  serverError,
} = require("../_lib/tracker-api");

function rowsToRoutines(rows, profile) {
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

async function loadRoutines(sql, routineId = null) {
  return sql`
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
    WHERE r.user_id = ${OWNER_ID}
      AND r.is_archived = FALSE
      AND (${routineId}::uuid IS NULL OR r.id = ${routineId}::uuid)
    ORDER BY r.created_at, re.position
  `;
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
      const rows = await loadRoutines(services.sql);
      return res.status(200).json({ routines: rowsToRoutines(rows, profile) });
    }

    const body = readBody(req);
    const name = body && cleanText(body.name, 100, { required: true });
    const description = body && cleanText(body.description, 1000);
    const exercises = body && body.exercises;
    if (!body || !name || description === undefined ||
        !Array.isArray(exercises) || exercises.length > 40) {
      return res.status(400).json({ error: "Invalid routine details." });
    }

    const parsedExercises = [];
    const positions = new Set();
    for (let index = 0; index < exercises.length; index += 1) {
      const item = exercises[index];
      if (!item || typeof item !== "object") {
        return res.status(400).json({ error: `Invalid routine exercise at position ${index + 1}.` });
      }
      const targetSets = finiteNumber(item.targetSets, { minimum: 1, maximum: 30, integer: true });
      const targetRepsMin = finiteNumber(item.targetRepsMin ?? item.targetReps, { minimum: 0, maximum: 1000, integer: true });
      const targetRepsMax = finiteNumber(item.targetRepsMax ?? item.targetReps, { minimum: 0, maximum: 1000, integer: true });
      const targetWeight = finiteNumber(item.targetWeight, { minimum: 0, maximum: 100000 });
      const targetDurationSeconds = finiteNumber(item.targetDurationSeconds, { minimum: 0, maximum: 604800, integer: true });
      const targetDistance = finiteNumber(item.targetDistance, { minimum: 0, maximum: 100000 });
      const targetRestSeconds = finiteNumber(item.restSeconds, { minimum: 0, maximum: 3600, integer: true });
      const position = finiteNumber(item.position ?? index + 1, { minimum: 1, maximum: 100, integer: true });
      const notes = cleanText(item.notes, 1000);

      if (!isUuid(item.exerciseId) || targetSets === undefined || targetRepsMin === undefined ||
          targetRepsMax === undefined || targetWeight === undefined || targetDurationSeconds === undefined ||
          targetDistance === undefined || targetRestSeconds === undefined || position === undefined || positions.has(position) ||
          notes === undefined ||
          (targetRepsMin !== null && targetRepsMax !== null && targetRepsMin > targetRepsMax)) {
        return res.status(400).json({ error: `Invalid routine exercise at position ${index + 1}.` });
      }
      positions.add(position);

      parsedExercises.push({
        id: crypto.randomUUID(),
        exerciseId: item.exerciseId,
        position,
        notes,
        targetSets,
        targetRepsMin,
        targetRepsMax,
        targetWeightKg: poundsToKilograms(targetWeight, profile.weight_unit),
        targetDurationSeconds,
        targetDistanceMeters: distanceToMeters(targetDistance, profile.distance_unit),
        targetRestSeconds,
      });
    }

    const exerciseIds = Array.from(new Set(parsedExercises.map((item) => item.exerciseId)));
    if (exerciseIds.length) {
      const availableRows = await services.sql`
        SELECT id
        FROM tracker_exercises
        WHERE user_id = ${OWNER_ID} AND is_archived = FALSE AND id = ANY(${exerciseIds}::uuid[])
      `;
      if (availableRows.length !== exerciseIds.length) {
        return res.status(400).json({ error: "One or more exercises are unavailable." });
      }
    }

    const routineId = crypto.randomUUID();
    const queries = [
      services.sql`
        INSERT INTO tracker_routines (id, user_id, name, description)
        VALUES (${routineId}::uuid, ${OWNER_ID}, ${name}, ${description})
      `,
      ...parsedExercises.map((item) => services.sql`
        INSERT INTO tracker_routine_exercises (
          id, user_id, routine_id, exercise_id, position, notes, target_sets,
          target_reps_min, target_reps_max, target_weight_kg,
          target_duration_seconds, target_distance_meters, target_rest_seconds
        ) VALUES (
          ${item.id}::uuid, ${OWNER_ID}, ${routineId}::uuid, ${item.exerciseId}::uuid,
          ${item.position}, ${item.notes}, ${item.targetSets}, ${item.targetRepsMin},
          ${item.targetRepsMax}, ${item.targetWeightKg}, ${item.targetDurationSeconds},
          ${item.targetDistanceMeters}, ${item.targetRestSeconds}
        )
      `),
    ];
    await services.sql.transaction(queries);

    const rows = await loadRoutines(services.sql, routineId);
    return res.status(201).json({ routine: rowsToRoutines(rows, profile)[0] });
  } catch (error) {
    if (error && error.code === "23505") {
      return res.status(409).json({ error: "A routine with that name already exists." });
    }
    return serverError(res, "tracker routines error", error);
  }
};
