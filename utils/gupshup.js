const axios = require('axios');

async function enviarViaGupshup(numero, mensagem) {
  try {
    const response = await axios.post('https://api.gupshup.io/sm/api/v1/msg', null, {
      params: {
        channel: 'whatsapp',
        source: process.env.GUPSHUP_SOURCE,
        destination: numero,
        message, // a mensagem editada no app
        'src.name': process.env.GUPSHUP_SRC_NAME
      },
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
