const { getSql } = require("./db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const sql = getSql();
  const { roomId } = req.query || {};

  if (!sql || !roomId) {
    return res.status(200).json({
      connected: false,
      mode: "host-controlled listening",
      currentTrack: null,
      nextStep: "Add Spotify OAuth callback and token persistence for room hosts.",
    });
  }

  try {
    const rows = await sql`
      SELECT
        rs.room_id,
        rs.is_active,
        rs.current_track_id,
        rs.current_track_name,
        rs.artist_name,
        rs.album_image_url,
        rs.playback_state,
        rs.snapshot_taken_at,
        r.spotify_connected,
        p.display_name AS host_display_name
      FROM spotify_room_sessions rs
      JOIN snake_rooms r ON r.id = rs.room_id
      JOIN snake_players p ON p.id = rs.host_player_id
      WHERE rs.room_id = ${roomId}
      LIMIT 1
    `;

    const session = rows[0];

    if (!session) {
      return res.status(200).json({
        connected: false,
        mode: "host-controlled listening",
        currentTrack: null,
        nextStep: "No Spotify room session exists for this room yet.",
      });
    }

    return res.status(200).json({
      connected: session.spotify_connected,
      mode: "host-controlled listening",
      currentTrack: session.current_track_name,
      artistName: session.artist_name,
      playbackState: session.playback_state,
      hostDisplayName: session.host_display_name,
      snapshotTakenAt: session.snapshot_taken_at,
    });
  } catch (error) {
    console.error("spotify status error", error);
    return res.status(500).json({ error: error.message });
  }
};
