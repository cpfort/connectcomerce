// routes/estoqueRoutes.js
const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const pool = require('../db');
const autenticar = require('../middlewares/auth');
const verificaAdmin = require('../middlewares/admin');
const supabase = require('../supabase');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // ⬅️ Necessário para ler req.file.buffer

// === Página HTML de estoque ===
router.get('/estoque', autenticar, (req, res) => {
  res.sendFile('estoque.html', { root: 'views' });
});

// === Listar itens do estoque ===
router.get('/api/estoque', autenticar, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estoque ORDER BY atualizado_em DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar estoque:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do estoque' });
  }
});

// === Upload de Excel e sincronização com PostgreSQL + Supabase ===
router.post('/api/estoque/upload', autenticar, verificaAdmin, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Arquivo não encontrado' });

    // Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('estoque')
      .upload(`uploads/${Date.now()}-${file.originalname}`, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Erro ao enviar para Supabase:', uploadError);
      return res.status(500).json({ error: 'Erro ao enviar para Supabase' });
    }

    // Processar planilha Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) return res.status(400).json({ error: 'Planilha inválida ou sem aba ativa' });

    // Inserção ou atualização no PostgreSQL
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const serial = row.getCell(1).value?.toString().trim();
      const nome = row.getCell(2).value?.toString().trim();
      const quantidade = parseInt(row.getCell(3).value) || 0;
      const preco = parseFloat(row.getCell(4).value) || 0;

      if (serial && nome) {
        await pool.query(
          `INSERT INTO estoque (serial, nome_produto, quantidade, preco)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (serial) DO UPDATE SET
             quantidade = estoque.quantidade + EXCLUDED.quantidade,
             nome_produto = EXCLUDED.nome_produto,
             preco = EXCLUDED.preco,
             atualizado_em = NOW()`,
          [serial, nome, quantidade, preco]
        );
      }
    }

    res.sendStatus(201);
  } catch (err) {
    console.error('❌ Erro geral no upload:', err);
    res.status(500).json({ error: 'Erro no processamento do arquivo' });
  }
});

// === Atualizar item (admin) ===
router.put('/api/estoque/:id', autenticar, verificaAdmin, async (req, res) => {
  const { serial, nome_produto, quantidade, preco } = req.body;

  try {
    await pool.query(
      `UPDATE estoque 
       SET serial = $1, nome_produto = $2, quantidade = $3, preco = $4, atualizado_em = NOW()
       WHERE id = $5`,
      [serial, nome_produto, quantidade, preco, req.params.id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao atualizar item:', err);
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
});

// === Deletar item (admin) ===
router.delete('/api/estoque/:id', autenticar, verificaAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM estoque WHERE id = $1', [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Erro ao deletar item:', err);
    res.status(500).json({ error: 'Erro ao deletar item' });
  }
});

// === Relatório em Excel ===
router.get('/api/estoque/relatorio', autenticar, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Erro ao gerar relatório:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

module.exports = router;
