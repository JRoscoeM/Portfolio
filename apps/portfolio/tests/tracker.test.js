const test = require("node:test");
const assert = require("node:assert/strict");

const authHandler = require("../api/tracker/auth");
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

test("owner passcode creates a signed cookie that authenticates and logs out", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.property(process, "env", {
    ...process.env,
    DATABASE_URL: "postgresql://user:pass@example.com/tracker?sslmode=require",
    TRACKER_OWNER_PASSCODE: "test-owner-passcode",
    TRACKER_SESSION_SECRET: "test-session-secret-with-more-than-32-bytes",
  });

  const loginResponse = createResponse();
  await authHandler({ method: "POST", body: { passcode: "test-owner-passcode" }, headers: {} }, loginResponse);
  assert.equal(loginResponse.statusCode, 200);
  assert.equal(loginResponse.body.authenticated, true);
  assert.match(loginResponse.headers["set-cookie"], /HttpOnly/);
  assert.match(loginResponse.headers["set-cookie"], /SameSite=Strict/);

  const sessionCookie = cookieHeader(loginResponse.headers["set-cookie"]);
  const statusResponse = createResponse();
  await authHandler({ method: "GET", headers: { cookie: sessionCookie } }, statusResponse);
  assert.deepEqual(statusResponse.body, { authenticated: true });

  const logoutResponse = createResponse();
  await authHandler({ method: "DELETE", headers: { cookie: sessionCookie } }, logoutResponse);
  assert.equal(logoutResponse.body.authenticated, false);
  assert.match(logoutResponse.headers["set-cookie"], /Max-Age=0/);
});

test("invalid passcodes are rejected", async (t) => {
  t.mock.property(process, "env", {
    ...process.env,
    DATABASE_URL: "postgresql://user:pass@example.com/tracker?sslmode=require",
    TRACKER_OWNER_PASSCODE: "correct-passcode",
    TRACKER_SESSION_SECRET: "test-session-secret-with-more-than-32-bytes",
  });

  const response = createResponse();
  await authHandler({ method: "POST", body: { passcode: "wrong-passcode" }, headers: {} }, response);
  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { error: "Invalid passcode." });
});

test("owner endpoints fail closed when tracker configuration is missing", async (t) => {
  const environment = { ...process.env };
  delete environment.DATABASE_URL;
  delete environment.TRACKER_OWNER_PASSCODE;
  delete environment.TRACKER_SESSION_SECRET;
  t.mock.property(process, "env", environment);

  const response = createResponse();
  await authHandler({ method: "GET", headers: {} }, response);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { error: "Tracker service is not configured." });
});
