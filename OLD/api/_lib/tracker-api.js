const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readBody(req) {
  if (!req.body) {
    return {};
  }
  if (typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string") {
    try {
      const parsed = JSON.parse(req.body);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_error) {
      return null;
    }
  }
  return null;
}

function oneQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isDate(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function dateOnly(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const text = String(value || "");
  return DATE_PATTERN.test(text.slice(0, 10)) ? text.slice(0, 10) : null;
}

function parseTimestamp(value) {
  if (typeof value !== "string") {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function cleanText(value, maximum, { required = false } = {}) {
  if (value === null || value === undefined) {
    return required ? undefined : null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > maximum) {
    return undefined;
  }
  return cleaned || null;
}

function finiteNumber(value, { minimum = -Infinity, maximum = Infinity, integer = false } = {}) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum || (integer && !Number.isInteger(number))) {
    return undefined;
  }
  return number;
}

function poundsToKilograms(value, unit) {
  return value === null ? null : unit === "lb" ? value * 0.45359237 : value;
}

function kilogramsToWeight(value, unit) {
  if (value === null || value === undefined) {
    return null;
  }
  const converted = unit === "lb" ? Number(value) / 0.45359237 : Number(value);
  return Math.round(converted * 1000) / 1000;
}

function distanceToMeters(value, unit) {
  if (value === null) {
    return null;
  }
  return unit === "mi" ? value * 1609.344 : value * 1000;
}

function metersToDistance(value, unit) {
  if (value === null || value === undefined) {
    return null;
  }
  const converted = unit === "mi" ? Number(value) / 1609.344 : Number(value) / 1000;
  return Math.round(converted * 1000) / 1000;
}

function methodNotAllowed(res, methods) {
  res.setHeader("Allow", methods.join(", "));
  return res.status(405).json({ error: "Method not allowed." });
}

function serverError(res, label, error) {
  console.error(label, error);
  return res.status(500).json({ error: "The tracker could not complete that request." });
}

function mapProfile(row) {
  return {
    displayName: row.display_name,
    timezone: row.timezone,
    weightUnit: row.weight_unit,
    distanceUnit: row.distance_unit,
  };
}

function exerciseTrackingTypeForApi(trackingType) {
  if (trackingType === "strength") {
    return "weight_reps";
  }
  if (trackingType === "bodyweight" || trackingType === "assisted") {
    return "reps";
  }
  return trackingType;
}

function mapExercise(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    muscleGroup: row.muscle_group,
    trackingType: exerciseTrackingTypeForApi(row.tracking_type),
  };
}

function mapHabitEntry(row) {
  return {
    id: row.id,
    habitId: row.habit_id,
    entryDate: dateOnly(row.entry_date),
    value: row.value === null ? null : Number(row.value),
    status: row.status,
    note: row.note,
  };
}

function mapHabit(row, entries = []) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    icon: row.icon,
    trackingType: row.tracking_type,
    unit: row.unit,
    targetValue: Number(row.target_value),
    scheduleType: row.schedule_type,
    frequencyType: row.schedule_type === "weekdays" ? "specific_days" : row.schedule_type,
    daysOfWeek: row.days_of_week || [],
    targetDaysPerWeek: row.target_days_per_week,
    startDate: dateOnly(row.start_date),
    archived: Boolean(row.archived_at),
    archivedAt: row.archived_at,
    entries,
  };
}

module.exports = {
  cleanText,
  dateOnly,
  distanceToMeters,
  exerciseTrackingTypeForApi,
  finiteNumber,
  isDate,
  isUuid,
  kilogramsToWeight,
  mapExercise,
  mapHabit,
  mapHabitEntry,
  mapProfile,
  methodNotAllowed,
  metersToDistance,
  oneQueryValue,
  parseTimestamp,
  poundsToKilograms,
  readBody,
  serverError,
};
