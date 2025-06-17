const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function criarTabelaEstoque() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS estoque (
        id SERIAL PRIMARY KEY,
        nome_produto TEXT NOT NULL,
        quantidade INT DEFAULT 0,
        preco NUMERIC(10, 2),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela estoque criada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabela estoque:', error);
  } finally {
    await pool.end();
  }
}

criarTabelaEstoque();
