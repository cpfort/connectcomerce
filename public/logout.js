export function logout() {
  fetch('/logout')
    .then(() => {
      window.location.href = '/login.html';
    })
    .catch(err => {
      console.error('Erro no logout:', err);
    });
}
