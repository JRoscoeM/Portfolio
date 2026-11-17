const { getTrackerServices, noStore, requireUser } = require("../_lib/tracker-auth");
const {
  cleanText,
  mapExercise,
  methodNotAllowed,
  readBody,
  serverError,
} = require("../_lib/tracker-api");

// The client speaks in logging styles; the database stores the exercise kind.
const TRACKING_TYPES_FROM_API = {
  weight_reps: "strength",
  reps: "bodyweight",
  duration: "duration",
  distance: "distance",
};

function parseExercise(body) {
  const name = cleanText(body.name, 100, { required: true });
  const category = cleanText(body.category, 40, { required: true });
  const muscleGroup = cleanText(body.muscleGroup, 40);
  const trackingType = TRACKING_TYPES_FROM_API[body.trackingType || "weight_reps"];
  if (!name || !category || muscleGroup === undefined || !trackingType) {
    return null;
  }
  return { name, category: category.toLowerCase(), muscleGroup: muscleGroup && muscleGroup.toLowerCase(), trackingType };
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (!["GET", "POST"].includes(req.method)) {
    return methodNotAllowed(res, ["GET", "POST"]);
  }

  const services = getTrackerServices(res);
  const userId = services && requireUser(req, res, services);
  if (!userId) {
    return;
  }

  try {
    if (req.method === "GET") {
      const rows = await services.sql`
        SELECT id, name, category, muscle_group, tracking_type
        FROM tracker_exercises
        WHERE user_id = ${userId} AND is_archived = FALSE
        ORDER BY category, name
      `;
      return res.status(200).json({ exercises: rows.map(mapExercise) });
    }

    const body = readBody(req);
    const exercise = body && parseExercise(body);
    if (!exercise) {
      return res.status(400).json({ error: "Give the exercise a name, category, and tracking type." });
    }

    const existing = await services.sql`
      SELECT id, name, category, muscle_group, tracking_type, is_archived
      FROM tracker_exercises
      WHERE user_id = ${userId} AND LOWER(name) = LOWER(${exercise.name})
      LIMIT 1
    `;
    if (existing.length && !existing[0].is_archived) {
      return res.status(409).json({ error: `${existing[0].name} is already in your library.`, exercise: mapExercise(existing[0]) });
    }
    if (existing.length) {
      // Bring a previously archived exercise back rather than colliding with its name.
      const rows = await services.sql`
        UPDATE tracker_exercises
        SET is_archived = FALSE, category = ${exercise.category}, muscle_group = ${exercise.muscleGroup},
            tracking_type = ${exercise.trackingType}, updated_at = NOW()
        WHERE id = ${existing[0].id}::uuid AND user_id = ${userId}
        RETURNING id, name, category, muscle_group, tracking_type
      `;
      return res.status(200).json({ exercise: mapExercise(rows[0]) });
    }

    const rows = await services.sql`
      INSERT INTO tracker_exercises (user_id, name, category, muscle_group, tracking_type)
      VALUES (${userId}, ${exercise.name}, ${exercise.category}, ${exercise.muscleGroup}, ${exercise.trackingType})
      RETURNING id, name, category, muscle_group, tracking_type
    `;
    return res.status(201).json({ exercise: mapExercise(rows[0]) });
  } catch (error) {
    if (error && error.code === "23505") {
      return res.status(409).json({ error: "An exercise with that name already exists." });
    }
    return serverError(res, "tracker exercises error", error);
  }
};
