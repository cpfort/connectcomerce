
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function criarTabelaLeads() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        telefone VARCHAR(20),
        email VARCHAR(100),
        interesse TEXT,
        produto TEXT,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela leads criada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabela leads:', error);
  } finally {
    await pool.end();
  }
}

criarTabelaLeads();
