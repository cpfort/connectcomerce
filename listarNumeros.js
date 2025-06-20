require('dotenv').config();
const { Pool } = require('pg');



const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function adicionarColunaOculto() {
  try {
    await pool.query(`
      ALTER TABLE agendamentos
      ADD COLUMN IF NOT EXISTS oculto BOOLEAN DEFAULT false
    `);

    console.log('✅ Coluna "oculto" adicionada com sucesso (ou já existia).');
    await pool.end();
  } catch (err) {
    console.error('❌ Erro ao adicionar coluna "oculto":', err);
  }
}

adicionarColunaOculto();
