const {
  clearSessionCookie,
  getTrackerServices,
  noStore,
  sessionCookie,
  sessionUserId,
} = require("../_lib/tracker-auth");
const {
  beginSignIn,
  clearStateCookie,
  completeSignIn,
  configuredProviders,
  providerConfig,
  readPendingSignIn,
} = require("../_lib/tracker-oauth");
const { ensureUser } = require("../_lib/tracker-users");
const { methodNotAllowed, oneQueryValue } = require("../_lib/tracker-api");

const TRACKER_PATH = "/tracker/";

function redirect(res, location, cookies) {
  if (cookies) {
    res.setHeader("Set-Cookie", cookies);
  }
  res.setHeader("Location", location);
  return res.status(302).end();
}

function redirectWithError(res, code) {
  return redirect(res, `${TRACKER_PATH}?auth_error=${code}`, [clearStateCookie()]);
}

async function handleCallback(req, res, services, query) {
  const pending = readPendingSignIn(req, oneQueryValue(query.state));
  if (!pending) {
    return redirectWithError(res, "expired");
  }
  if (query.error) {
    return redirectWithError(res, "cancelled");
  }
  const code = oneQueryValue(query.code);
  if (typeof code !== "string" || !code || code.length > 2048) {
    return redirectWithError(res, "failed");
  }

  let account;
  try {
    account = await completeSignIn(req, pending.provider, pending.verifier, code);
    await ensureUser(services.sql, account.userId, account.displayName);
  } catch (error) {
    console.error("tracker oauth error", error);
    return redirectWithError(res, "failed");
  }

  return redirect(res, TRACKER_PATH, [sessionCookie(services.sessionSecret, account.userId), clearStateCookie()]);
}

// GET            -> { authenticated, providers }
// GET ?provider= -> redirect to that provider's consent screen
// GET ?code=&state= (or ?error=&state=) -> OAuth callback; this bare path is the registered redirect URI
// DELETE         -> sign out
module.exports = async function handler(req, res) {
  noStore(res);

  if (!["GET", "DELETE"].includes(req.method)) {
    return methodNotAllowed(res, ["GET", "DELETE"]);
  }

  const services = getTrackerServices(res);
  if (!services) {
    return;
  }

  if (req.method === "DELETE") {
    clearSessionCookie(res);
    return res.status(200).json({ authenticated: false });
  }

  const query = req.query || {};

  if (query.code !== undefined || query.error !== undefined || query.state !== undefined) {
    return handleCallback(req, res, services, query);
  }

  if (query.provider !== undefined) {
    const provider = providerConfig(oneQueryValue(query.provider));
    if (!provider) {
      return res.status(404).json({ error: "That sign-in provider is not available." });
    }
    const { location, cookie } = beginSignIn(req, provider);
    return redirect(res, location, [cookie]);
  }

  return res.status(200).json({
    authenticated: Boolean(sessionUserId(req, services.sessionSecret)),
    providers: configuredProviders(),
  });
};
