
const express = require('express');
const router = express.Router();
const pool = require('../db');
const autenticar = require('../middlewares/auth');

router.get('/leads', autenticar, (req, res) => {
  res.sendFile('leads.html', { root: 'views' });
});

router.get('/api/leads', autenticar, async (req, res) => {
  const result = await pool.query('SELECT * FROM leads ORDER BY criado_em DESC');
  res.json(result.rows);
});

router.post('/api/leads', autenticar, async (req, res) => {
  const { nome, telefone, email, interesse, produto } = req.body;
  await pool.query(`
    INSERT INTO leads (nome, telefone, email, interesse, produto)
    VALUES ($1, $2, $3, $4, $5)`, [nome, telefone, email, interesse, produto]);
  res.sendStatus(201);
});

router.delete('/api/leads/:id', autenticar, async (req, res) => {
  await pool.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
  res.sendStatus(204);
});

router.put('/api/leads/:id', autenticar, async (req, res) => {
 const { nome, telefone, email, interesse, produto } = req.body;
await pool.query(`
  UPDATE leads SET 
    nome = COALESCE($1, nome),
    telefone = COALESCE($2, telefone),
    email = COALESCE($3, email),
    interesse = COALESCE($4, interesse),
    produto = COALESCE($5, produto)
  WHERE id = $6
`, [nome, telefone, email, interesse, produto, req.params.id]);

});

module.exports = router;
