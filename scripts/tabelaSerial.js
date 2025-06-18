const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function adicionarColunaSerial() {
  try {
    const result = await pool.query(`
      ALTER TABLE estoque ADD COLUMN IF NOT EXISTS serial TEXT;
    `);
    console.log('✅ Coluna "serial" adicionada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna serial:', error);
  } finally {
    await pool.end();
  }
}

adicionarColunaSerial();
