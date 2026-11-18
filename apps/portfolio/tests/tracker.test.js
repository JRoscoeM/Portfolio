const test = require("node:test");
const assert = require("node:assert/strict");

// Stand-in for the Neon client so tests never open a database connection. It records every query's
// parameters and answers with whatever rows the test queued (default: none).
const database = { queries: [], results: [] };
function fakeSql(_strings, ...values) {
  database.queries.push(values);
  return Promise.resolve(database.results.shift() || []);
}
fakeSql.transaction = (queries) => Promise.all(queries);
const dbPath = require.resolve("../api/_lib/db");
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { getSql: () => (process.env.DATABASE_URL ? fakeSql : null) },
};

const fs = require("node:fs");
const path = require("node:path");
const { STARTER_EXERCISES } = require("../api/_lib/tracker-users");
const authHandler = require("../api/tracker/auth");
const habitsHandler = require("../api/tracker/habits");
const exercisesHandler = require("../api/tracker/exercises");
const routinesHandler = require("../api/tracker/routines");
const {
  distanceToMeters,
  isDate,
  kilogramsToWeight,
  metersToDistance,
  poundsToKilograms,
} = require("../api/_lib/tracker-api");

function createResponse() {
  return {
    body: null,
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    end() {
      return this;
    },
  };
}

function cookieHeader(setCookie) {
  return setCookie.split(";", 1)[0];
}

test("weight and distance conversions round-trip in owner display units", () => {
  const kilograms = poundsToKilograms(225, "lb");
  assert.ok(Math.abs(kilogramsToWeight(kilograms, "lb") - 225) < 0.001);

  const meters = distanceToMeters(3.1, "mi");
  assert.ok(Math.abs(metersToDistance(meters, "mi") - 3.1) < 0.001);
});

test("weights read back exactly after being stored as kilograms to 3 decimals", () => {
  // Mirrors the NUMERIC(10, 3) weight_kg column.
  const stored = (pounds) => Math.round(poundsToKilograms(pounds, "lb") * 1000) / 1000;
  for (const pounds of [50, 55, 60, 135, 225, 2.5, 52.5, 47.25, 12.34, 999.99]) {
    assert.equal(kilogramsToWeight(stored(pounds), "lb"), pounds);
  }
  for (let pounds = 0; pounds <= 1000; pounds += 0.25) {
    assert.equal(kilogramsToWeight(stored(pounds), "lb"), pounds, `${pounds} lb`);
  }
  assert.equal(kilogramsToWeight(1.125, "kg"), 1.125, "kilograms keep their stored precision");
});

test("date validation rejects impossible and malformed dates", () => {
  assert.equal(isDate("2026-09-21"), true);
  assert.equal(isDate("2026-02-30"), false);
  assert.equal(isDate("09/21/2026"), false);
});

const TEST_ENV = {
  DATABASE_URL: "postgresql://user:pass@example.com/tracker?sslmode=require",
  TRACKER_SESSION_SECRET: "test-session-secret-with-more-than-32-bytes",
  TRACKER_PUBLIC_ORIGIN: "https://tracker.example",
  TRACKER_GOOGLE_CLIENT_ID: "google-client-id",
  TRACKER_GOOGLE_CLIENT_SECRET: "google-client-secret",
  TRACKER_OWNER_GOOGLE_EMAIL: "owner@example.com",
};

// Swaps process.env for the duration of one test.
function useEnvironment(t, environment) {
  const original = process.env;
  process.env = environment;
  t.after(() => {
    process.env = original;
  });
}

function useTestEnvironment(t) {
  useEnvironment(t, { ...process.env, ...TEST_ENV });
  database.queries = [];
  database.results = [];
}

function mockProvider(t, profile) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url: String(url), options });
    const body = /\/token$|\/access_token$/.test(String(url)) ? { access_token: "provider-access-token" } : profile;
    return { ok: true, status: 200, json: async () => body };
  });
  return calls;
}

async function startSignIn() {
  const response = createResponse();
  await authHandler({ method: "GET", query: { provider: "google" }, headers: {} }, response);
  const location = new URL(response.headers.location);
  return { response, location, stateCookie: cookieHeader(response.headers["set-cookie"][0]) };
}

async function finishSignIn(stateCookie, query) {
  const response = createResponse();
  await authHandler({ method: "GET", query, headers: { cookie: stateCookie } }, response);
  return response;
}

// Runs the whole flow for one provider profile and returns the session cookie it was given.
async function signInAs(t, profile) {
  mockProvider(t, profile);
  const { location, stateCookie } = await startSignIn();
  const response = await finishSignIn(stateCookie, { code: "auth-code", state: location.searchParams.get("state") });
  assert.equal(response.headers.location, "/tracker/");
  return cookieHeader(response.headers["set-cookie"][0]);
}

test("OAuth sign-in creates a session that authenticates and logs out", async (t) => {
  useTestEnvironment(t);
  const calls = mockProvider(t, { sub: "1001", email: "Owner@Example.com", email_verified: true });

  const { response: startResponse, location, stateCookie } = await startSignIn();
  assert.equal(startResponse.statusCode, 302);
  assert.equal(location.origin, "https://accounts.google.com");
  assert.equal(location.searchParams.get("client_id"), "google-client-id");
  assert.equal(location.searchParams.get("redirect_uri"), "https://tracker.example/api/tracker/auth");
  assert.equal(location.searchParams.get("code_challenge_method"), "S256");
  assert.match(startResponse.headers["set-cookie"][0], /HttpOnly; SameSite=Lax/);

  const callbackResponse = await finishSignIn(stateCookie, {
    code: "auth-code",
    state: location.searchParams.get("state"),
  });
  assert.equal(callbackResponse.statusCode, 302);
  assert.equal(callbackResponse.headers.location, "/tracker/");
  const [sessionSetCookie, clearedState] = callbackResponse.headers["set-cookie"];
  assert.match(sessionSetCookie, /HttpOnly/);
  assert.match(sessionSetCookie, /SameSite=Strict/);
  assert.match(clearedState, /^tracker_oauth_state=;.*Max-Age=0/);

  const tokenRequest = new URLSearchParams(calls[0].options.body);
  assert.equal(tokenRequest.get("code"), "auth-code");
  assert.equal(tokenRequest.get("client_secret"), "google-client-secret");
  assert.ok(tokenRequest.get("code_verifier"));
  assert.equal(calls[1].options.headers.Authorization, "Bearer provider-access-token");

  const sessionCookie = cookieHeader(sessionSetCookie);
  const statusResponse = createResponse();
  await authHandler({ method: "GET", headers: { cookie: sessionCookie } }, statusResponse);
  assert.deepEqual(statusResponse.body, { authenticated: true, providers: ["google"] });

  const logoutResponse = createResponse();
  await authHandler({ method: "DELETE", headers: { cookie: sessionCookie } }, logoutResponse);
  assert.equal(logoutResponse.body.authenticated, false);
  assert.match(logoutResponse.headers["set-cookie"], /Max-Age=0/);
});

// The id each sign-in was provisioned under is the first parameter of the account-creation queries.
function provisionedUserIds() {
  return Array.from(new Set(database.queries.map((values) => values[0])));
}

test("the configured owner account keeps the original owner data", async (t) => {
  useTestEnvironment(t);
  await signInAs(t, { sub: "1001", email: "owner@example.com", email_verified: true });
  assert.deepEqual(provisionedUserIds(), ["owner"]);
});

test("any other account, or an unverified owner address, gets its own separate account", async (t) => {
  useTestEnvironment(t);
  await signInAs(t, { sub: "2002", email: "someone-else@example.com", email_verified: true });
  assert.deepEqual(provisionedUserIds(), ["google:2002"]);

  database.queries = [];
  await signInAs(t, { sub: "3003", email: "owner@example.com", email_verified: false });
  assert.deepEqual(provisionedUserIds(), ["google:3003"]);
});

test("the GitHub owner is matched by numeric account id, never by login", async (t) => {
  useEnvironment(t, {
    ...process.env,
    ...TEST_ENV,
    TRACKER_GITHUB_CLIENT_ID: "github-client-id",
    TRACKER_GITHUB_CLIENT_SECRET: "github-client-secret",
    TRACKER_OWNER_GITHUB_ID: "4242",
  });

  async function signInWithGitHub(profile) {
    database.queries = [];
    mockProvider(t, profile);
    const start = createResponse();
    await authHandler({ method: "GET", query: { provider: "github" }, headers: {} }, start);
    const state = new URL(start.headers.location).searchParams.get("state");
    await finishSignIn(cookieHeader(start.headers["set-cookie"][0]), { code: "auth-code", state });
    return provisionedUserIds();
  }

  assert.deepEqual(await signInWithGitHub({ id: 4242, login: "renamed-since" }), ["owner"]);
  // Someone who registers the owner's id as an all-digit login is still a different account.
  assert.deepEqual(await signInWithGitHub({ id: 9001, login: "4242" }), ["github:9001"]);
});

test("the starter exercise catalog matches the migration seed", () => {
  const migration = fs.readFileSync(path.join(__dirname, "../db/migrations/001_tracker.sql"), "utf8");
  const seedStatement = migration.slice(migration.indexOf("INSERT INTO tracker_exercises"));
  const seeded = Array.from(
    seedStatement.matchAll(/\('owner', '([^']+)', '([^']+)', (?:'([^']+)'|NULL), '([^']+)'\)/g),
    (match) => [match[1], match[2], match[3] ?? null, match[4]]
  );
  assert.deepEqual(STARTER_EXERCISES, seeded);
});

test("data routes only query the signed-in user's rows", async (t) => {
  useTestEnvironment(t);
  const sessionCookie = await signInAs(t, { sub: "2002", email: "someone-else@example.com", email_verified: true });

  database.queries = [];
  const response = createResponse();
  await habitsHandler({ method: "GET", query: {}, headers: { cookie: sessionCookie } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(database.queries.length, 1);
  assert.ok(database.queries[0].includes("google:2002"));
  assert.ok(!database.queries[0].includes("owner"));

  const anonymous = createResponse();
  await habitsHandler({ method: "GET", query: {}, headers: {} }, anonymous);
  assert.equal(anonymous.statusCode, 401);
  assert.equal(database.queries.length, 1);
});

test("a custom exercise is added to the signed-in user's library", async (t) => {
  useTestEnvironment(t);
  const sessionCookie = await signInAs(t, { sub: "3003", email: "lifter@example.com", email_verified: true });
  const headers = { cookie: sessionCookie };

  database.queries = [];
  database.results = [[], [{ id: "11111111-1111-4111-8111-111111111111", name: "Chest Press", category: "machine", muscle_group: "chest", tracking_type: "strength" }]];
  const created = createResponse();
  await exercisesHandler({ method: "POST", headers, body: { name: "Chest Press", category: "Machine", muscleGroup: "Chest", trackingType: "weight_reps" } }, created);
  assert.equal(created.statusCode, 201);
  assert.deepEqual(created.body.exercise, {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Chest Press",
    category: "machine",
    muscleGroup: "chest",
    trackingType: "weight_reps",
  });
  assert.deepEqual(database.queries[1], ["google:3003", "Chest Press", "machine", "chest", "strength"]);

  database.results = [[{ id: "11111111-1111-4111-8111-111111111111", name: "Chest Press", category: "machine", muscle_group: "chest", tracking_type: "strength", is_archived: false }]];
  const duplicate = createResponse();
  await exercisesHandler({ method: "POST", headers, body: { name: "chest press", category: "machine" } }, duplicate);
  assert.equal(duplicate.statusCode, 409);

  database.queries = [];
  database.results = [[], [{ id: "44444444-4444-4444-8444-444444444444", name: "Cable Fly", category: "cable", muscle_group: null, tracking_type: "strength" }]];
  const spaced = createResponse();
  await exercisesHandler({ method: "POST", headers, body: { name: "  Cable    Fly ", category: "cable" } }, spaced);
  assert.equal(spaced.statusCode, 201);
  assert.ok(database.queries[0].includes("Cable Fly"), "the duplicate lookup uses the collapsed name");
  assert.equal(database.queries[1][1], "Cable Fly", "the collapsed name is what gets stored");

  for (const body of [{ name: "", category: "machine" }, { name: "Press", category: "machine", trackingType: "laps" }]) {
    const invalid = createResponse();
    await exercisesHandler({ method: "POST", headers, body }, invalid);
    assert.equal(invalid.statusCode, 400);
  }

  const anonymous = createResponse();
  await exercisesHandler({ method: "POST", headers: {}, body: { name: "Chest Press", category: "machine" } }, anonymous);
  assert.equal(anonymous.statusCode, 401);
});

test("habits accept once-a-week and x-times-every-y-days schedules", async (t) => {
  useTestEnvironment(t);
  const sessionCookie = await signInAs(t, { sub: "4004", email: "habits@example.com", email_verified: true });
  const headers = { cookie: sessionCookie };
  const row = (overrides) => ({
    id: "22222222-2222-4222-8222-222222222222", name: "Habit", description: null, color: null, icon: null,
    tracking_type: "boolean", unit: null, target_value: 1, schedule_type: "daily", days_of_week: [],
    target_days_per_week: null, interval_count: null, interval_days: null, start_date: "2026-11-01", archived_at: null,
    ...overrides,
  });

  database.queries = [];
  database.results = [[row({ schedule_type: "weekly", target_days_per_week: 1 })]];
  const weekly = createResponse();
  await habitsHandler({ method: "POST", headers, body: { name: "Long run", frequencyType: "weekly", targetDaysPerWeek: 1 } }, weekly);
  assert.equal(weekly.statusCode, 201);
  assert.equal(weekly.body.habit.frequencyType, "weekly");
  assert.equal(weekly.body.habit.targetDaysPerWeek, 1);

  database.queries = [];
  database.results = [[row({ schedule_type: "interval", interval_count: 3, interval_days: 10 })]];
  const interval = createResponse();
  await habitsHandler({ method: "POST", headers, body: { name: "Yoga", frequencyType: "interval", intervalCount: 3, intervalDays: 10 } }, interval);
  assert.equal(interval.statusCode, 201);
  assert.equal(interval.body.habit.intervalCount, 3);
  assert.equal(interval.body.habit.intervalDays, 10);
  assert.ok(database.queries[0].includes("interval") && database.queries[0].includes(3) && database.queries[0].includes(10));

  for (const body of [
    { name: "Yoga", frequencyType: "interval", intervalCount: 4, intervalDays: 3 },
    { name: "Yoga", frequencyType: "interval", intervalCount: 2 },
    { name: "Yoga", frequencyType: "interval", intervalCount: 1, intervalDays: 0 },
  ]) {
    const invalid = createResponse();
    await habitsHandler({ method: "POST", headers, body }, invalid);
    assert.equal(invalid.statusCode, 400, JSON.stringify(body));
  }
});

test("routine exercises save a rep range and reject an inverted one", async (t) => {
  useTestEnvironment(t);
  const sessionCookie = await signInAs(t, { sub: "5005", email: "routines@example.com", email_verified: true });
  const headers = { cookie: sessionCookie };
  const exerciseId = "33333333-3333-4333-8333-333333333333";
  const exercise = (range) => ({ exerciseId, position: 1, targetSets: 3, restSeconds: 90, ...range });

  database.queries = [];
  database.results = [[{ weight_unit: "lb", distance_unit: "mi" }], [{ id: exerciseId }]];
  const created = createResponse();
  await routinesHandler({ method: "POST", headers, body: { name: "Push", exercises: [exercise({ targetRepsMin: 8, targetRepsMax: 12 })] } }, created);
  assert.equal(created.statusCode, 201);
  const insert = database.queries.find((values) => values.includes(exerciseId) && values.includes(12));
  assert.ok(insert, "the routine exercise insert carries the rep range");
  assert.ok(insert.indexOf(8) < insert.indexOf(12));

  database.results = [[{ weight_unit: "lb", distance_unit: "mi" }]];
  const inverted = createResponse();
  await routinesHandler({ method: "POST", headers, body: { name: "Push", exercises: [exercise({ targetRepsMin: 12, targetRepsMax: 8 })] } }, inverted);
  assert.equal(inverted.statusCode, 400);
});

test("a routine can be edited, replacing its exercises", async (t) => {
  useTestEnvironment(t);
  const sessionCookie = await signInAs(t, { sub: "6006", email: "editor@example.com", email_verified: true });
  const headers = { cookie: sessionCookie };
  const routineId = "55555555-5555-4555-8555-555555555555";
  const benchId = "66666666-6666-4666-8666-666666666666";
  const flyId = "77777777-7777-4777-8777-777777777777";
  const body = {
    name: "Push (heavy)",
    exercises: [
      { exerciseId: flyId, position: 1, targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
      { exerciseId: benchId, position: 2, targetSets: 4, targetRepsMin: 4, targetRepsMax: 6, restSeconds: 180 },
    ],
  };
  const profile = [{ weight_unit: "lb", distance_unit: "mi" }];

  database.queries = [];
  database.results = [profile, [{ id: routineId }], [{ id: flyId }, { id: benchId }]];
  const updated = createResponse();
  await routinesHandler({ method: "PATCH", headers, query: { id: routineId }, body }, updated);
  assert.equal(updated.statusCode, 200);
  const rename = database.queries.find((values) => values.includes("Push (heavy)"));
  assert.ok(rename && rename.includes(routineId) && rename.includes("google:6006"));
  const inserts = database.queries.filter((values) => values.includes(routineId) && (values.includes(flyId) || values.includes(benchId)));
  assert.equal(inserts.length, 2, "both exercises are re-inserted");
  assert.ok(inserts[0].includes(flyId), "exercises keep the submitted order");

  database.results = [profile, []];
  const missing = createResponse();
  await routinesHandler({ method: "PATCH", headers, query: { id: routineId }, body }, missing);
  assert.equal(missing.statusCode, 404);

  database.results = [profile];
  const repeated = createResponse();
  const twice = { ...body, exercises: [body.exercises[0], { ...body.exercises[0], position: 2 }] };
  await routinesHandler({ method: "PATCH", headers, query: { id: routineId }, body: twice }, repeated);
  assert.equal(repeated.statusCode, 400);

  database.results = [profile];
  const noId = createResponse();
  await routinesHandler({ method: "PATCH", headers, query: {}, body }, noId);
  assert.equal(noId.statusCode, 400);
});

test("a sign-in without a provider account id is refused", async (t) => {
  t.mock.method(console, "error", () => {});
  useTestEnvironment(t);
  mockProvider(t, { email: "someone@example.com", email_verified: true });
  const { location, stateCookie } = await startSignIn();
  const response = await finishSignIn(stateCookie, { code: "auth-code", state: location.searchParams.get("state") });
  assert.equal(response.headers.location, "/tracker/?auth_error=failed");
  assert.equal(database.queries.length, 0);
});

test("OAuth callback rejects a missing or mismatched state without contacting the provider", async (t) => {
  useTestEnvironment(t);
  const calls = mockProvider(t, { sub: "1001", email: "owner@example.com", email_verified: true });

  const { stateCookie } = await startSignIn();
  const forged = await finishSignIn(stateCookie, { code: "auth-code", state: "attacker-chosen-state" });
  assert.equal(forged.headers.location, "/tracker/?auth_error=expired");

  const noCookie = createResponse();
  await authHandler({ method: "GET", query: { code: "auth-code", state: "anything" }, headers: {} }, noCookie);
  assert.equal(noCookie.headers.location, "/tracker/?auth_error=expired");
  assert.equal(calls.length, 0);
});

test("OAuth provider failures and unconfigured providers do not sign in", async (t) => {
  t.mock.method(console, "error", () => {});
  useTestEnvironment(t);
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 400, json: async () => ({}) }));

  const { location, stateCookie } = await startSignIn();
  const failed = await finishSignIn(stateCookie, { code: "auth-code", state: location.searchParams.get("state") });
  assert.equal(failed.headers.location, "/tracker/?auth_error=failed");

  const unconfigured = createResponse();
  await authHandler({ method: "GET", query: { provider: "github" }, headers: {} }, unconfigured);
  assert.equal(unconfigured.statusCode, 404);
});

test("owner endpoints fail closed when tracker configuration is missing", async (t) => {
  const environment = { ...process.env };
  delete environment.DATABASE_URL;
  delete environment.TRACKER_SESSION_SECRET;
  useEnvironment(t, environment);

  const response = createResponse();
  await authHandler({ method: "GET", headers: {} }, response);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { error: "Tracker service is not configured." });
});
