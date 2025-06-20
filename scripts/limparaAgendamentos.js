require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ou configure aqui sua string de conexão
});

async function limparAgendamentos() {
  try {
    await pool.query('BEGIN');
    await pool.query('TRUNCATE TABLE agendamentos CASCADE'); // apaga tudo da tabela agendamentos, incluindo dependentes (se tiver)
    await pool.query('COMMIT');
    console.log('Tabela agendamentos limpa com sucesso!');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Erro ao limpar agendamentos:', err);
  } finally {
    await pool.end();
  }
}

limparAgendamentos();
