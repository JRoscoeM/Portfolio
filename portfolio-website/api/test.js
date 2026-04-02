import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === "POST") {
    await sql`INSERT INTO messages (text) VALUES ('Hello from Vercel!')`;
  }

  const rows = await sql`SELECT * FROM messages ORDER BY id DESC LIMIT 5`;

  res.status(200).json(rows);
}

import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT 1 as connected`;
    res.status(200).json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

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