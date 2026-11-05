const { getTrackerServices, noStore, OWNER_ID, requireOwner } = require("../_lib/tracker-auth");
const {
  cleanText,
  finiteNumber,
  isDate,
  isUuid,
  mapHabitEntry,
  methodNotAllowed,
  oneQueryValue,
  readBody,
  serverError,
} = require("../_lib/tracker-api");

const ENTRY_STATUSES = new Set(["complete", "partial", "skipped"]);

module.exports = async function handler(req, res) {
  noStore(res);
  if (!["PUT", "DELETE"].includes(req.method)) {
    return methodNotAllowed(res, ["PUT", "DELETE"]);
  }

  const services = getTrackerServices(res);
  if (!services || !requireOwner(req, res, services)) {
    return;
  }

  try {
    const body = readBody(req) || {};
    const habitId = body.habitId || oneQueryValue(req.query && req.query.habitId);
    const entryDate = body.entryDate || oneQueryValue(req.query && req.query.entryDate);

    if (!isUuid(habitId) || !isDate(entryDate)) {
      return res.status(400).json({ error: "A valid habitId and entryDate are required." });
    }

    if (req.method === "DELETE") {
      const rows = await services.sql`
        DELETE FROM tracker_habit_entries
        WHERE user_id = ${OWNER_ID}
          AND habit_id = ${habitId}::uuid
          AND entry_date = ${entryDate}::date
        RETURNING id
      `;
      if (!rows.length) {
        return res.status(404).json({ error: "Habit entry not found." });
      }
      return res.status(200).json({ ok: true, habitId, entryDate });
    }

    const status = body.status || "complete";
    const parsedValue = finiteNumber(body.value, { minimum: 0, maximum: 1000000 });
    const value = body.value === undefined || body.value === null || body.value === ""
      ? status === "complete" ? 1 : status === "skipped" ? 0 : null
      : parsedValue;
    const note = cleanText(body.note, 1000);

    if (!ENTRY_STATUSES.has(status) || value === undefined || note === undefined) {
      return res.status(400).json({ error: "Invalid habit entry details." });
    }

    const rows = await services.sql`
      INSERT INTO tracker_habit_entries (
        user_id, habit_id, entry_date, value, status, note,
        target_value_snapshot, unit_snapshot, tracking_type_snapshot
      )
      SELECT
        ${OWNER_ID}, h.id, ${entryDate}::date, ${value}, ${status}, ${note},
        h.target_value, h.unit, h.tracking_type
      FROM tracker_habits h
      WHERE h.id = ${habitId}::uuid
        AND h.user_id = ${OWNER_ID}
        AND h.archived_at IS NULL
      ON CONFLICT (user_id, habit_id, entry_date)
      DO UPDATE SET
        value = EXCLUDED.value,
        status = EXCLUDED.status,
        note = EXCLUDED.note,
        target_value_snapshot = EXCLUDED.target_value_snapshot,
        unit_snapshot = EXCLUDED.unit_snapshot,
        tracking_type_snapshot = EXCLUDED.tracking_type_snapshot,
        updated_at = NOW()
      RETURNING id, habit_id, entry_date, value, status, note
    `;

    if (!rows.length) {
      return res.status(404).json({ error: "Active habit not found." });
    }
    return res.status(200).json({ entry: mapHabitEntry(rows[0]) });
  } catch (error) {
    return serverError(res, "tracker habit entry error", error);
  }
};
