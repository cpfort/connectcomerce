  async function verificarUsuario() {
      const res = await fetch('/api/csrf-token', { credentials: 'include' });
      const data = await res.json();
      const nivel = data.nivel || 'usuario';
      const div = document.getElementById('usuarioLogado');
      div.textContent = nivel === 'admin'
        ? '👑 Você está logado como Administrador'
        : `👤 Logado como: ${nivel}`;
    }

    window.addEventListener('DOMContentLoaded', verificarUsuario);