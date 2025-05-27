const form = document.getElementById('formMensagem');
const filtro = document.getElementById('filtro');
let csrfToken = '';

Inputmask({ "mask": "+55 (99) 99999-9999" }).mask(document.getElementById('numero'));

// 🔥 Obter CSRF token
async function obterCsrfToken() {
  const res = await fetch('/api/csrf-token');
  const data = await res.json();
  csrfToken = data.csrfToken;
}

// ✅ Submit do formulário
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    numero: form.numero.value,
    cliente: form.cliente.value,
    mensagem: form.mensagem.value,
    dataEnvio: new Date(form.dataEnvio.value).toISOString(),
    ciclo: form.ciclo.value
  };

  try {
    const res = await fetch('/agendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': csrfToken
      },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (json.success) {
      alert('✅ Mensagem agendada com sucesso!');
      form.reset();
      carregarAgendamentos();
    } else {
      alert(`⚠️ Erro ao agendar: ${json.error || 'Erro desconhecido'}`);
    }
  } catch (err) {
    console.error('Erro:', err);
    alert('Erro no envio.');
  }
});

// 🔥 Carregar e aplicar filtro nos agendamentos
async function carregarAgendamentos() {
  try {
    const res = await fetch('/api/agendamentos', {
      headers: { 'CSRF-Token': csrfToken },
      credentials: 'include'
    });

    const agendamentos = await res.json();
    const container = document.getElementById('listaAgendamentos');
    container.innerHTML = '';

    if (!Array.isArray(agendamentos) || agendamentos.length === 0) {
      container.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
      return;
    }

    const filtroSelecionado = filtro.value;

    const filtrados = agendamentos.filter(ag => {
      switch (filtroSelecionado) {
        case 'pendentes':
          return ag.enviado === false && ag.visivel === true;
        case 'enviados':
          return ag.enviado === true && ag.visivel === true;
        case 'ocultos':
          return ag.visivel === false;
        case 'todos':
        default:
          return true;
      }
    });

    if (filtrados.length === 0) {
      container.innerHTML = '<p>Nenhum agendamento encontrado neste filtro.</p>';
      return;
    }

    filtrados.forEach(ag => {
      const div = document.createElement('div');
      div.className = 'agendamento' + (ag.enviado ? ' enviado' : '');
            div.innerHTML = `
        <div>
          <strong>${ag.cliente}</strong><br>
          Número: ${ag.numero}<br>
          Mensagem: ${ag.mensagem}<br>
          Data: ${new Date(ag.data_envio_texto).toLocaleString('pt-BR')}<br>
          Ciclo: ${ag.ciclo}<br>

          ${ag.ciclo !== 'nenhum' ? `<button class="cancelarCicloBtn" data-id="${ag.id}">❌</button>` : ''}
          ${ag.enviado 
            ? `<button class="ocultarHistoricoBtn" data-id="${ag.id}">📦</button>` 
            : `
              <button class="editarBtn" data-id="${ag.id}" title="Editar">✏️</button>
              <button class="removerBtn" data-id="${ag.id}">🗑️</button>
            `
          }
        </div>
      `;

      container.appendChild(div);
    });

    adicionarEventosBotoes();

  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error);
  }
}

// 🎯 Adiciona eventos nos botões de ações
function adicionarEventosBotoes() {
  // Cancelar Ciclo
  document.querySelectorAll('.cancelarCicloBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Deseja cancelar o ciclo?')) return;
      const res = await fetch(`/api/cancelar-ciclo/${id}`, {
        method: 'PUT',
        headers: { 'CSRF-Token': csrfToken }
      });
      const json = await res.json();
      if (json.success) {
        alert('✅ Ciclo cancelado!');
        carregarAgendamentos();
      }
    });
  });

  // Remover (antes de enviado)
  document.querySelectorAll('.removerBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Deseja remover este agendamento?')) return;
      const res = await fetch(`/api/agendamentos/${id}`, {
        method: 'DELETE',
        headers: { 'CSRF-Token': csrfToken }
      });
      const json = await res.json();
      if (json.success) {
        alert('✅ Agendamento removido!');
        carregarAgendamentos();
      }
    });
  });

  // Ocultar histórico (após enviado)
  document.querySelectorAll('.ocultarHistoricoBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Deseja ocultar este agendamento do histórico?')) return;
      const res = await fetch(`/api/agendamentos/ocultar-historico/${id}`, {
        method: 'PUT',
        headers: { 'CSRF-Token': csrfToken }
      });
      const json = await res.json();
      if (json.success) {
        alert('✅ Ocultado do histórico!');
        carregarAgendamentos();
      }
    });
  });
}

// 🔄 Atualiza lista quando muda filtro
filtro.addEventListener('change', carregarAgendamentos);

document.getElementById('relatorioTodos').addEventListener('click', () => baixarRelatorio('todos'));
document.getElementById('relatorioPendentes').addEventListener('click', () => baixarRelatorio('pendentes'));
document.getElementById('relatorioEnviados').addEventListener('click', () => baixarRelatorio('enviados'));
document.getElementById('relatorioOcultos').addEventListener('click', () => baixarRelatorio('ocultos'));

function baixarRelatorio(filtro) {
  window.open(`/api/relatorio?filtro=${filtro}`, '_blank');
}

// ✏️ Editar agendamento (antes de ser enviado)
document.querySelectorAll('.editarBtn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const id = btn.getAttribute('data-id');
    
    try {
      const res = await fetch(`/api/agendamentos/${id}`, {
        headers: { 'CSRF-Token': csrfToken }
      });
      const agendamento = await res.json();

      if (!agendamento) {
        alert('⚠️ Agendamento não encontrado');
        return;
      }

      const novoCliente = prompt('Editar cliente:', agendamento.cliente);
      if (novoCliente === null) return;

      const novoNumero = prompt('Editar número:', agendamento.numero);
      if (novoNumero === null) return;

      const novaMensagem = prompt('Editar mensagem:', agendamento.mensagem);
      if (novaMensagem === null) return;

      const novaData = prompt('Editar data (YYYY-MM-DD HH:MM):', agendamento.data_envio_texto.replace('T', ' ').slice(0, 16));
      if (novaData === null) return;

      const novoCiclo = prompt('Editar ciclo (nenhum, semanal, mensal, trimestral):', agendamento.ciclo);
      if (novoCiclo === null) return;

      const dataISO = new Date(novaData).toISOString();

      const atualiza = await fetch(`/api/agendamentos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          cliente: novoCliente,
          numero: novoNumero,
          mensagem: novaMensagem,
          dataEnvio: dataISO,
          ciclo: novoCiclo,
          enviado: false
        })
      });

      const json = await atualiza.json();
      if (json.success) {
        alert('✅ Agendamento atualizado!');
        carregarAgendamentos();
      } else {
        alert('⚠️ Erro ao atualizar: ' + json.message);
      }

    } catch (err) {
      console.error('Erro ao editar:', err);
      alert('Erro no servidor');
    }
  });
});



// 🚀 Inicialização
window.addEventListener('DOMContentLoaded', async () => {
  await obterCsrfToken();
  carregarAgendamentos();
});
