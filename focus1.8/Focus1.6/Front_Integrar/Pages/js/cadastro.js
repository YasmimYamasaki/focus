/* Toggle Senha */
//corrigido
function toggleSenha(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('formCadastro');
    const btnEnviar = document.getElementById('btnEnviar');
    const alerta = document.getElementById('alerta');

    /* FOTO CLICÁVEL */
    const inputFoto = document.getElementById('foto');
    const fotoWrapper = document.getElementById('fotoWrapper');
    const fotoPreview = document.getElementById('fotoPreview');
    const fotoPlaceholder = document.getElementById('fotoPlaceholder');

    fotoWrapper?.addEventListener('click', () => {
        inputFoto.click();
    });

    /* Preview da Foto ao selecionar */
    inputFoto?.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                fotoPreview.src = e.target.result;
                fotoPreview.style.display = 'block';
                fotoPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    /* Envio via AJAX */
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        btnEnviar.disabled = true;
        btnEnviar.textContent = 'Enviando...';
        alerta.style.display = 'none';

        try {
            const formData = new FormData(this);
            const response = await fetch('php/cadastro.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.sucesso) {
                alerta.className = 'alerta sucesso';
                alerta.textContent = result.mensagem;
                alerta.style.display = 'block';
                form.reset();
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                throw new Error(result.mensagem);
            }

        } catch (error) {
            alerta.className = 'alerta erro';
            alerta.textContent = error.message || "Erro ao cadastrar.";
            alerta.style.display = 'block';
        } finally {
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Criar conta';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});