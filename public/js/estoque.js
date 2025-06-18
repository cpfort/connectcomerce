let csrfToken = '';
let nivelUsuario = 'usuario'; // padrão

async function obterCsrfToken() {
  try {
    const res = await fetch('/api/csrf-token', { credentials: 'include' });
    const data = await res.json();
    csrfToken = data.csrfToken;
    nivelUsuario = data.nivel || 'usuario';
  } catch (err) {
    console.error('Erro ao obter CSRF token:', err);
  }
}

async function carregarEstoque() {
  try {
    const res = await fetch('/api/estoque', { credentials: 'include' });
    if (!res.ok) throw new Error('Falha ao carregar estoque');
    const dados = await res.json();

    const tbody = document.querySelector('#tabelaEstoque tbody');
    tbody.innerHTML = '';

    dados.forEach(item => {
      const editable = (nivelUsuario === 'admin') ? 'contenteditable="true"' : '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td ${editable} data-key="serial">${item.serial || ''}</td>
        <td ${editable} data-key="nome_produto">${item.nome_produto}</td>
        <td ${editable} data-key="quantidade">${item.quantidade}</td>
        <td ${editable} data-key="preco">${item.preco}</td>
        <td>
          ${nivelUsuario === 'admin' ? `
            <button class="salvar" data-id="${item.id}">Salvar</button>
            <button class="excluir" data-id="${item.id}">Excluir</button>
          ` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (nivelUsuario === 'admin') {
      document.querySelectorAll('.salvar').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const tr = btn.closest('tr');

          const serial = tr.querySelector('[data-key="serial"]').innerText.trim();
          const nome_produto = tr.querySelector('[data-key="nome_produto"]').innerText.trim();
          const quantidade = parseInt(tr.querySelector('[data-key="quantidade"]').innerText) || 0;
          const preco = parseFloat(tr.querySelector('[data-key="preco"]').innerText) || 0;

          try {
            const res = await fetch(`/api/estoque/${id}`, {
              method: 'PUT',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
              },
              body: JSON.stringify({ serial, nome_produto, quantidade, preco })
            });

            if (!res.ok) throw new Error('Erro ao salvar item');
            carregarEstoque();
          } catch (err) {
            alert('Erro ao salvar item: ' + err.message);
          }
        });
      });

      document.querySelectorAll('.excluir').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          if (!confirm('Deseja realmente excluir este item?')) return;

          try {
            const res = await fetch(`/api/estoque/${id}`, {
              method: 'DELETE',
              credentials: 'include',
              headers: { 'CSRF-Token': csrfToken }
            });

            if (!res.ok) throw new Error('Erro ao excluir item');
            carregarEstoque();
          } catch (err) {
            alert('Erro ao excluir item: ' + err.message);
          }
        });
      });
    }
  } catch (err) {
    console.error('Erro ao carregar estoque:', err);
  }
}

document.getElementById('excelFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file || nivelUsuario !== 'admin') return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/estoque/upload', {
      method: 'POST',
      credentials: 'include',
      headers: { 'CSRF-Token': csrfToken },
      body: formData
    });

    if (!res.ok) throw new Error('Falha no upload');
    carregarEstoque();
  } catch (err) {
    alert('❌ Erro no upload: ' + err.message);
  }

  e.target.value = '';
});

document.getElementById('btnRelatorio').addEventListener('click', () => {
  window.open('/api/estoque/relatorio', '_blank');
});

window.addEventListener('DOMContentLoaded', async () => {
  await obterCsrfToken();
  carregarEstoque();
});
