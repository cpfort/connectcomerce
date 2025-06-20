  document.getElementById('formMassivo').addEventListener('submit', async (e) => {
      e.preventDefault();
      const mensagem = e.target.mensagem.value;

      const res = await fetch('/api/disparo-massivo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({ mensagem })
      });

      const resultado = await res.json();
      alert(resultado.message || (resultado.success ? '✅ Enviado!' : '❌ Erro no envio'));
    });