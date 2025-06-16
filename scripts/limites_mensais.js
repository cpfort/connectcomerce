require('dotenv').config();
const { Pool } = require('pg');


const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ou coloque sua URL direta
  ssl: { rejectUnauthorized: false }
});

async function criarTabelaLimitesMensais() {
  const query = `
    CREATE TABLE IF NOT EXISTS limites_mensais (
      cliente_id UUID PRIMARY KEY,
      limite_mensal INT NOT NULL DEFAULT 100,
      mensagens_enviadas INT NOT NULL DEFAULT 0,
      mes_referencia DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE)
    );
  `;
  try {
    await pool.query(query);
    console.log('Tabela limites_mensais criada com sucesso!');
  } catch (err) {
    console.error('Erro ao criar tabela:', err);
  } finally {
    await pool.end();
  }
}

criarTabelaLimitesMensais();
