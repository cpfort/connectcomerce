// scripts/criarUsuario.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function criarUsuario() {
  const usuario = 'admin';
  const senhaPlana = 'senha123';
  const senhaHash = await bcrypt.hash(senhaPlana, 10);

  try {
    await pool.query(
      'INSERT INTO usuarios (usuario, senha_hash) VALUES ($1, $2)',
      [usuario, senhaHash]
    );
    console.log('✅ Usuário criado com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao criar usuário:', err);
    process.exit(1);
  }
}

criarUsuario();

