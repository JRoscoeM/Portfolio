const crypto = require("node:crypto");
const { getSql } = require("./db");

const COOKIE_NAME = "tracker_owner_session";
const OWNER_ID = "owner";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getTrackerServices(res) {
  let sql;
  try {
    sql = getSql();
  } catch (_error) {
    res.status(503).json({ error: "Tracker service is not configured." });
    return null;
  }
  const passcode = process.env.TRACKER_OWNER_PASSCODE;
  const sessionSecret = process.env.TRACKER_SESSION_SECRET;

  if (!sql || !passcode || !sessionSecret) {
    res.status(503).json({ error: "Tracker service is not configured." });
    return null;
  }

  return { sql, passcode, sessionSecret };
}

function digest(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest();
}

function passcodeMatches(candidate, expected) {
  if (typeof candidate !== "string" || !candidate || typeof expected !== "string") {
    return false;
  }

  return crypto.timingSafeEqual(digest(candidate), digest(expected));
}

function encode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(encodedPayload, secret) {
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function createSessionToken(secret) {
  const payload = encode(JSON.stringify({ sub: OWNER_ID, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }));
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

function verifySessionToken(token, secret) {
  if (typeof token !== "string") {
    return false;
  }

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) {
    return false;
  }

  const expectedSignature = sign(payload, secret);
  const supplied = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return false;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return claims.sub === OWNER_ID && Number.isFinite(claims.exp) && claims.exp > Math.floor(Date.now() / 1000);
  } catch (_error) {
    return false;
  }
}

function isOwnerRequest(req, secret) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[COOKIE_NAME], secret);
}

function requireOwner(req, res, services) {
  if (!isOwnerRequest(req, services.sessionSecret)) {
    res.status(401).json({ error: "Owner sign-in required." });
    return false;
  }
  return true;
}

function cookieSecurityAttribute() {
  return process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
}

function setSessionCookie(res, secret) {
  const token = createSessionToken(secret);
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${cookieSecurityAttribute()}`
  );
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
  OWNER_ID,
  clearSessionCookie,
  getTrackerServices,
  isOwnerRequest,
  noStore,
  passcodeMatches,
  requireOwner,
  setSessionCookie,
};
