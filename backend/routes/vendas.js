/**
 * Rotas de vendas — CRUD completo conectado ao Supabase.
 * Espelha as operações que o Store (script1.js) já faz no
 * localStorage: addSale, deleteSale, updateSale, listar, reset.
 */
const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET /api/vendas — lista todas as vendas
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .order('date', { ascending: false });

  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
});

// POST /api/vendas — cria uma nova venda
// Body: { product, value, commission, rate, type, date, qty }
router.post('/', async (req, res) => {
  const { product, value, commission, rate, type, date, qty } = req.body;

  if (!product || value === undefined || commission === undefined) {
    return res.status(400).json({ erro: 'Campos obrigatórios: product, value, commission.' });
  }

  const { data, error } = await supabase
    .from('vendas')
    .insert([{ product, value, commission, rate, type, date, qty }])
    .select();

  if (error) return res.status(500).json({ erro: error.message });
  res.status(201).json(data[0]);
});

// PUT /api/vendas/:id — atualiza uma venda existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { product, value, commission, rate, type, date, qty } = req.body;

  const { data, error } = await supabase
    .from('vendas')
    .update({ product, value, commission, rate, type, date, qty })
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ erro: error.message });
  if (!data.length) return res.status(404).json({ erro: 'Venda não encontrada.' });
  res.json(data[0]);
});

// DELETE /api/vendas/:id — remove uma venda
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('vendas').delete().eq('id', id);

  if (error) return res.status(500).json({ erro: error.message });
  res.status(204).send();
});

// DELETE /api/vendas — remove TODAS as vendas (equivalente ao resetSales)
router.delete('/', async (req, res) => {
  const { error } = await supabase.from('vendas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) return res.status(500).json({ erro: error.message });
  res.status(204).send();
});

module.exports = router;
