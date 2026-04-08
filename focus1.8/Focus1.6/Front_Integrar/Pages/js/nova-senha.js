/* Alterna a visibilidade da senha entre asteriscos e texto plano*/
function toggleSenha(id, btn) {
  const input = document.getElementById(id);
  const icon = btn.querySelector('i');
  // Lógica de alternância (Ternário)
  input.type = input.type === 'password' ? 'text' : 'password';
  icon.classList.toggle('fa-eye');
  icon.classList.toggle('fa-eye-slash');
}
// Extrai o token da URL (ex: ?token=abc123...) para validar o pedido
const token = new URLSearchParams(window.location.search).get('token');

if (!token) {
  mostrarAlerta('Link inválido. Solicite uma nova recuperação de senha.', 'erro');
  document.getElementById('btnSalvar').disabled = true;
}

const inputSenha = document.getElementById('senha');
const inputConfirma = document.getElementById('confirma');
const avisoSenha = document.getElementById('aviso-senha');

/* Validação em tempo real: Verifica se os dois campos são iguais*/
function verificarSenhas() {
  if (!inputConfirma.value) { avisoSenha.textContent = ''; return; }
  avisoSenha.textContent = inputSenha.value !== inputConfirma.value
    ? 'As senhas não coincidem.' : '';
}

// Ouve cada tecla digitada (input) para validar instantaneamente
inputSenha.addEventListener('input', verificarSenhas);
inputConfirma.addEventListener('input', verificarSenhas);

/* Evento de envio do formulário */
document.getElementById('formNovaSenha').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Validação final antes de enviar ao servidor
  if (inputSenha.value !== inputConfirma.value) {
    avisoSenha.textContent = 'As senhas não coincidem.';
    return;
  }
  // Feedback visual do loading da pagina
  const btn = document.getElementById('btnSalvar');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const fd = new FormData();
  fd.append('token', token);
  fd.append('senha', inputSenha.value);

  try {
    // Requisição para o backend
    const res = await fetch('nova-senha.php', { method: 'POST', body: fd });
    const data = await res.json();
    mostrarAlerta(data.mensagem, data.sucesso ? 'sucesso' : 'erro');
    /*se sucesso = redireciona para o login após 2 segundos */
    if (data.sucesso) setTimeout(() => window.location.href = 'login.html', 2000);
  } catch {
    mostrarAlerta('Erro de conexão com o servidor.', 'erro');
  } finally {
    // Restaura o estado do botão independentemente do resultado
    btn.disabled = false;
    btn.textContent = 'Salvar nova senha';
  }
});

function mostrarAlerta(msg, tipo) {
  const a = document.getElementById('alerta');
  a.textContent = msg;
  a.className = tipo;
  a.style.display = 'block';
}