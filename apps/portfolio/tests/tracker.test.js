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
