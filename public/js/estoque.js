let csrfToken = '';

async function obterCsrfToken() {
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.csrfToken;
}

async function carregarEstoque() {
  const res = await fetch('/api/estoque', { credentials: 'include' });
  const dados = await res.json();
  const tbody = document.querySelector('#tabelaEstoque tbody');
  tbody.innerHTML = '';

  dados.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td contenteditable="true" data-key="nome_produto">${item.nome_produto}</td>
      <td contenteditable="true" data-key="quantidade">${item.quantidade}</td>
      <td contenteditable="true" data-key="preco">${item.preco}</td>
      <td>
        <button class="salvar" data-id="${item.id}">Editar</button>
        <button class="excluir" data-id="${item.id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.salvar').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const tr = btn.closest('tr');
      const nome_produto = tr.querySelector('[data-key="nome_produto"]').innerText.trim();
      const quantidade = parseInt(tr.querySelector('[data-key="quantidade"]').innerText);
      const preco = parseFloat(tr.querySelector('[data-key="preco"]').innerText);

      console.log('Salvando ID:', id, { nome_produto, quantidade, preco });

      await fetch('/api/estoque/' + id, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        body: JSON.stringify({ nome_produto, quantidade, preco })
      });

      carregarEstoque();
    });
  });

  document.querySelectorAll('.excluir').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Deseja realmente excluir este item?')) return;

      await fetch('/api/estoque/' + id, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'CSRF-Token': csrfToken
        }
      });

      carregarEstoque();
    });
  });
}

document.getElementById('excelFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/estoque/upload', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'CSRF-Token': csrfToken
    },
    body: formData
  });

  e.target.value = '';
  carregarEstoque();
});

function baixarRelatorio() {
  window.open('/api/estoque/relatorio', '_blank');
}

window.addEventListener('DOMContentLoaded', async () => {
  await obterCsrfToken();
  carregarEstoque();
});
