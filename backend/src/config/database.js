import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL pool error:", err);
});

export async function query(text, params) {
    return pool.query(text, params);
}

export async function checkDatabaseConnection() {
    const result = await pool.query("SELECT 1 AS connected");
    return result.rows[0];
}

export default pool;
