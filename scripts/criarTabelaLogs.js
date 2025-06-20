// scripts/criarTabelaLogs.js
const pool = require('../db');

async function criarTabelaLogsEnvios() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs_envios (
        id SERIAL PRIMARY KEY,
        agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
        numero TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        status TEXT,
        resposta JSONB,
        criado_em TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('✅ Tabela logs_envios criada/verificada com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao criar a tabela logs_envios:', err);
    process.exit(1);
  }
}

criarTabelaLogsEnvios();
