const express = require('express');
const multer = require('multer');
const pool = require('../db');
const autenticar = require('../middlewares/auth');
const verificaAdmin = require('../middlewares/admin');
const supabase = require('../supabase');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Arquivos vão para RAM temporariamente

router.get('/estoque', autenticar, (req, res) => {
  res.sendFile('estoque.html', { root: 'views' });
});

router.get('/api/estoque', autenticar, async (req, res) => {
  const result = await pool.query('SELECT * FROM estoque ORDER BY atualizado_em DESC');
  res.json(result.rows);
});

router.post('/api/estoque/upload', autenticar, verificaAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });

    const nomeArquivo = `estoque-${Date.now()}.xlsx`;

    const { data, error } = await supabase.storage
      .from('estoque')
      .upload(nomeArquivo, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('❌ Erro ao enviar para Supabase:', error);
      return res.status(500).json({ error: 'Erro ao salvar no Supabase' });
    }

    const { data: urlData } = supabase.storage.from('estoque').getPublicUrl(nomeArquivo);

    res.json({ success: true, fileUrl: urlData.publicUrl });
  } catch (err) {
    console.error('❌ Erro geral no upload:', err);
    res.status(500).json({ error: 'Erro interno no upload' });
  }
});

router.put('/api/estoque/:id', autenticar, verificaAdmin, async (req, res) => {
  const { serial, nome_produto, quantidade, preco } = req.body;
  await pool.query(
    'UPDATE estoque SET serial = $1, nome_produto = $2, quantidade = $3, preco = $4, atualizado_em = NOW() WHERE id = $5',
    [serial, nome_produto, quantidade, preco, req.params.id]
  );
  res.sendStatus(200);
});

router.delete('/api/estoque/:id', autenticar, verificaAdmin, async (req, res) => {
  await pool.query('DELETE FROM estoque WHERE id = $1', [req.params.id]);
  res.sendStatus(204);
});

router.get('/api/estoque/relatorio', autenticar, async (req, res) => {
  const ExcelJS = require('exceljs');
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