const crypto = require("node:crypto");
const { getSql } = require("./db");

// The cookie keeps its original name so sessions issued before multi-user support stay valid.
const COOKIE_NAME = "tracker_owner_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getTrackerServices(res) {
  let sql;
  try {
    sql = getSql();
  } catch (_error) {
    res.status(503).json({ error: "Tracker service is not configured." });
    return null;
  }
  const sessionSecret = process.env.TRACKER_SESSION_SECRET;

  if (!sql || !sessionSecret) {
    res.status(503).json({ error: "Tracker service is not configured." });
    return null;
  }

  return { sql, sessionSecret };
}

function encode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(encodedPayload, secret) {
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function createSessionToken(secret, userId) {
  const payload = encode(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }));
  return `${payload}.${sign(payload, secret)}`;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) {
      continue;
    }
    const name = part.slice(0, separator).trim();
    const rawValue = part.slice(separator + 1).trim();
    try {
      cookies[name] = decodeURIComponent(rawValue);
    } catch (_error) {
      cookies[name] = rawValue;
    }
  }
  return cookies;
}

// Returns the signed-in user's id, or null when the token is missing, forged, or expired.
function verifySessionToken(token, secret) {
  if (typeof token !== "string") {
    return null;
  }

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) {
    return null;
  }

  const expectedSignature = sign(payload, secret);
  const supplied = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const valid = typeof claims.sub === "string" && claims.sub &&
      Number.isFinite(claims.exp) && claims.exp > Math.floor(Date.now() / 1000);
    return valid ? claims.sub : null;
  } catch (_error) {
    return null;
  }
}

function sessionUserId(req, secret) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[COOKIE_NAME], secret);
}

// Returns the signed-in user's id; otherwise answers 401 and returns null.
function requireUser(req, res, services) {
  const userId = sessionUserId(req, services.sessionSecret);
  if (!userId) {
    res.status(401).json({ error: "Sign-in required." });
  }
  return userId;
}

function cookieSecurityAttribute() {
  return process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
}

function sessionCookie(secret, userId) {
  const token = createSessionToken(secret, userId);
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${cookieSecurityAttribute()}`;
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${cookieSecurityAttribute()}`
  );
}

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, private");
}

module.exports = {
  clearSessionCookie,
  cookieSecurityAttribute,
  getTrackerServices,
  noStore,
  parseCookies,
  requireUser,
  sessionCookie,
  sessionUserId,
};
