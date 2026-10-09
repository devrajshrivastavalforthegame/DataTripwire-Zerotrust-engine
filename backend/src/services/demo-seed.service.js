import { query } from "../config/database.js";
import { hashPassword } from "./auth/password.service.js";

export async function ensureDemoUsers() {
  const users = [
    { username:"Demo Employee", email:"employee@workshepher.local", password:"Employee@123", role:"employee" },
    { username:"SOC Administrator", email:"admin@datatripwire.local", password:"Admin@123", role:"security_manager" }
  ];

  for (const user of users) {
    const existing = await query("SELECT id FROM users WHERE email=$1 LIMIT 1",[user.email]);
    let userId = existing.rows[0]?.id;
    if (!userId) {
      const passwordHash = await hashPassword(user.password);
      const created = await query(
        `INSERT INTO users (username,email,password_hash,role,status)
         VALUES ($1,$2,$3,$4,'active') RETURNING id`,
        [user.username,user.email,passwordHash,user.role]
      );
      userId = created.rows[0].id;
    }
    await query(
      `INSERT INTO user_roles(user_id,role_id)
       SELECT $1,r.id FROM roles r WHERE r.slug=$2
       ON CONFLICT DO NOTHING`,
      [userId,user.role]
    );
  }
}
