import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === "POST") {
    await sql`INSERT INTO messages (text) VALUES ('Hello from Vercel!')`;
  }

  const rows = await sql`SELECT * FROM messages ORDER BY id DESC LIMIT 5`;

  res.status(200).json(rows);
}