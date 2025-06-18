require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_KEY não definidas.');
  throw new Error('Variáveis de ambiente do Supabase ausentes.');
}

const supabase = createClient(supabaseUrl, supabaseKey);
module.exports = supabase;
