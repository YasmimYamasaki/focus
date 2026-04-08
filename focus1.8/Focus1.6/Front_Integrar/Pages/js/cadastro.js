/* Alterna entre exibir ou ocultar a senha */
function toggleSenha(id, btn) {
  const input = document.getElementById(id);
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

/* Executa scripts após carregar o DOM */
document.addEventListener("DOMContentLoaded", function () {

  /* Data de nascimento */
  const inputData = document.getElementById('data-nascimento');
  const aviso = document.getElementById('aviso');
  const hoje = new Date();

  /* Define limites de idade no calendário HTML */
  const limiteMin = new Date();
  limiteMin.setFullYear(limiteMin.getFullYear() - 120);
  inputData.min = limiteMin.toISOString().split('T')[0];
  inputData.max = hoje.toISOString().split('T')[0];

  /* Valida se o usuário é maior de idade */
  inputData.addEventListener('change', function () {
    if (!this.value) { aviso.textContent = ''; return; }
    const dataSel = new Date(this.value);
    let idade = hoje.getFullYear() - dataSel.getFullYear();
    const m = hoje.getMonth() - dataSel.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < dataSel.getDate())) idade--;
    if (idade < 18) {
      aviso.textContent = 'É necessário ter pelo menos 18 anos.';
      this.value = '';
    } else {
      aviso.textContent = '';
    }
  });

  /* Confirmação de senha */
  const inputSenha = document.getElementById('senha');
  const inputConfirma = document.getElementById('confirma-senha');
  const avisoSenha = document.getElementById('aviso-senha');

  /* Verifica se os campos de senha coincidem */
  function verificarSenhas() {
    if (!inputConfirma.value) { avisoSenha.textContent = ''; return; }
    avisoSenha.textContent = inputSenha.value !== inputConfirma.value
      ? 'As senhas não coincidem.'
      : '';
  }

  inputSenha.addEventListener('input', verificarSenhas);
  inputConfirma.addEventListener('input', verificarSenhas);

  /* ── Foto preview ── */
  const inputFoto = document.getElementById('foto');
  const fotoWrapper = document.getElementById('fotoWrapper');
  const fotoPreview = document.getElementById('fotoPreview');
  const fotoPlaceholder = document.getElementById('fotoPlaceholder');

  /* Aciona seletor de arquivos ao clicar no container */
  fotoWrapper.addEventListener('click', () => inputFoto.click());

  /* Processa e exibe miniatura da imagem selecionada */
  inputFoto.addEventListener('change', function () {
    const arquivo = this.files[0];
    if (!arquivo) return;
    if (arquivo.size > 5 * 1024 * 1024) {
      mostrarAlerta('A imagem deve ter no máximo 5 MB.', 'erro');
      this.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      fotoPreview.src = e.target.result;
      fotoPreview.style.display = 'block';
      fotoPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(arquivo);
  });

  /* Máscara telefone */
  /* Formata número de telefone enquanto o usuário digita */
  document.getElementById('telefone').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
    this.value = v;
  });

  /*Envio AJAX  */
  /* Gerencia submissão do formulário via requisição assíncrona */
  document.getElementById('formCadastro').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (inputSenha.value !== inputConfirma.value) {
      mostrarAlerta('As senhas não coincidem.', 'erro');
      return;
    }

    /* Desabilita botão para evitar múltiplos envios */
    const btn = document.getElementById('btnEnviar');
    btn.disabled = true;
    btn.textContent = 'Criando conta...';

    try {
      /* Envia dados para o processamento em PHP */
      const res = await fetch('cadastro.php', { method: 'POST', body: new FormData(this) });
      const data = await res.json();

      if (data.sucesso) {
        mostrarAlerta(data.mensagem, 'sucesso');
        this.reset();
        fotoPreview.style.display = 'none';
        fotoPreview.src = '';
        fotoPlaceholder.style.display = 'flex';
        setTimeout(() => window.location.href = 'login.html', 2000);
      } else {
        mostrarAlerta(data.mensagem, 'erro');
      }
    } catch {
      mostrarAlerta('Erro de conexão com o servidor. Verifique se o PHP está ativo.', 'erro');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Criar conta';
    }
  });

  /* Exibe mensagens de alerta no topo da página */
  function mostrarAlerta(msg, tipo) {
    const a = document.getElementById('alerta');
    a.textContent = msg;
    a.className = tipo;
    a.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});