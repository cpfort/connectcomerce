const express = require('express');
const router = express.Router();
const { loadAgendamentos, saveAgendamentos } = require('../scheduler');

router.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).send('Acesso negado');
  }
  next();
});

router.get('/', (req, res) => {
  const agendamentos = loadAgendamentos();
  res.json(agendamentos);
});

router.post('/', (req, res) => {
  const { numero, cliente, carro, motor, placa, mensagem, dataEnvio } = req.body;
  if (!numero || !mensagem || !dataEnvio) {
    return res.status(400).send('Dados incompletos');
  }

  const agendamentos = loadAgendamentos();
  agendamentos.push({
    id: Date.now(),
    numero, cliente, carro, motor, placa, mensagem, dataEnvio, enviado: false
  });
  saveAgendamentos(agendamentos);

  res.status(201).send('Mensagem agendada com sucesso');
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { numero, cliente, carro, motor, placa, mensagem, dataEnvio } = req.body;

  let agendamentos = loadAgendamentos();
  const index = agendamentos.findIndex(a => a.id == id);

  if (index === -1) return res.status(404).send('Agendamento não encontrado');

  agendamentos[index] = {
    id: Number(id),
    numero, cliente, carro, motor, placa, mensagem, dataEnvio, enviado: false
  };

  saveAgendamentos(agendamentos);
  res.send('Agendamento atualizado com sucesso');
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  let agendamentos = loadAgendamentos();
  agendamentos = agendamentos.filter(a => a.id != id);
  saveAgendamentos(agendamentos);
  res.send('Agendamento removido com sucesso');
});

module.exports = router;

