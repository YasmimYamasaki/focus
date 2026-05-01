/* Alterna a visibilidade da senha */
function toggleSenha(id, btn) {//corrigido
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    if (!input || !icon) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

/* Lógica de Login com Limite de Tentativas */
document.getElementById('formLogin')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = document.getElementById('btnLogin');
    const formData = new FormData(this);
    const originalText = btn.innerHTML;

    let tentativas = 0;
    const MAX_TENTATIVAS = 3;

    btn.disabled = true;

    const realizarTentativa = async () => {
        tentativas++;
        btn.innerHTML = `<i class="fa fa-spinner fa-spin"></i> Validando (${tentativas}/${MAX_TENTATIVAS})...`;

        try {
            const response = await fetch('php/login.php', { method: 'POST', body: formData });
            const text = await response.text();
            console.log("Resposta Bruta do PHP:", text);

            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error("RESPOSTA_INVALIDA");
            }

            if (data.sucesso) {
                console.log("Login bem-sucedido!");
                tentativas = MAX_TENTATIVAS; // Interrompe re-tentativas

                if (typeof mostrarAlerta === "function") {
                    mostrarAlerta(`Bem-vindo, ${data.nome}!`, 'sucesso');
                }

                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1000);
                
                return; // FINALIZA AQUI EM CASO DE SUCESSO
            } 
            
            // Se chegou aqui, data.sucesso é false
            if (data.mensagem === "CREDENCIAIS_INCORRETAS" || data.mensagem === "PREENCHA_CAMPOS") {
                const msgUser = data.mensagem === "PREENCHA_CAMPOS" ? "Preencha todos os campos." : "E-mail ou senha incorretos.";
                mostrarAlerta(msgUser, 'erro');
                pararLoop(originalText);
            } else {
                tentarNovamente();
            }

        } catch (error) {
            console.error("Erro capturado:", error);
            tentarNovamente();
        }
    };

    const tentarNovamente = () => {
        if (tentativas < MAX_TENTATIVAS) {
            console.warn(`Tentativa ${tentativas} falhou. Re-tentando em 3s...`);
            setTimeout(realizarTentativa, 3000);
        } else {
            mostrarAlerta("O servidor está instável. Tente novamente em instantes.", 'erro');
            pararLoop(originalText);
        }
    };

    const pararLoop = (textoOriginal) => {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    };

    realizarTentativa();
});

function mostrarAlerta(msg, tipo) {
    const alerta = document.getElementById('alerta');
    if (!alerta) return;
    alerta.textContent = msg;
    alerta.className = `alerta ${tipo}`;
    alerta.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}