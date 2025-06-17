document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(new FormData(form))
    });

    const result = await response.json();

    if (result.success) {
      // Redireciona para o dashboard
      window.location.href = '/home';
    } else {
      alert(result.message || 'Login falhou');
    }
  } catch (err) {
    console.error('Erro:', err);
    alert('Erro na conexão');
  }
});
