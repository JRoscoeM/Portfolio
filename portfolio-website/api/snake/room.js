const { neon } = require("@neondatabase/serverless");

function buildRoomId() {
  return `SNAKE-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function getSql() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  return neon(process.env.DATABASE_URL);
}

async function createRoom(sql, room) {
  if (!sql) {
    return room;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS snake_rooms (
      id TEXT PRIMARY KEY,
      host_name TEXT NOT NULL,
      room_name TEXT NOT NULL,
      music_mode TEXT NOT NULL,
      spotify_connected BOOLEAN NOT NULL DEFAULT FALSE,
      status TEXT NOT NULL DEFAULT 'lobby',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    INSERT INTO snake_rooms (id, host_name, room_name, music_mode, spotify_connected, status)
    VALUES (${room.id}, ${room.hostName}, ${room.roomName}, ${room.musicMode}, ${room.spotifyConnected}, ${room.status})
  `;

  return room;
}

async function findRoom(sql, roomId) {
  if (!sql) {
    return null;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS snake_rooms (
      id TEXT PRIMARY KEY,
      host_name TEXT NOT NULL,
      room_name TEXT NOT NULL,
      music_mode TEXT NOT NULL,
      spotify_connected BOOLEAN NOT NULL DEFAULT FALSE,
      status TEXT NOT NULL DEFAULT 'lobby',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const rows = await sql`
    SELECT id, host_name, room_name, music_mode, spotify_connected, status, created_at
    FROM snake_rooms
    WHERE id = ${roomId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === "POST") {
      const { hostName, roomName, musicMode = "host-control" } = req.body || {};

      if (!hostName || !roomName) {
        return res.status(400).json({ error: "hostName and roomName are required." });
      }

      const room = {
        id: buildRoomId(),
        hostName,
        roomName,
        musicMode,
        spotifyConnected: false,
        status: "lobby",
        createdAt: new Date().toISOString(),
      };

      await createRoom(sql, room);

      return res.status(200).json({
        ok: true,
        source: sql ? "neon" : "prototype",
        room,
      });
    }

    if (req.method === "GET") {
      const { roomId, playerName } = req.query;

      if (!roomId || !playerName) {
        return res.status(400).json({ error: "roomId and playerName are required." });
      }

      const room = await findRoom(sql, roomId);

      if (!room && sql) {
        return res.status(404).json({ error: "Room not found." });
      }

      return res.status(200).json({
        ok: true,
        source: sql ? "neon" : "prototype",
        room: room ?? {
          id: roomId,
          room_name: "Prototype room",
          host_name: "Unknown host",
          music_mode: "host-control",
          spotify_connected: false,
          status: "lobby",
        },
        joinedPlayer: playerName,
        nextStep: "Connect the browser client to the realtime service for gameplay.",
      });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("snake room error", error);
    return res.status(500).json({ error: error.message });
  }
};
