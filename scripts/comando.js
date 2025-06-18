const { Pool } = require('pg');
require('dotenv').config();

// **ATENÇÃO:** coloque sua string de conexão correta aqui!
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // Remova ou ajuste se não usar SSL
});

async function adicionarConstraint() {
  const sql = `
    ALTER TABLE estoque
    ADD CONSTRAINT estoque_serial_unique UNIQUE (serial);
  `;

  try {
    await pool.query(sql);
    console.log('Constraint UNIQUE adicionada com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar constraint UNIQUE:', error);
  } finally {
    await pool.end();
  }
}

adicionarConstraint();
