function updateGlobalNavAvatar() {
    const navAvatar = document.getElementById('nav-avatar');
    if (!navAvatar) return;
    //salva na session o cache da foto do user
    const cachedPhoto = sessionStorage.getItem('user_photo');
    const userName = sessionStorage.getItem('user_name') || 'Usuario';

    if (cachedPhoto) {
        navAvatar.src = cachedPhoto;
    }

    fetch('php/api_perfil.php')
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                const p = result.data;
                const imgSrc = p.photo
                    ? 'php/uploads/' + p.photo
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.username)}&background=06b6d4&color=fff`;

                // Atualiza a imagem na tela
                navAvatar.src = imgSrc;

                // Atualiza o cache para a próxima página
                sessionStorage.setItem('user_photo', imgSrc);
                sessionStorage.setItem('user_name', p.username);
            }
        })
        .catch(err => console.error("Erro no avatar global:", err));
}

// Executa assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', updateGlobalNavAvatar);