const { getSql } = require("./db");

function buildPrototypeScores() {
  return [
    { playerName: "Roscoe", score: 18, roomId: "SNAKE-DEMO", createdAt: "2026-04-08T19:25:00.000Z" },
    { playerName: "John", score: 14, roomId: "SNAKE-DEMO", createdAt: "2026-04-08T19:18:00.000Z" },
    { playerName: "Guest", score: 9, roomId: "SNAKE-ALFA", createdAt: "2026-04-07T22:06:00.000Z" },
  ];
}

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === "POST") {
      const { playerId, playerName, score, roomId = null, matchId = null } = req.body || {};

      if (!playerId || !playerName || Number.isNaN(Number(score))) {
        return res.status(400).json({ error: "playerId, playerName, and numeric score are required." });
      }

      if (sql) {
        if (!matchId) {
          return res.status(400).json({ error: "matchId is required when saving scores to Neon." });
        }

        await sql`
          INSERT INTO snake_match_players (
            match_id,
            player_id,
            display_name,
            final_score,
            max_score,
            placement
          )
          VALUES (
            ${matchId}::uuid,
            ${playerId}::uuid,
            ${playerName},
            ${Number(score)},
            ${Number(score)},
            NULL
          )
        `;
      }

      return res.status(200).json({
        ok: true,
        source: sql ? "neon" : "prototype",
        savedScore: {
          playerName,
          score: Number(score),
          roomId,
          createdAt: new Date().toISOString(),
        },
      });
    }

    if (req.method === "GET") {
      if (!sql) {
        const prototypeScores = buildPrototypeScores();

        return res.status(200).json({
          scores: prototypeScores.map(({ playerName, score }) => ({ playerName, score })),
          recentMatches: prototypeScores,
          source: "prototype",
        });
      }

      const scoreRows = await sql`
        SELECT
          player_id,
          display_name,
          MAX(max_score) AS top_score
        FROM snake_match_players
        GROUP BY player_id, display_name
        ORDER BY top_score DESC, display_name ASC
        LIMIT 8
      `;

      const recentMatchRows = await sql`
        SELECT
          m.id,
          m.room_id,
          m.status,
          m.started_at,
          m.ended_at,
          winner.display_name AS winner_name,
          m.summary
        FROM snake_matches m
        LEFT JOIN snake_players winner ON winner.id = m.winner_player_id
        ORDER BY m.started_at DESC
        LIMIT 20
      `;

      const scores = scoreRows.map((row) => ({
        playerId: row.player_id,
        playerName: row.display_name,
        score: row.top_score,
      }));

      const recentMatches = recentMatchRows.map((row) => ({
        matchId: row.id,
        roomId: row.room_id,
        status: row.status,
        startedAt: row.started_at,
        endedAt: row.ended_at,
        winnerName: row.winner_name,
        summary: row.summary,
      }));

      return res.status(200).json({
        scores,
        recentMatches,
        source: "neon",
      });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("snake highscores error", error);
    return res.status(500).json({ error: error.message });
  }
};
