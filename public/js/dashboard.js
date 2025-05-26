const form = document.getElementById('formMensagem');

Inputmask({"mask": "+55 (99) 99999-9999"}).mask(document.getElementById('numero'));

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
        'CSRF-Token': document.getElementById('csrfToken').value
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


async function carregarAgendamentos() {
  try {
    const res = await fetch('/api/agendamentos');
    const agendamentos = await res.json();

    const container = document.getElementById('listaAgendamentos');
    container.innerHTML = '';

    if (agendamentos.length === 0) {
      container.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
      return;
    }

    agendamentos.forEach(ag => {
      const div = document.createElement('div');
      div.className = 'agendamento' + (ag.enviado ? ' enviado' : '');
      div.innerHTML = `
        <strong>${ag.cliente}</strong>
        <div>${ag.numero}</div>
        <div><em>${new Date(ag.data_envio_texto).toLocaleString('pt-BR')}</em></div>
        <div>${ag.mensagem}</div>
        ${!ag.enviado ? `<button class="removerBtn" data-id="${ag.id}">🗑️ Remover</button>` : ''}
      `;
      container.appendChild(div);
    });

    document.querySelectorAll('.removerBtn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Deseja remover este agendamento?')) return;

        try {
          const res = await fetch(`/api/agendamentos/${id}`, {
            method: 'DELETE',
            headers: {
              'CSRF-Token': document.getElementById('csrfToken').value
            }
          });
          const json = await res.json();
          if (json.success) {
            alert('✅ Agendamento removido');
            carregarAgendamentos();
          } else {
            alert('⚠️ Erro ao remover agendamento');
          }
        } catch (err) {
          console.error('Erro ao remover agendamento:', err);
          alert('Erro no servidor');
        }
      });
    });
  } catch (err) {
    console.error('Erro ao carregar agendamentos:', err);
  }
}

// Inicia carregamento dos agendamentos quando a página abre
window.addEventListener('DOMContentLoaded', carregarAgendamentos);
