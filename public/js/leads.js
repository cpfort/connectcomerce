

let csrfToken = '';

async function obterCsrfToken() {
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.csrfToken;
}













async function carregarLeads() {
  const res = await fetch('/api/leads');
  const leads = await res.json();
  const tbody = document.querySelector('#tabelaLeads tbody');
  tbody.innerHTML = '';
  leads.forEach(lead => {
    const tr = document.createElement('tr');
   tr.innerHTML = `
  <td>${lead.nome}</td>
  <td>${lead.telefone}</td>
  <td>${lead.email}</td>
  <td>${lead.interesse}</td>
  <td>${lead.produto}</td>
  <td>
    <button class="btn-editar" data-id="${lead.id}">✏️</button>
    <button class="btn-excluir" data-id="${lead.id}">🗑️</button>
  </td>
    `;

    tbody.appendChild(tr);
    tr.querySelector('.btn-editar').addEventListener('click', () => editarLead(lead.id));
    tr.querySelector('.btn-excluir').addEventListener('click', () => excluirLead(lead.id));

  });
}

document.getElementById('leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  await fetch('/api/leads', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    'CSRF-Token': csrfToken
     },
    body: JSON.stringify(data)
  });
  e.target.reset();
  carregarLeads();
});

async function excluirLead(id) {
  if (!confirm('Deseja realmente excluir este lead?')) return;
 await fetch('/api/leads/' + id, {
  method: 'DELETE',
  headers: {
    'CSRF-Token': csrfToken
  }
    });
  carregarLeads();
}

async function editarLead(id) {
  const novoNome = prompt('Novo nome:');
  if (!novoNome) return;
  await fetch('/api/leads/' + id, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'CSRF-Token': csrfToken
  },
  body: JSON.stringify({ nome: novoNome })
    });
  carregarLeads();
}

window.addEventListener('DOMContentLoaded', async () => {
  await obterCsrfToken();
  carregarLeads();
});

window.editarLead = editarLead;
window.excluirLead = excluirLead;