/**
 * Cliente Supabase do backend.
 * Usa a SERVICE_ROLE_KEY — tem acesso total ao banco, por isso
 * SÓ pode existir aqui no servidor. Nunca exponha essa chave no
 * frontend (ela ignora qualquer Row Level Security).
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
