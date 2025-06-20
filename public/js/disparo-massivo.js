 document.getElementById('formMassivo').addEventListener('submit', async (e) => {
      e.preventDefault();

      const mensagem = e.target.mensagem.value;
      const relatorioDiv = document.getElementById('relatorio');
      const resumo = document.getElementById('resumo');
      const detalhes = document.getElementById('detalhes');

      relatorioDiv.style.display = 'none';
      resumo.innerHTML = '';
      detalhes.innerHTML = '';

      const res = await fetch('/api/disparo-massivo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({ mensagem })
      });

      const resultado = await res.json();

      if (!resultado.success) {
        alert('❌ Erro ao enviar: ' + (resultado.message || 'Erro desconhecido'));
        return;
      }

      const enviados = resultado.enviados;
      const sucessoTotal = enviados.filter(e => e.sucesso).length;
      const erroTotal = enviados.length - sucessoTotal;

      resumo.innerHTML = `
        ✅ Enviados com sucesso: <strong>${sucessoTotal}</strong><br>
        ❌ Falhas: <strong>${erroTotal}</strong><br>
        📦 Total: <strong>${enviados.length}</strong>
      `;

      enviados.forEach(e => {
        const item = document.createElement('div');
        item.className = 'item ' + (e.sucesso ? 'sucesso' : 'erro');
        item.innerHTML = `
          ${e.sucesso ? '✅' : '❌'} <span>${e.numero}</span>
        `;
        detalhes.appendChild(item);
      });

      relatorioDiv.style.display = 'block';
      e.target.reset();
    });