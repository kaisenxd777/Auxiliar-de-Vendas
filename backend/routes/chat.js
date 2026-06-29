/**
 * Rota do Assistente Comercial GPT — única função que de fato
 * precisa de backend: falar com a OpenAI sem expor a chave.
 * O frontend (assistant/gpt-adapter.js) chama POST /api/chat.
 */
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/chat
// Body: { mensagem, historico, promptSistema }
router.post('/', async (req, res) => {
  const { mensagem, historico = [], promptSistema } = req.body;

  if (!mensagem) {
    return res.status(400).json({ erro: 'Campo "mensagem" é obrigatório.' });
  }

  try {
    const mensagens = [
      { role: 'system', content: promptSistema || 'Você é um assistente comercial objetivo.' },
      ...historico.slice(-10).map(h => ({
        role: h.autor === 'user' ? 'user' : 'assistant',
        content: h.texto,
      })),
      { role: 'user', content: mensagem },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: mensagens,
      temperature: 0.4,
      max_tokens: 500,
    });

    const resposta = completion.choices[0].message.content;
    res.json({ resposta, acoes: [] });
  } catch (err) {
    console.error('[OpenAI] erro:', err.message);
    res.status(500).json({ erro: 'Falha ao consultar a OpenAI.' });
  }
});

module.exports = router;
