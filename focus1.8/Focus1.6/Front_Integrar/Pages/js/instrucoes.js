function switchTab(id, btn) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('panel-' + id).classList.add('active');
    btn.classList.add('active');
    window.scrollTo({ top: document.querySelector('.tab-nav-wrap').offsetTop - 65, behavior: 'smooth' });
}

/* Scroll suave para âncoras internas dos painéis */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.inst-body')?.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        e.stopImmediatePropagation();

        const OFFSET = 65 + 53 + 16;
        const top = target.getBoundingClientRect().top + window.scrollY - OFFSET;
        window.scrollTo({ top, behavior: 'smooth' });

    }, true);
});