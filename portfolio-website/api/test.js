import { neon } from "@neondatabase/serverless";

const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    if (req.method === "POST") {
      await sql`
        INSERT INTO messages (text)
        VALUES ('Hello dynamic world!')
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

// const { neon } = require("@neondatabase/serverless");

// module.exports = async function handler(req, res) {
//   try {
//     const sql = neon(process.env.DATABASE_URL);

//     const tables = await sql`
//       SELECT table_name
//       FROM information_schema.tables
//       WHERE table_schema = 'public'
//     `;

//     return res.status(200).json(tables);
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: err.message });
//   }
// };