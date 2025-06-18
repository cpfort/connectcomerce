const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function tornarAdmin(usuario) {
  try {
    await pool.query(`
      UPDATE usuarios SET nivel = 'admin' WHERE usuario = $1
    `, [usuario]);
    console.log(`✅ Usuário "${usuario}" agora é admin.`);
  } catch (error) {
    console.error('❌ Erro ao atualizar nível do usuário:', error);
  } finally {
    await pool.end();
  }
}

// Altere 'caio' pelo nome do seu usuário
tornarAdmin('admin');
