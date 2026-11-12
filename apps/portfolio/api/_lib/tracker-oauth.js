const crypto = require("node:crypto");
const { cookieSecurityAttribute, parseCookies } = require("./tracker-auth");
const { OWNER_ID } = require("./tracker-users");

const STATE_COOKIE_NAME = "tracker_oauth_state";
const STATE_TTL_SECONDS = 60 * 10;
const CALLBACK_PATH = "/api/tracker/auth";
const REQUEST_TIMEOUT_MS = 8000;

const PROVIDERS = {
  google: {
    env: "GOOGLE",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    profileUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email",
    ownerEnv: "TRACKER_OWNER_GOOGLE_EMAIL",
    // `sub` is Google's stable account id; an email address can be reassigned.
    identify(profile) {
      return typeof profile.sub === "string" && profile.sub
        ? { subject: profile.sub, displayName: typeof profile.email === "string" ? profile.email : "Google user" }
        : null;
    },
    // Only a verified address counts; an unverified one proves nothing about who signed in.
    isOwner(profile, owner) {
      return profile.email_verified === true && typeof profile.email === "string" && sameText(profile.email, owner);
    },
  },
  github: {
    env: "GITHUB",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    profileUrl: "https://api.github.com/user",
    scope: "",
    ownerEnv: "TRACKER_OWNER_GITHUB_LOGIN",
    // The numeric id is stable; a login can be renamed and later claimed by someone else.
    identify(profile) {
      return Number.isInteger(profile.id)
        ? { subject: String(profile.id), displayName: typeof profile.login === "string" ? profile.login : "GitHub user" }
        : null;
    },
    // Accepts the login or the numeric account id; the id survives a rename.
    isOwner(profile, owner) {
      return (
        (typeof profile.login === "string" && sameText(profile.login, owner)) ||
        (Number.isInteger(profile.id) && String(profile.id) === owner.trim())
      );
    },
  },
};

function sameText(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function providerConfig(name) {
  const provider = Object.hasOwn(PROVIDERS, name) ? PROVIDERS[name] : null;
  if (!provider) {
    return null;
  }
  const clientId = process.env[`TRACKER_${provider.env}_CLIENT_ID`];
  const clientSecret = process.env[`TRACKER_${provider.env}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) {
    return null;
  }
  return { ...provider, name, clientId, clientSecret, owner: process.env[provider.ownerEnv] || "" };
}

function configuredProviders() {
  return Object.keys(PROVIDERS).filter((name) => providerConfig(name));
}

function firstHeader(value) {
  return String(Array.isArray(value) ? value[0] : value || "").split(",")[0].trim();
}

function redirectUri(req) {
  const configured = process.env.TRACKER_PUBLIC_ORIGIN;
  if (configured) {
    return `${configured.replace(/\/+$/, "")}${CALLBACK_PATH}`;
  }
  const host = firstHeader(req.headers["x-forwarded-host"]) || firstHeader(req.headers.host);
  const protocol = firstHeader(req.headers["x-forwarded-proto"]) || "http";
  return `${protocol}://${host}${CALLBACK_PATH}`;
}

function stateCookie(value, maxAge) {
  return `${STATE_COOKIE_NAME}=${value}; Path=${CALLBACK_PATH}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${cookieSecurityAttribute()}`;
}

function clearStateCookie() {
  return stateCookie("", 0);
}

// Returns the provider URL to send the browser to, plus the cookie that binds the round trip to this browser.
function beginSignIn(req, provider) {
  const state = crypto.randomBytes(32).toString("base64url");
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");

  const url = new URL(provider.authorizeUrl);
  url.searchParams.set("client_id", provider.clientId);
  url.searchParams.set("redirect_uri", redirectUri(req));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (provider.scope) {
    url.searchParams.set("scope", provider.scope);
  }

  return { location: url.toString(), cookie: stateCookie(`${provider.name}.${state}.${verifier}`, STATE_TTL_SECONDS) };
}

function readPendingSignIn(req, suppliedState) {
  const raw = parseCookies(req.headers.cookie)[STATE_COOKIE_NAME];
  if (typeof raw !== "string" || typeof suppliedState !== "string") {
    return null;
  }
  const [name, state, verifier, extra] = raw.split(".");
  if (!name || !state || !verifier || extra) {
    return null;
  }
  const supplied = Buffer.from(suppliedState, "utf8");
  const expected = Buffer.from(state, "utf8");
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return null;
  }
  const provider = providerConfig(name);
  return provider ? { provider, verifier } : null;
}

async function fetchJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`OAuth request to ${new URL(url).host} failed with ${response.status}`);
  }
  return response.json();
}

// Exchanges the authorization code and returns { userId, displayName } for the account that signed in.
// The account named in the provider's owner variable maps to the original owner's data; everyone else
// gets an id derived from the provider's stable account id.
async function completeSignIn(req, provider, verifier, code) {
  const token = await fetchJson(provider.tokenUrl, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      redirect_uri: redirectUri(req),
      code_verifier: verifier,
    }).toString(),
  });
  if (!token || typeof token.access_token !== "string" || !token.access_token) {
    throw new Error(`OAuth token exchange with ${provider.name} returned no access token`);
  }

  const profile = await fetchJson(provider.profileUrl, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token.access_token}`,
      "User-Agent": "daily-log-tracker",
    },
  });
  const identity = profile && provider.identify(profile);
  if (!identity) {
    throw new Error(`OAuth profile from ${provider.name} had no account id`);
  }
  const isOwner = Boolean(provider.owner) && provider.isOwner(profile, provider.owner);
  return {
    userId: isOwner ? OWNER_ID : `${provider.name}:${identity.subject}`,
    displayName: identity.displayName,
  };
}

module.exports = {
  beginSignIn,
  clearStateCookie,
  completeSignIn,
  configuredProviders,
  providerConfig,
  readPendingSignIn,
};
