const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function criarTabelaLimitesMensais() {
  const query = `
    CREATE TABLE IF NOT EXISTS limites_mensais1 (
      cliente_id UUID PRIMARY KEY,
      limite_mensal INT NOT NULL DEFAULT 100
    );
  `;

  try {
    await pool.query(query);
    console.log('✅ Tabela limites_mensais criada com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao criar tabela limites_mensais:', err);
  } finally {
    await pool.end();
  }
}

criarTabelaLimitesMensais();
