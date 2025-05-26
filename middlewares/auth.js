function autenticar(req, res, next) {
  if (!req.session.authenticated) {
    return res.status(403).json({ error: 'Não autorizado' });
  }
  next();
}

module.exports = autenticar;
