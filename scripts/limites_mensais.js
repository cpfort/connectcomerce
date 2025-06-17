const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function deletarTabelas() {
  try {
    await pool.query('DROP TABLE IF EXISTS limites_mensais CASCADE');
    await pool.query('DROP TABLE IF EXISTS limites_mensais1 CASCADE');
    console.log('✅ Tabelas deletadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao deletar tabelas:', err);
  } finally {
    await pool.end();
  }
}

deletarTabelas();
