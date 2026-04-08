// Variável de estado global para controlar o tipo de cobrança atual
let billing = 'monthly';

// Objeto de configuração que centraliza os valores e textos dos planos
const prices = {
    pro: { monthly: 'R$19', annual: 'R$15', annualNote: 'R$182/ano — <strong>economize R$46</strong>' },
    prem: { monthly: 'R$39', annual: 'R$31', annualNote: 'R$374/ano — <strong>economize R$94</strong>' }
};

/* Altera a interface entre os planos Mensal e Anual*/
function setBilling(type) {
    billing = type;
    // Gerencia as classes CSS nos botões para dar feedback visual de qual está selecionado
    document.getElementById('btn-monthly').classList.toggle('active', type === 'monthly');
    document.getElementById('btn-annual').classList.toggle('active', type === 'annual');
    // Atualiza os valores principais dos planos dinamicamente
    document.getElementById('pro-price').textContent = prices.pro[type];
    document.getElementById('prem-price').textContent = prices.prem[type];
    // Exibe a nota de economia apenas se for anual
    document.getElementById('pro-annual').innerHTML = type === 'annual' ? prices.pro.annualNote : '&nbsp;';
    document.getElementById('prem-annual').innerHTML = type === 'annual' ? prices.prem.annualNote : '&nbsp;';
}
/* Gerencia o comportamento de "Acordeão" do FAQ */
function toggleFaq(el) {
    const item = el.closest('.faq-item');
    if (!item) return;
    /* Gerencia o comportamento de "Acordeão" do FAQ */
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    // Se o item que cliquei NÃO estava aberto, agora eu abro ele
    if (!isOpen) item.classList.add('open');
}