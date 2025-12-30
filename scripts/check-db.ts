import { Pool } from 'pg';

async function checkDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("ℹ️  DATABASE_URL is not set. Skipping DB check.");
    process.exit(0);
  }

  console.log(`Connecting to DB (masked): ${connectionString.replace(/:[^:@]+@/, ':***@')}`);

  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const config: any = { connectionString };

  if (!isLocal) {
    console.log("Using SSL (rejectUnauthorized: false) for remote connection.");
    config.ssl = { rejectUnauthorized: false };
  }

  const pool = new Pool(config);

  try {
    const res = await pool.query('SELECT NOW() as now, version()');
    console.log("✅ Connection successful!");
    console.log("   DB Version:", res.rows[0].version);
    console.log("   Server Time:", res.rows[0].now);
  } catch (err) {
    console.error("❌ Connection failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDb();
