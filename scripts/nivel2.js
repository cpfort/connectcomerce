const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function adicionarColunaNivel() {
  try {
    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nivel TEXT DEFAULT 'usuario';
    `);
    console.log('✅ Coluna "nivel" adicionada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna "nivel":', error);
  } finally {
    await pool.end();
  }
}

adicionarColunaNivel();
