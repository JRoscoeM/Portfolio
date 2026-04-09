module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  return res.status(200).json({
    connected: false,
    mode: "host-controlled listening",
    currentTrack: null,
    nextStep: "Add Spotify OAuth callback and token persistence for room hosts.",
  });
};
