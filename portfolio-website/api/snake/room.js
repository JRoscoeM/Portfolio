const { getSql } = require("./db");

function buildRoomId() {
  return `SNAKE-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function normalizeMusicMode(musicMode) {
  if (musicMode === "ambient-only" || musicMode === "ambient_only") {
    return "ambient_only";
  }

  return "host_control";
}

async function createRoomFlow(sql, { hostName, roomName, musicMode }) {
  const roomId = buildRoomId();

  const playerRows = await sql`
    INSERT INTO snake_players (display_name)
    VALUES (${hostName})
    RETURNING id
  `;

  const hostPlayerId = playerRows[0].id;

  await sql`
    INSERT INTO snake_rooms (id, room_name, host_player_id, music_mode)
    VALUES (${roomId}, ${roomName}, ${hostPlayerId}::uuid, ${musicMode})
  `;

  await sql`
    INSERT INTO snake_room_members (room_id, player_id, is_host)
    VALUES (${roomId}, ${hostPlayerId}::uuid, TRUE)
  `;

  const rows = await sql`
    SELECT
      r.id,
      r.room_name,
      r.status,
      r.music_mode,
      r.spotify_connected,
      r.created_at,
      p.id AS host_player_id,
      p.display_name AS host_display_name
    FROM snake_rooms r
    JOIN snake_players p ON p.id = r.host_player_id
    WHERE r.id = ${roomId}
    LIMIT 1
  `;

  return rows[0];
}

async function joinRoomFlow(sql, { roomId, playerName }) {
  const roomRows = await sql`
    SELECT
      r.id,
      r.room_name,
      r.status,
      r.music_mode,
      r.spotify_connected,
      r.created_at,
      p.id AS host_player_id,
      p.display_name AS host_display_name
    FROM snake_rooms r
    JOIN snake_players p ON p.id = r.host_player_id
    WHERE r.id = ${roomId}
    LIMIT 1
  `;

  const room = roomRows[0];

  if (!room) {
    return null;
  }

  const playerRows = await sql`
    INSERT INTO snake_players (display_name)
    VALUES (${playerName})
    RETURNING id
  `;

  const playerId = playerRows[0].id;

  const memberRows = await sql`
    INSERT INTO snake_room_members (room_id, player_id, is_host)
    VALUES (${roomId}, ${playerId}::uuid, FALSE)
    RETURNING room_id, player_id, is_host, joined_at
  `;

  const membership = memberRows[0];

  const roster = await sql`
    SELECT
      m.player_id,
      p.display_name,
      m.is_host,
      m.connection_status,
      m.joined_at,
      m.left_at
    FROM snake_room_members m
    JOIN snake_players p ON p.id = m.player_id
    WHERE m.room_id = ${roomId}
    ORDER BY m.joined_at ASC
  `;

  return { room, membership, roster };
}

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === "POST") {
      const { hostName, roomName, musicMode = "host-control" } = req.body || {};

      if (!hostName || !roomName) {
        return res.status(400).json({ error: "hostName and roomName are required." });
      }

      const normalizedMusicMode = normalizeMusicMode(musicMode);

      if (!sql) {
        return res.status(200).json({
          ok: true,
          source: "prototype",
          room: {
            id: buildRoomId(),
            room_name: roomName,
            status: "lobby",
            music_mode: normalizedMusicMode,
            spotify_connected: false,
            created_at: new Date().toISOString(),
            host_player_id: "prototype-player",
            host_display_name: hostName,
          },
        });
      }

      const room = await createRoomFlow(sql, {
        hostName,
        roomName,
        musicMode: normalizedMusicMode,
      });

      return res.status(200).json({ ok: true, source: "neon", room });
    }

    if (req.method === "GET") {
      const { roomId, playerName } = req.query;

      if (!roomId || !playerName) {
        return res.status(400).json({ error: "roomId and playerName are required." });
      }

      if (!sql) {
        return res.status(200).json({
          ok: true,
          source: "prototype",
          room: {
            id: roomId,
            room_name: "Prototype room",
            host_display_name: "Unknown host",
            music_mode: "host_control",
            spotify_connected: false,
            status: "lobby",
          },
          joinedPlayer: playerName,
          roster: [
            {
              player_id: "prototype-player",
              display_name: playerName,
              is_host: false,
              connection_status: "connected",
            },
          ],
          nextStep: "Connect the browser client to the realtime service for gameplay.",
        });
      }

      const result = await joinRoomFlow(sql, { roomId, playerName });

      if (!result) {
        return res.status(404).json({ error: "Room not found." });
      }

      return res.status(200).json({
        ok: true,
        source: "neon",
        room: result.room,
        joinedPlayer: playerName,
        membership: result.membership,
        roster: result.roster,
        nextStep: "Connect the browser client to the realtime service for gameplay.",
      });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("snake room error", error);
    return res.status(500).json({ error: error.message });
  }
};
