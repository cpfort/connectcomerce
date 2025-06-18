
const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const pool = require('../db');
const autenticar = require('../middlewares/auth');
const path = require('path');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // compatível com Railway

router.get('/estoque', autenticar, (req, res) => {
  res.sendFile('estoque.html', { root: 'views' });
});

router.get('/api/estoque', autenticar, async (req, res) => {
  const result = await pool.query('SELECT * FROM estoque ORDER BY atualizado_em DESC');
  res.json(result.rows);
});

router.post('/api/estoque/upload', autenticar, upload.single('file'), async (req, res) => {
  try {
    console.log('📥 Arquivo recebido:', req.file);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      console.error('❌ Planilha inválida');
      return res.status(400).json({ error: 'Planilha inválida ou vazia' });
    }

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const serial = row.getCell(1).value;
      const nome = row.getCell(2).value;
      const quantidade = parseInt(row.getCell(3).value) || 0;
      const preco = parseFloat(row.getCell(4).value) || 0;

      console.log(`[Linha ${i}]`, { serial, nome, quantidade, preco });

      if (nome) {
        await pool.query(
          'INSERT INTO estoque (serial, nome_produto, quantidade, preco) VALUES ($1, $2, $3, $4)',
          [serial, nome, quantidade, preco]
        );
      }
    }

    res.sendStatus(201);
  } catch (err) {
    console.error('❌ Erro ao processar upload:', err);
    res.status(500).json({ error: 'Erro interno no upload' });
  }
});


router.put('/api/estoque/:id', autenticar, async (req, res) => {
  const { serial, nome_produto, quantidade, preco } = req.body;
  await pool.query(
    'UPDATE estoque SET serial = $1, nome_produto = $2, quantidade = $3, preco = $4, atualizado_em = NOW() WHERE id = $5',
    [serial, nome_produto, quantidade, preco, req.params.id]
  );
  res.sendStatus(200);
});

router.delete('/api/estoque/:id', autenticar, async (req, res) => {
  await pool.query('DELETE FROM estoque WHERE id = $1', [req.params.id]);
  res.sendStatus(204);
});

router.get('/api/estoque/relatorio', autenticar, async (req, res) => {
  const result = await pool.query('SELECT * FROM estoque ORDER BY nome_produto ASC');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Relatorio_Estoque');
  sheet.columns = [
    { header: 'Serial', key: 'serial', width: 20 },
    { header: 'Produto', key: 'nome_produto', width: 30 },
    { header: 'Quantidade', key: 'quantidade', width: 15 },
    { header: 'Preço', key: 'preco', width: 15 },
    { header: 'Atualizado em', key: 'atualizado_em', width: 25 }
  ];
  result.rows.forEach(row => sheet.addRow(row));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=relatorio_estoque.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
