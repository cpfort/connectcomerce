const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const axios = require('axios');
const { whatsappApiUrl, token, phoneNumberId } = require('./config');

const agendamentosPath = path.join(__dirname, 'agendamentos.json');

function loadAgendamentos() {
  if (!fs.existsSync(agendamentosPath)) {
    fs.writeFileSync(agendamentosPath, '[]');
  }
  return JSON.parse(fs.readFileSync(agendamentosPath));
}

function saveAgendamentos(agendamentos) {
  fs.writeFileSync(agendamentosPath, JSON.stringify(agendamentos, null, 2));
}

function enviarMensagem(agendamento) {
  axios.post(`${whatsappApiUrl}/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    to: agendamento.numero,
    type: 'text',
    text: { body: agendamento.mensagem }
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('Mensagem enviada:', response.data);
  }).catch(error => {
    console.error('Erro ao enviar mensagem:', error.response ? error.response.data : error.message);
  });
}

function checkAndSendMessages() {
  const agendamentos = loadAgendamentos();
  agendamentos.forEach(agendamento => {
    if (!agendamento.enviado) {
      const dataEnvio = new Date(agendamento.dataEnvio);
      if (dataEnvio <= new Date()) {
        // Atrasado, envia agora
        enviarMensagem(agendamento);
        agendamento.enviado = true;
        saveAgendamentos(agendamentos);
      } else {
        // Ainda está no futuro, agenda normalmente
        schedule.scheduleJob(dataEnvio, () => {
          enviarMensagem(agendamento);
          agendamento.enviado = true;
          saveAgendamentos(agendamentos);
        });
      }
    }
  });
}


module.exports = { checkAndSendMessages, loadAgendamentos, saveAgendamentos };
