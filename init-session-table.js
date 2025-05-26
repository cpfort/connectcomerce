// init-session-table.js
require('dotenv').config();
const pool = require('./db');

(async () => {
  try {
    await pool.query(`DROP TABLE IF EXISTS "session";`);
    await pool.query(`
      CREATE TABLE "session" (
        "sid" VARCHAR(255) NOT NULL,
        "sess" JSON NOT NULL,
        "expire" TIMESTAMP(6) NOT NULL,
        PRIMARY KEY ("sid")
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS IDX_session_expire ON "session" ("expire");`);
    console.log('✅ Tabela session criada/recriada com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao criar tabela session:', err);
  } finally {
    await pool.end();
  }
})();
