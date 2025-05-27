require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const csurf = require('csurf');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const pool = require('./db');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const agendamentoSchema = require('./validators/agendamentoValidator');
const autenticar = require('./middlewares/auth');
const ExcelJS = require('exceljs');




const app = express();
const PORT = process.env.PORT || 8080;

// Teste de conexão com o banco
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ ERRO NA CONEXÃO COM O BANCO:', err);
  } else {
    console.log('✅ BANCO CONECTADO:', result.rows[0].now);
  }
});

// ========== SEGURANÇA ==========
app.set('trust proxy', 1);
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  store: new pgSession({ pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 2 // 2 horas
  }
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições deste IP. Tente mais tarde.'
}));

// ========== CSRF ==========
app.use(csurf());
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});


// ========== STATIC ==========
app.use(express.static('public'));

// ========== ROTA TOKEN ==========
app.get('/api/csrf-token', (req, res) => {
  res.json({
    csrfToken: req.csrfToken(),
    authenticated: !!req.session.authenticated
  });
});
//==============================
app.get('/', (req, res) => {
  if (req.session.authenticated) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

//==========================
app.get('/login', (req, res) => {
  fs.readFile(path.join(__dirname, 'views', 'login.html'), 'utf8', (err, html) => {
    if (err) return res.status(500).send('Erro ao carregar o login');
    const htmlComToken = html.replace('%%CSRF_TOKEN%%', req.csrfToken());
    res.send(htmlComToken);
  });
});
// ========== LOGIN ==========
app.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);

    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
    }

    const usuarioBanco = result.rows[0];

    const senhaCorreta = await bcrypt.compare(senha, usuarioBanco.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ success: false, message: 'Senha incorreta' });
    }

    req.session.authenticated = true;
    res.json({ success: true });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).send('Erro interno');
  }
});

// ========== LOGOUT ==========
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
      return res.status(500).send('Erro ao sair');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login'); // ou outra página de login
  });
});


// ========== DASHBOARD ==========
app.get('/dashboard', (req, res) => {
  fs.readFile(path.join(__dirname, 'views', 'dashboard.html'), 'utf8', (err, html) => {
    if (err) return res.status(500).send('Erro ao carregar o dashboard');
    const htmlComToken = html.replace('%%CSRF_TOKEN%%', req.csrfToken());
    res.send(htmlComToken);
  });
});



// ========== AGENDAR ==========
app.post('/agendar', autenticar, async (req, res) => {
  try {
    const recebida = req.body.dataEnvio;
    const recebidaDateLocal = new Date(recebida);
    const recebidaUTC = new Date(recebidaDateLocal.getTime() - recebidaDateLocal.getTimezoneOffset() * 60000);

    req.body.dataEnvio = recebidaUTC.toISOString();

    console.log('==============================');
    console.log('🕓 Data original do cliente:', recebida);
    console.log('🕓 Convertida para UTC:', req.body.dataEnvio);
    console.log('==============================');

    const { error, value } = agendamentoSchema.validate(req.body);
    if (error) {
      console.error('❌ Erro de validação Joi:', error.details);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { numero, cliente, mensagem, dataEnvio, ciclo } = value;

    const result = await pool.query(
      `INSERT INTO agendamentos (numero, cliente, mensagem, data_envio_texto, ciclo, enviado)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [numero, cliente, mensagem, dataEnvio.toISOString(), ciclo]
    );

    res.status(200).json({ success: true, agendamento: result.rows[0] });

  } catch (err) {
    console.error('Erro ao agendar:', err);
    res.status(500).json({ success: false, error: 'Erro ao salvar agendamento' });
  }
});



// ========== LISTAR AGENDAMENTOS ==========
// Exemplo no server.js ou routes.js
app.get('/api/agendamentos', autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM agendamentos WHERE visivel = true ORDER BY data_envio_texto ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});


//== enviado
app.put('/api/agendamentos/ocultar-historico/:id', autenticar, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE agendamentos SET visivel = false WHERE id = $1 AND enviado = true RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado ou não foi enviado' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao ocultar do histórico:', err);
    res.status(500).json({ success: false, error: 'Erro ao ocultar do histórico' });
  }
});

// ✅ DELETE de verdade no banco, só se NÃO foi enviado
app.delete('/api/agendamentos/:id', autenticar, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM agendamentos WHERE id = $1 AND enviado = false RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado ou já foi enviado' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao remover agendamento:', err);
    res.status(500).json({ success: false, error: 'Erro ao remover agendamento' });
  }
});

//==== relatiro dinamico
app.get('/api/relatorio', autenticar, async (req, res) => {
  const filtro = req.query.filtro || 'todos';

  try {
    let query = 'SELECT * FROM agendamentos';
    const params = [];

    if (filtro === 'pendentes') {
      query += ' WHERE enviado = false AND visivel = true';
    } else if (filtro === 'enviados') {
      query += ' WHERE enviado = true AND visivel = true';
    } else if (filtro === 'ocultos') {
      query += ' WHERE visivel = false';
    } else if (filtro === 'todos') {
      // Sem where
    }

    query += ' ORDER BY data_envio_texto ASC';

    const result = await pool.query(query, params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatorio_Agendamentos');

    // Cabeçalho
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Cliente', key: 'cliente', width: 20 },
      { header: 'Número', key: 'numero', width: 20 },
      { header: 'Mensagem', key: 'mensagem', width: 50 },
      { header: 'Data de Envio', key: 'data_envio_texto', width: 25 },
      { header: 'Ciclo', key: 'ciclo', width: 15 },
      { header: 'Enviado', key: 'enviado', width: 10 },
      { header: 'Visível', key: 'visivel', width: 10 },
    ];

    // Dados
    result.rows.forEach(ag => {
      worksheet.addRow({
        id: ag.id,
        cliente: ag.cliente,
        numero: ag.numero,
        mensagem: ag.mensagem,
        data_envio_texto: ag.data_envio_texto,
        ciclo: ag.ciclo,
        enviado: ag.enviado ? 'Sim' : 'Não',
        visivel: ag.visivel ? 'Sim' : 'Não'
      });
    });

    // Response
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio-agendamentos.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Erro ao gerar relatório:', err);
    res.status(500).send('Erro ao gerar relatório');
  }
});

//====buscar agendamento no banco======
//Buscar agendamento por ID
app.get('/api/agendamentos/:id', autenticar, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM agendamentos WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar agendamento:', err);
    res.status(500).json({ success: false, error: 'Erro ao buscar agendamento' });
  }
});
//==ocultar de proteção=====

app.post('/ocultar', autenticar, async (req, res) => {
  const { id } = req.body;
  try {
    const resultado = await pool.query('SELECT * FROM agendamentos WHERE id = $1', [id]);
    const agendamento = resultado.rows[0];

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    if (!agendamento.enviado) {
      return res.status(400).json({ error: 'Não é possível ocultar uma mensagem que ainda não foi enviada.' });
    }

    if (agendamento.ciclo !== 'nenhum') {
      return res.status(400).json({ error: 'Não é possível ocultar uma mensagem que está em ciclo.' });
    }

    await pool.query('DELETE FROM agendamentos WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao ocultar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


//====ocultar agendamento====//
app.put('/api/agendamentos/ocultar/:id', autenticar, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE agendamentos SET visivel = false WHERE id = $1 AND enviado = false RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado ou já foi enviado' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao ocultar agendamento:', err);
    res.status(500).json({ success: false, error: 'Erro ao ocultar agendamento' });
  }
});







//====================cenelar ciclo==============
app.put('/api/cancelar-ciclo/:id', autenticar, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE agendamentos SET ciclo = $1 WHERE id = $2 RETURNING *',
      ['nenhum', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    }

    res.json({ success: true, agendamento: result.rows[0] });
  } catch (err) {
    console.error('Erro ao cancelar ciclo:', err);
    res.status(500).json({ success: false, error: 'Erro ao cancelar ciclo' });
  }
});





// ========== EDITAR AGENDAMENTO ==========
app.put('/api/agendamentos/:id', autenticar, async (req, res) => {
  const { error, value } = agendamentoSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const { numero, cliente, mensagem, dataEnvio, ciclo, enviado } = value;

    const result = await pool.query(
      `UPDATE agendamentos SET
        numero = $1,
        cliente = $2,
        mensagem = $3,
        data_envio_texto = $4,
        ciclo = $5,
        enviado = $6
      WHERE id = $7 RETURNING *`,
      [numero, cliente, mensagem, dataEnvio, ciclo, enviado, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Agendamento não encontrado');
    }

    res.json({ success: true, agendamento: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao atualizar agendamento');
  }
});







// ========== START ==========
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});


//======================setinterval===================
setInterval(async () => {
  const agora = new Date();
  console.log(`[TIMER] Verificando mensagens até ${agora.toISOString()}`);

  try {
    const { rows } = await pool.query(`
      SELECT * FROM agendamentos 
      WHERE enviado = false
    `);

    const agendamentosValidos = rows.filter(ag => {
      try {
        if (!ag.data_envio_texto) return false;
        const data = new Date(ag.data_envio_texto);
        if (isNaN(data.getTime())) {
          console.error(`❌ Data inválida no agendamento ID ${ag.id}:`, ag.data_envio_texto);
          return false;
        }
        return data <= agora;
      } catch (e) {
        console.error(`❌ Erro ao processar agendamento ID ${ag.id}:`, e);
        return false;
      }
    });

    if (agendamentosValidos.length === 0) {
      console.log('[TIMER] Nenhuma mensagem para enviar.');
      return;
    }

    for (const ag of agendamentosValidos) {
      console.log(`📤 Enviando para ${ag.numero}: ${ag.mensagem}`);

      await pool.query(
        'UPDATE agendamentos SET enviado = true WHERE id = $1',
        [ag.id]
      );

      console.log(`✅ Marcado como enviado (ID ${ag.id})`);
    }

  } catch (err) {
    console.error('❌ Erro no envio automático:', err);
  }
}, 60 * 1000); // Executa a cada 60 segundos
