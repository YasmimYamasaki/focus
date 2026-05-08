document.getElementById('formRecuperar').addEventListener('submit', async function (e) {
  e.preventDefault();
  
  const btn = document.getElementById('btnRecuperar');
  const alerta = document.getElementById('alerta');

  const formData = new FormData(this); 

  btn.disabled = true;
  btn.textContent = 'Enviando...';
  if (alerta) alerta.style.display = 'none';

  try {
    const response = await fetch('php/recuperar-senha.php', {
      method: 'POST',
      body: formData 
    });

    const rawText = await response.text();
    console.log("Debug Servidor:", rawText);

    let data;
    try {
        data = JSON.parse(rawText);
    } catch (e) {
        throw new Error("Resposta do servidor não é um JSON válido: " + rawText);
    }

    mostrarAlerta(data.mensagem, data.sucesso ? 'sucesso' : 'erro');

    if (data.sucesso) this.reset();

  } catch (err) {
    console.error("Erro no processamento:", err);
    mostrarAlerta("Erro ao conectar com o servidor. Verifique sua internet ou o console.", "erro");
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
  setTimeout(() => { a.style.display = 'none'; }, 15000); 
}