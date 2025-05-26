const Joi = require('joi');

const agendamentoSchema = Joi.object({
  numero: Joi.string()
    .pattern(/^\+?[0-9\s()-]{10,20}$/)
    .required(),

  cliente: Joi.string().min(2).max(100).required(),

  carro: Joi.string().min(1).max(100).required(),

  motor: Joi.string().min(1).max(50).required(),

  placa: Joi.string().max(10).required(),

  mensagem: Joi.string().min(3).max(1000).required(),

  dataEnvio: Joi.date()
    .required()
    .custom((value, helpers) => {
      const agora = new Date();
      const margem = 2 * 60 * 1000; // 2 minutos
      if (value.getTime() < agora.getTime() + margem) {
        return helpers.message('A data deve ser pelo menos 2 minutos no futuro');
      }
      return value;
    }),

  enviado: Joi.boolean().optional()
});

module.exports = agendamentoSchema;

