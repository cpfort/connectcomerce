async function carregarEstoque() {
  const res = await fetch('/api/estoque');
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
        <button class="salvar" data-id="${item.id}">💾</button>
        <button class="excluir" data-id="${item.id}">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Reatribui eventos de clique nos botões
  document.querySelectorAll('.salvar').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const tr = btn.closest('tr');
      const nome_produto = tr.querySelector('[data-key="nome_produto"]').innerText.trim();
      const quantidade = parseInt(tr.querySelector('[data-key="quantidade"]').innerText);
      const preco = parseFloat(tr.querySelector('[data-key="preco"]').innerText);

      await fetch('/api/estoque/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_produto, quantidade, preco })
      });

      carregarEstoque();
    });
  });

  document.querySelectorAll('.excluir').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Deseja realmente excluir este item?')) return;
      await fetch('/api/estoque/' + id, { method: 'DELETE' });
      carregarEstoque();
    });
  });
}

// Upload do Excel
document.getElementById('excelFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/estoque/upload', {
    method: 'POST',
    body: formData
  });

  e.target.value = '';
  carregarEstoque();
});

// Exportar como Excel
function baixarRelatorio() {
  window.open('/api/estoque/relatorio', '_blank');
}

// Inicia
window.addEventListener('DOMContentLoaded', carregarEstoque);
