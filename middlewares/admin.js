function verificaAdmin(req, res, next) {
  if (req.session.nivel !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  }
  next();
}

module.exports = verificaAdmin;
