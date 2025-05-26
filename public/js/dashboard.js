const form = document.getElementById('formMensagem');

// Máscaras (Inputmask já está sendo carregado via script externo seguro)
Inputmask({"mask": "+55 (99) 99999-9999"}).mask(document.getElementById('numero'));
//Inputmask({"mask": "AAA-9A99"}).mask(document.getElementById('placa'));



form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const inputData = form.dataEnvio.value; // valor do input tipo "2025-05-14T01:59"
  const dataLocal = new Date(inputData);
  const dataUTC = dataLocal.toISOString(); // converte para ISO UTC "2025-05-14T04:59:00.000Z"

  const data = {
    numero: form.numero.value,
    cliente: form.cliente.value,
    carro: form.carro.value,
    motor: form.motor.value,
    placa: form.placa.value,
    mensagem: form.mensagem.value,
    dataEnvio: dataUTC
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
      carregarAgendamentos(); // atualiza lista
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
    const agendamentosFuturos = agendamentos.filter(ag => !ag.enviado);


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
    <div>${ag.numero} | ${ag.placa} | ${ag.carro}</div>
    <div><em>${new Date(ag.data_envio_texto).toLocaleString('pt-BR')}</em></div>
    <div>${ag.mensagem}</div>
    ${!ag.enviado ? `<button class="removerBtn" data-id="${ag.id}">🗑️ Remover</button>` : ''}
      `;
      container.appendChild(div);
    });

    // Atualiza também o outro container, se existir
    const cards = document.getElementById('agendamentosContainer');
    if (cards) {
      cards.innerHTML = '';
      agendamentos.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('card-agendamento');
        card.innerHTML = `
          <p><span class="info">Cliente:</span> ${item.cliente}</p>
          <p><span class="info">Número:</span> ${item.numero}</p>
          <p><span class="info">Carro:</span> ${item.carro}</p>
          <p><span class="info">Motor:</span> ${item.motor}</p>
          <p><span class="info">Placa:</span> ${item.placa}</p>
          <p><span class="info">Mensagem:</span> ${item.mensagem}</p>
          <p><span class="info">Agendado para:</span> ${new Date(item.data_envio_texto).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
          <p><span class="info">Status:</span> ${item.enviado ? '✅ Enviado' : '⌛ Pendente'}</p>
        `;
        cards.appendChild(card);
      });
    }

  } catch (err) {
    console.error('Erro ao carregar agendamentos:', err);
  }

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

}

// Inicia carregamento dos agendamentos
window.addEventListener('DOMContentLoaded', carregarAgendamentos);


document.getElementById('btnRemoverFuturas').addEventListener('click', async () => {
  if (!confirm('Tem certeza que deseja remover todas as mensagens futuras que ainda não foram enviadas?')) return;

  try {
    const res = await fetch('/api/agendamentos/futuros', {
      method: 'DELETE',
      headers: {
        'CSRF-Token': document.getElementById('csrfToken').value
      }
    });

    const json = await res.json();
    if (json.success) {
      alert(`✅ ${json.removidos} mensagens futuras foram removidas`);
      carregarAgendamentos(); // Atualiza a lista
    } else {
      alert('⚠️ Falha ao remover mensagens futuras');
    }
  } catch (err) {
    console.error('Erro ao remover futuras:', err);
    alert('Erro ao processar a remoção');
  }
});
