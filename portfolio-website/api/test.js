const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    if (req.method === "POST") {
      await sql`
        INSERT INTO messages (text)
        VALUES ('Hello from Vercel!')
      `;
    }

    const rows = await sql`
      SELECT * FROM messages
      ORDER BY id DESC
      LIMIT 5
    `;

    return res.status(200).json(rows);

  } catch (err) {
    console.error("DATABASE ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};