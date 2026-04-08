function savePrefs() {
    const prefs = document.getElementById('pref-prefs').checked;
    const analytics = document.getElementById('pref-analytics').checked;
    localStorage.setItem('fs_cookie_prefs', JSON.stringify({ prefs, analytics }));
    const btn = document.querySelector('.save-pref-btn');
    btn.textContent = '✓ Salvo!';
    btn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
    setTimeout(() => { btn.textContent = 'Salvar Preferências'; btn.style.background = ''; }, 2500);
}
// carrega preferencias salvas
(function () {
    const saved = localStorage.getItem('fs_cookie_prefs');
    if (saved) {
        const { prefs, analytics } = JSON.parse(saved);
        document.getElementById('pref-prefs').checked = prefs;
        document.getElementById('pref-analytics').checked = analytics;
    }
})();