const axios = require('axios');

async function enviarViaGupshup(numero, mensagem) {
  try {
    const params = new URLSearchParams();
    params.append('channel', 'whatsapp');
    params.append('source', process.env.GUPSHUP_SOURCE);
    params.append('destination', numero);
    params.append('message', mensagem);
    params.append('src.name', process.env.GUPSHUP_SRC_NAME);

    const response = await axios.post('https://api.gupshup.io/sm/api/v1/msg', params.toString(), {
      headers: {
        apikey: process.env.GUPSHUP_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return { sucesso: true, data: response.data };
  } catch (err) {
    return {
      sucesso: false,
      erro: err.response?.data || err.message
    };
  }
}

module.exports = { enviarViaGupshup };
