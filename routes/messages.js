const express = require('express');
const router = express.Router();
const { enviarViaGupshup } = require('../utils/gupshup');
const db = require('../db'); // seu pool de conexão

router.post('/enviar-mensagem', async (req, res) => {
  const { numero, mensagem, agendamento_id } = req.body;

  const resultado = await enviarViaGupshup(numero, mensagem);

  // Salva o log
  await db.query(`
    INSERT INTO logs_envios (agendamento_id, numero, mensagem, status, resposta)
    VALUES ($1, $2, $3, $4, $5)
  `, [
    agendamento_id || null,
    numero,
    mensagem,
    resultado.sucesso ? 'sucesso' : 'erro',
    JSON.stringify(resultado)
  ]);

  // Marca como enviado se sucesso
  if (resultado.sucesso && agendamento_id) {
    await db.query(`UPDATE agendamentos SET enviado = true WHERE id = $1`, [agendamento_id]);
  }

  res.status(resultado.sucesso ? 200 : 500).json(resultado);
});

module.exports = router;
