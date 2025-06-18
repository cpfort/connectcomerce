const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const pool = require('../db');
const autenticar = require('../middlewares/auth');
const path = require('path');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Página HTML
router.get('/estoque', autenticar, (req, res) => {
  res.sendFile('estoque.html', { root: 'views' });
});

// Listar estoque (JSON)
router.get('/api/estoque', autenticar, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estoque ORDER BY atualizado_em DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar estoque:', err);
    res.status(500).json({ error: 'Erro interno ao buscar estoque' });
  }
});

// Upload de planilha Excel
router.post('/api/estoque/upload', autenticar, upload.single('file'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];

    const rows = [];
    worksheet.eachRow((row, index) => {
      if (index === 1) return; 
      const serial = row.getCell(1).value;// Ignora cabeçalho
      const nome = row.getCell(1).value;
      const quantidade = parseInt(row.getCell(2).value) || 0;
      const preco = parseFloat(row.getCell(3).value) || 0;
      if (nome) {
        rows.push([serial, nome, quantidade, preco]);
      }
    });

    for (const [serial,nome, quantidade, preco] of rows) {
      await pool.query(`
        INSERT INTO estoque (serial,nome_produto, quantidade, preco)
        VALUES ($1, $2, $3, 4$)`,
        [serial, nome, quantidade, preco]
      );
    }

    res.sendStatus(201);
  } catch (err) {
    console.error('Erro ao importar planilha:', err);
    res.status(500).json({ error: 'Erro ao processar planilha' });
  }
});

// Atualizar item
router.put('/api/estoque/:id', autenticar, async (req, res) => {
  const { serial, nome_produto, quantidade, preco } = req.body;

  try {
    await pool.query(`
      UPDATE estoque SET
        serial =$1,
        nome_produto = $2,
        quantidade = $3,
        preco = $4,
        atualizado_em = NOW()
      WHERE id = $5`,
      [serial, nome_produto, quantidade, preco, req.params.id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao atualizar item:', err);
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
});

// Excluir item
router.delete('/api/estoque/:id', autenticar, async (req, res) => {
  try {
    await pool.query('DELETE FROM estoque WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Erro ao excluir item:', err);
    res.status(500).json({ error: 'Erro ao excluir item' });
  }
});

// Gerar relatório em Excel
router.get('/api/estoque/relatorio', autenticar, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estoque ORDER BY nome_produto ASC');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Relatório de Estoque');

    sheet.columns = [
      { header: 'serial', key: 'serial', width: 15 }, 
      { header: 'Produto', key: 'nome_produto', width: 30 },
      { header: 'Quantidade', key: 'quantidade', width: 15 },
      { header: 'Preço', key: 'preco', width: 15 },
      { header: 'Atualizado em', key: 'atualizado_em', width: 25 }
    ];

    result.rows.forEach(row => {
      sheet.addRow(row);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_estoque.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Erro ao gerar relatório:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

module.exports = router;
