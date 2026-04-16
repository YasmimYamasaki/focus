//corrigido
document.getElementById('formRecuperar').addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = document.getElementById('btnRecuperar');
  const alerta = document.getElementById('alerta');

  btn.disabled = true;
  btn.textContent = 'Enviando...';
  alerta.style.display = 'none';

  try {
    const response = await fetch('php/recuperar-senha.php', {
      method: 'POST',
      body: new FormData(this)
    });

    const rawText = await response.text();
    console.log("Debug Servidor:", rawText);

    const data = JSON.parse(rawText);
    mostrarAlerta(data.mensagem, data.sucesso ? 'sucesso' : 'erro');

    if (data.sucesso) this.reset();

  } catch (err) {
    console.error("Erro no processamento:", err);
    mostrarAlerta("Erro interno no servidor. Verifique o console.", "erro");
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar link de recuperação';
  }
});

function mostrarAlerta(msg, tipo) {
  const a = document.getElementById('alerta');
  if (!a) return;
  a.textContent = msg;
  a.className = `alerta ${tipo}`;
  a.style.display = 'block';
}