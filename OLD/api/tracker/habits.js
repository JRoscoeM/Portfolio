const { getTrackerServices, noStore, OWNER_ID, requireOwner } = require("../_lib/tracker-auth");
const {
  cleanText,
  dateOnly,
  finiteNumber,
  isDate,
  isUuid,
  mapHabit,
  methodNotAllowed,
  oneQueryValue,
  readBody,
  serverError,
} = require("../_lib/tracker-api");

const TRACKING_TYPES = new Set(["boolean", "count", "duration"]);
const SCHEDULE_TYPES = new Set(["daily", "weekdays", "weekly"]);

function parseHabit(body, current = null) {
  const schedule = body.schedule && typeof body.schedule === "object" ? body.schedule : {};
  const name = body.name === undefined && current ? current.name : cleanText(body.name, 100, { required: true });
  const description = body.description === undefined && current ? current.description : cleanText(body.description, 1000);
  const color = body.color === undefined && current ? current.color : cleanText(body.color, 24);
  const icon = body.icon === undefined && current ? current.icon : cleanText(body.icon, 40);
  const trackingType = body.trackingType === undefined && current ? current.tracking_type : body.trackingType || "boolean";
  const unit = body.unit === undefined && current ? current.unit : cleanText(body.unit, 32);
  const targetInput = body.targetValue === undefined && current ? Number(current.target_value) : body.targetValue ?? 1;
  const targetValue = finiteNumber(targetInput, { minimum: 0.01, maximum: 1000000 });
  const rawScheduleType = schedule.type ?? body.scheduleType ?? body.frequencyType;
  const requestedScheduleType = rawScheduleType === "specific_days" ? "weekdays" : rawScheduleType;
  const scheduleType = requestedScheduleType === undefined && current ? current.schedule_type : requestedScheduleType || "daily";
  const rawDays = schedule.daysOfWeek ?? body.daysOfWeek;
  const daysOfWeek = rawDays === undefined && current ? current.days_of_week : rawDays || [];
  const rawTargetDays = schedule.targetDaysPerWeek ?? body.targetDaysPerWeek;
  const targetDaysInput = rawTargetDays === undefined && current ? current.target_days_per_week : rawTargetDays;
  const targetDaysPerWeek = targetDaysInput === null || targetDaysInput === undefined || targetDaysInput === ""
    ? null
    : finiteNumber(targetDaysInput, { minimum: 1, maximum: 7, integer: true });
  const startDate = body.startDate === undefined && current
    ? dateOnly(current.start_date)
    : body.startDate || null;

  if (
    !name || description === undefined || color === undefined || icon === undefined || unit === undefined ||
    !TRACKING_TYPES.has(trackingType) || targetValue === undefined ||
    !SCHEDULE_TYPES.has(scheduleType) || !Array.isArray(daysOfWeek) ||
    !daysOfWeek.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) ||
    targetDaysPerWeek === undefined || (startDate !== null && !isDate(startDate))
  ) {
    return null;
  }

  const normalizedDays = Array.from(new Set(daysOfWeek)).sort((a, b) => a - b);
  if (scheduleType === "weekdays" && normalizedDays.length === 0) {
    return null;
  }
  if (scheduleType === "weekly" && targetDaysPerWeek === null) {
    return null;
  }

  return {
    name,
    description,
    color,
    icon,
    trackingType,
    unit,
    targetValue,
    scheduleType,
    daysOfWeek: normalizedDays,
    targetDaysPerWeek: scheduleType === "weekly" ? targetDaysPerWeek : null,
    startDate,
  };
}

async function findHabit(sql, id) {
  const rows = await sql`
    SELECT id, name, description, color, icon, tracking_type, unit, target_value,
           schedule_type, days_of_week, target_days_per_week, start_date, archived_at
    FROM tracker_habits
    WHERE id = ${id}::uuid AND user_id = ${OWNER_ID}
    LIMIT 1
  `;
  return rows[0] || null;
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method)) {
    return methodNotAllowed(res, ["GET", "POST", "PATCH", "DELETE"]);
  }

  const services = getTrackerServices(res);
  if (!services || !requireOwner(req, res, services)) {
    return;
  }

  try {
    if (req.method === "GET") {
      const includeArchived = oneQueryValue(req.query && req.query.includeArchived) === "true";
      const rows = await services.sql`
        SELECT id, name, description, color, icon, tracking_type, unit, target_value,
               schedule_type, days_of_week, target_days_per_week, start_date, archived_at
        FROM tracker_habits
        WHERE user_id = ${OWNER_ID}
          AND (${includeArchived}::boolean OR archived_at IS NULL)
        ORDER BY archived_at NULLS FIRST, created_at, name
      `;
      return res.status(200).json({ habits: rows.map((row) => mapHabit(row)) });
    }

    if (req.method === "POST") {
      const body = readBody(req);
      const habit = body && parseHabit(body);
      if (!habit) {
        return res.status(400).json({ error: "Invalid habit details." });
      }
      const rows = await services.sql`
        INSERT INTO tracker_habits (
          user_id, name, description, color, icon, tracking_type, unit, target_value,
          schedule_type, days_of_week, target_days_per_week, start_date
        ) VALUES (
          ${OWNER_ID}, ${habit.name}, ${habit.description}, ${habit.color}, ${habit.icon},
          ${habit.trackingType}, ${habit.unit}, ${habit.targetValue}, ${habit.scheduleType},
          ${habit.daysOfWeek}, ${habit.targetDaysPerWeek},
          COALESCE(
            ${habit.startDate}::date,
            (NOW() AT TIME ZONE (SELECT timezone FROM tracker_users WHERE id = ${OWNER_ID}))::date
          )
        )
        RETURNING id, name, description, color, icon, tracking_type, unit, target_value,
                  schedule_type, days_of_week, target_days_per_week, start_date, archived_at
      `;
      return res.status(201).json({ habit: mapHabit(rows[0]) });
    }

    const id = oneQueryValue(req.query && req.query.id);
    if (!isUuid(id)) {
      return res.status(400).json({ error: "A valid habit id is required." });
    }
    const current = await findHabit(services.sql, id);
    if (!current) {
      return res.status(404).json({ error: "Habit not found." });
    }

    if (req.method === "DELETE") {
      await services.sql`
        UPDATE tracker_habits
        SET archived_at = NOW(), updated_at = NOW()
        WHERE id = ${id}::uuid AND user_id = ${OWNER_ID}
      `;
      return res.status(200).json({ ok: true, id, archived: true });
    }

    const body = readBody(req);
    const habit = body && parseHabit(body, current);
    if (!habit) {
      return res.status(400).json({ error: "Invalid habit details." });
    }
    const rows = await services.sql`
      UPDATE tracker_habits
      SET name = ${habit.name}, description = ${habit.description}, color = ${habit.color},
          icon = ${habit.icon}, tracking_type = ${habit.trackingType}, unit = ${habit.unit},
          target_value = ${habit.targetValue}, schedule_type = ${habit.scheduleType},
          days_of_week = ${habit.daysOfWeek}, target_days_per_week = ${habit.targetDaysPerWeek},
          start_date = ${habit.startDate}::date, updated_at = NOW()
      WHERE id = ${id}::uuid AND user_id = ${OWNER_ID}
      RETURNING id, name, description, color, icon, tracking_type, unit, target_value,
                schedule_type, days_of_week, target_days_per_week, start_date, archived_at
    `;
    return res.status(200).json({ habit: mapHabit(rows[0]) });
  } catch (error) {
    return serverError(res, "tracker habits error", error);
  }
};
