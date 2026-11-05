const {
  clearSessionCookie,
  getTrackerServices,
  isOwnerRequest,
  noStore,
  passcodeMatches,
  setSessionCookie,
} = require("../_lib/tracker-auth");
const { methodNotAllowed, readBody, serverError } = require("../_lib/tracker-api");

module.exports = async function handler(req, res) {
  noStore(res);

  if (!["GET", "POST", "DELETE"].includes(req.method)) {
    return methodNotAllowed(res, ["GET", "POST", "DELETE"]);
  }

  const services = getTrackerServices(res);
  if (!services) {
    return;
  }

  if (req.method === "DELETE") {
    clearSessionCookie(res);
    return res.status(200).json({ authenticated: false });
  }

  if (req.method === "GET") {
    return res.status(200).json({ authenticated: isOwnerRequest(req, services.sessionSecret) });
  }

  try {
    const body = readBody(req);
    if (!body || typeof body.passcode !== "string" || body.passcode.length > 512) {
      return res.status(400).json({ error: "A passcode is required." });
    }

    if (!passcodeMatches(body.passcode, services.passcode)) {
      clearSessionCookie(res);
      return res.status(401).json({ error: "Invalid passcode." });
    }

    setSessionCookie(res, services.sessionSecret);
    return res.status(200).json({ authenticated: true });
  } catch (error) {
    return serverError(res, "tracker auth error", error);
  }
};
