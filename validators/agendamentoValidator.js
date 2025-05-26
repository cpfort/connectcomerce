const Joi = require('joi');

const agendamentoSchema = Joi.object({
  numero: Joi.string()
    .pattern(/^\+?[0-9\s()-]{10,20}$/)
    .required(),

  cliente: Joi.string().min(2).max(100).required(),

  mensagem: Joi.string().min(3).max(1000).required(),

  dataEnvio: Joi.date()
    .required()
    .custom((value, helpers) => {
      const agora = new Date();
      const margem = 2 * 60 * 1000;
      if (value.getTime() < agora.getTime() + margem) {
        return helpers.message('A data deve ser pelo menos 2 minutos no futuro');
      }
      return value;
    }),

  ciclo: Joi.string().valid('nenhum', 'semanal', 'mensal', 'trimestral').default('nenhum'),

  enviado: Joi.boolean().optional()
});

module.exports = agendamentoSchema;
