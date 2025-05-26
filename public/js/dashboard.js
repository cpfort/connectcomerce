const form = document.getElementById('formMensagem');
let csrfToken = '';

Inputmask({ "mask": "+55 (99) 99999-9999" }).mask(document.getElementById('numero'));

// 🔥 Buscar CSRF token no carregamento
async function obterCsrfToken() {
  const res = await fetch('/api/csrf-token');
  const data = await res.json();
  csrfToken = data.csrfToken;
}

// 🧠 Submit do formulário
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

// 🔥 Carregar agendamentos
async function carregarAgendamentos() {
  try {
    const res = await fetch('/api/agendamentos', {
      headers: {
        'CSRF-Token': csrfToken
      },
      credentials: 'include'
    });

    if (res.status === 403) {
      throw new Error('Acesso negado: verifique login e token CSRF');
    }

    if (!res.ok) {
      throw new Error(`Erro na requisição: ${res.status}`);
    }

    const agendamentos = await res.json();

    const container = document.getElementById('listaAgendamentos');
    container.innerHTML = '';

    if (!Array.isArray(agendamentos) || agendamentos.length === 0) {
      container.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
      return;
    }

    agendamentos.forEach(ag => {
      const div = document.createElement('div');
      div.className = 'agendamento' + (ag.enviado ? ' enviado' : '');
      div.innerHTML = `
        <div>
          <strong>${ag.cliente}</strong><br>
          Número: ${ag.numero}<br>
          Mensagem: ${ag.mensagem}<br>
          Data: ${new Date(ag.data_envio_texto).toLocaleString('pt-BR')}<br>
          Ciclo: ${ag.ciclo}<br>

          ${ag.ciclo !== 'nenhum' ? `<button class="cancelarCicloBtn" data-id="${ag.id}">❌ Cancelar Ciclo</button>` : ''}
          ${ag.enviado 
            ? `<button class="ocultarHistoricoBtn" data-id="${ag.id}">📦 Ocultar do Histórico</button>` 
            : `<button class="ocultarBtn" data-id="${ag.id}">🗑️ Ocultar</button>`
          }
        </div>
      `;

      container.appendChild(div);
    });

    // 🔥 Botão cancelar ciclo
    document.querySelectorAll('.cancelarCicloBtn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Deseja cancelar o ciclo deste agendamento?')) return;
        try {
          const res = await fetch(`/api/cancelar-ciclo/${id}`, {
            method: 'PUT',
            headers: { 'CSRF-Token': csrfToken }
          });
          const json = await res.json();
          if (json.success) {
            alert('✅ Ciclo cancelado');
            carregarAgendamentos();
          } else {
            alert('⚠️ Erro ao cancelar ciclo: ' + json.message);
          }
        } catch (err) {
          console.error('Erro ao cancelar ciclo:', err);
          alert('Erro no servidor');
        }
      });
    });

    // 🔥 Ocultar (não enviado)
    document.querySelectorAll('.ocultarBtn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Deseja ocultar este agendamento?')) return;
        try {
          const res = await fetch(`/api/agendamentos/ocultar/${id}`, {
            method: 'PUT',
            headers: { 'CSRF-Token': csrfToken }
          });
          const json = await res.json();
          if (json.success) {
            alert('✅ Agendamento ocultado');
            carregarAgendamentos();
          } else {
            alert('⚠️ Erro ao ocultar: ' + json.message);
          }
        } catch (err) {
          console.error('Erro ao ocultar:', err);
          alert('Erro no servidor');
        }
      });
    });

    // 🔥 Ocultar do histórico (enviado)
    document.querySelectorAll('.ocultarHistoricoBtn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Deseja ocultar este agendamento do histórico?')) return;
        try {
          const res = await fetch(`/api/agendamentos/ocultar-historico/${id}`, {
            method: 'PUT',
            headers: { 'CSRF-Token': csrfToken }
          });
          const json = await res.json();
          if (json.success) {
            alert('✅ Agendamento ocultado do histórico');
            carregarAgendamentos();
          } else {
            alert('⚠️ Erro ao ocultar do histórico: ' + json.message);
          }
        } catch (err) {
          console.error('Erro ao ocultar do histórico:', err);
          alert('Erro no servidor');
        }
      });
    });

  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error);
  }
}

// 🚀 Inicia
window.addEventListener('DOMContentLoaded', async () => {
  await obterCsrfToken();
  carregarAgendamentos();
});
