/* Evento de submissão do formulário de solicitação de recuperação*/
document.getElementById('formRecuperar').addEventListener('submit', async function (e) {
  e.preventDefault();
  // Referência ao botão para aplicar estados de carregamento
  const btn = document.getElementById('btnRecuperar');
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try {
    // Faz a requisição POST para o backend PHP
    const res = await fetch('php/recuperar-senha.php', { method: 'POST', body: new FormData(this) });
    // Converte a resposta do servidor para um objeto JSON
    const data = await res.json();
    mostrarAlerta(data.mensagem, data.sucesso ? 'sucesso' : 'erro');
  } catch {
    // Caso ocorra uma falha crítica na rede ou servidor, mensagem abaixo:
    mostrarAlerta('Erro de conexão com o servidor.', 'erro');
  } finally {
    // Restaura o botão para que o usuário possa tentar novamente se desejar.
    btn.disabled = false;
    btn.textContent = 'Enviar link de recuperação';
  }
});
/*Função utilitária para exibir mensagens de status no HTML */
function mostrarAlerta(msg, tipo) {
  const a = document.getElementById('alerta');
  a.textContent = msg;
  a.className = tipo;
  a.style.display = 'block';
}