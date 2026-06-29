require('dotenv').config();
const express = require('express');
const cors = require('cors');

const vendasRoutes = require('./routes/vendas');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

// Libera CORS apenas para as origens definidas no .env
const origensPermitidas = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: origensPermitidas.length ? origensPermitidas : '*',
}));
app.use(express.json());

// Rota de teste — confirma que o servidor está de pé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/vendas', vendasRoutes);
app.use('/api/chat', chatRoutes);

app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
  console.log(`   Teste: http://localhost:${PORT}/api/health`);
});
