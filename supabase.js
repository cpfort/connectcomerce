// supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Validação de variáveis de ambiente
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('❌ SUPABASE_URL ou SUPABASE_KEY não definidas no arquivo .env');
}

// Inicialização do cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false // No backend não precisamos manter sessão
  },
  global: {
    headers: {
      'x-application-name': 'connectcomerce-backend'
    }
  }
});

module.exports = supabase;
