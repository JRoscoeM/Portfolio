const { neon } = require("@neondatabase/serverless");

function getSql() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  return neon(process.env.DATABASE_URL);
}

async function ensureTable(sql) {
  if (!sql) {
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS snake_high_scores (
      id BIGSERIAL PRIMARY KEY,
      player_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      room_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === "POST") {
      const { playerName, score, roomId = null } = req.body || {};

      if (!playerName || Number.isNaN(Number(score))) {
        return res.status(400).json({ error: "playerName and numeric score are required." });
      }

      await ensureTable(sql);

      if (sql) {
        await sql`
          INSERT INTO snake_high_scores (player_name, score, room_id)
          VALUES (${playerName}, ${Number(score)}, ${roomId})
        `;
      }

      return res.status(200).json({ ok: true, source: sql ? "neon" : "prototype" });
    }

    if (req.method === "GET") {
      await ensureTable(sql);

      if (!sql) {
        return res.status(200).json({
          scores: [
            { playerName: "Roscoe", score: 18 },
            { playerName: "Kennis", score: 14 },
            { playerName: "Guest", score: 9 },
          ],
          source: "prototype",
        });
      }

      const rows = await sql`
        SELECT player_name, score
        FROM snake_high_scores
        ORDER BY score DESC, created_at DESC
        LIMIT 8
      `;

      return res.status(200).json({
        scores: rows.map((row) => ({
          playerName: row.player_name,
          score: row.score,
        })),
        source: "neon",
      });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("snake highscores error", error);
    return res.status(500).json({ error: error.message });
  }
};
