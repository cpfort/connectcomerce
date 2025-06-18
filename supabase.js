// supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
// Use aqui a Service Role Key
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas no .env');
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY, // chave que ignora RLS
  {
    auth: { persistSession: false },
    global: { headers: { 'x-application-name': 'connectcomerce-backend' } }
  }
);

module.exports = supabase;
