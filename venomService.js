const venom = require('venom-bot');

let client;

async function iniciarVenom() {
  client = await venom.create('session-name');
  console.log('Venom Bot iniciado!');
}

async function enviarViaVenom(numero, mensagem) {
  if (!client) {
    throw new Error('Venom client não iniciado');
  }
  try {
    await client.sendText(numero, mensagem);
    return { sucesso: true };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

module.exports = { iniciarVenom, enviarViaVenom };
