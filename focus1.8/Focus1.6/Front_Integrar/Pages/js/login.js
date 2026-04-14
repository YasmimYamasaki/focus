function toggleSenha(id, btn) {
  const input = document.getElementById(id);
  const icon = btn.querySelector('i');

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  icon.classList.toggle('fa-eye');
  icon.classList.toggle('fa-eye-slash');
}

document.getElementById('formLogin').addEventListener('submit', async function (e) {
  e.preventDefault();

  const btn = document.getElementById('btnLogin');
  const alerta = document.getElementById('alerta');

  // Estado de loading
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  alerta.style.display = 'none';

  try {
    const response = await fetch('php/login.php', {
      method: 'POST',
      body: new FormData(this)
    });

    // Pegamos o texto primeiro para garantir que não há erros de PHP no meio
    const text = await response.text();

    try {
      const data = JSON.parse(text);

      if (data.sucesso) {
        mostrarAlerta(`Bem-vindo(a), ${data.nome}. Redirecionando...`, 'sucesso');
        setTimeout(() => { window.location.href = data.redirect; }, 1300);
      } else {
        // Aqui aparecerá "Usuário ou senha inválidos" em vez de "Erro de conexão"
        mostrarAlerta(data.mensagem, 'erro');
        resetarBotao();
      }
    } catch (e) {
      console.error("Resposta inválida do servidor:", text);
      mostrarAlerta('Erro técnico: O servidor retornou um formato inválido.', 'erro');
      resetarBotao();
    }

  } catch (error) {
    mostrarAlerta('Erro de conexão com o servidor.', 'erro');
    resetarBotao();
  }

  function resetarBotao() {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});


function mostrarAlerta(msg, tipo) {

  const alerta = document.getElementById('alerta');

  alerta.textContent = msg;
  alerta.className = '';
  alerta.classList.add('alerta', tipo);

  alerta.style.display = 'block';
}