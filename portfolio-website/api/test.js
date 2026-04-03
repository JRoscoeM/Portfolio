const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`SELECT 1 as test`;

    return res.status(200).json(rows);
  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};