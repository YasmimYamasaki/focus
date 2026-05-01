/* Intersection Observer para animações de entrada */
let lastScrollY = window.scrollY;
const header = document.querySelector('header');

if (header) {
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 10) {
      header.classList.add('header-hidden');
    } else {
      header.classList.remove('header-hidden');
    }

    if (currentScrollY > 50) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }

    lastScrollY = currentScrollY;
  });
}

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const el = entry.target;

    if (el.classList.contains('feature-card')) {
      const index = parseInt(el.dataset.feature);
      el.style.animation = `fade-in 0.8s ease-out ${index * 150}ms forwards`;
      el.classList.add('animate-fade-in');
    }

    if (el.classList.contains('stat-item')) {
      const index = parseInt(el.dataset.stat);
      el.style.animation = `scale-in 0.6s ease-out ${index * 100}ms forwards`;
      el.classList.add('animate-scale-in');
    }

    if (el.classList.contains('step-card')) {
      const index = parseInt(el.dataset.step);
      if (index % 2 === 0) {
        el.style.animation = `fade-in-left 0.8s ease-out ${index * 200}ms forwards`;
        el.classList.add('animate-fade-in-left');
      } else {
        el.style.animation = `fade-in-right 0.8s ease-out ${index * 200}ms forwards`;
        el.classList.add('animate-fade-in-right');
      }
    }

    if (el.classList.contains('section-header')) {
      el.style.animation = 'fade-in 0.8s ease-out forwards';
      el.classList.add('animate-fade-in');
    }

    if (el.classList.contains('cta-card')) {
      el.style.animation = 'fade-in 0.8s ease-out forwards';
      el.classList.add('animate-fade-in');
    }

    observer.unobserve(el);
  });
}, observerOptions);

/* Inicialização após carregamento do DOM  */

document.addEventListener('DOMContentLoaded', () => {
  // Observar elementos para animação
  document.querySelectorAll('.feature-card').forEach(el => observer.observe(el));
  document.querySelectorAll('.stat-item').forEach(el => observer.observe(el));
  document.querySelectorAll('.step-card').forEach(el => observer.observe(el));
  document.querySelectorAll('.section-header').forEach(el => observer.observe(el));

  const ctaCard = document.querySelector('.cta-card');
  if (ctaCard) observer.observe(ctaCard);

  // Efeito ripple nos botões
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', (event) => {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        pointer-events: none;
        animation: ripple 0.6s ease-out;
        left: ${event.clientX - rect.left - 10}px;
        top: ${event.clientY - rect.top - 10}px;
      `;
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
});

/*  Ocultar indicador de scroll ao rolar  */

const scrollIndicator = document.querySelector('.scroll-indicator');

window.addEventListener('scroll', () => {
  if (!scrollIndicator) return;
  if (window.scrollY > 100) {
    scrollIndicator.style.opacity = '0';
    scrollIndicator.style.pointerEvents = 'none';
  } else {
    scrollIndicator.style.opacity = '1';
    scrollIndicator.style.pointerEvents = 'auto';
  }
});

/* Efeito parallax nos blobs do hero  */

let ticking = false;

window.addEventListener('scroll', () => {
  if (ticking) return;

  window.requestAnimationFrame(() => {
    const scrollProgress =
      window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);

    document.querySelectorAll('.gradient-blob').forEach((blob, index) => {
      const offset = scrollProgress * 50 * (index === 0 ? -1 : 1);
      blob.style.transform = `translateY(${offset}px)`;
    });

    ticking = false;
  });

  ticking = true;
});

/* Logo clicável volta ao topo (apenas na home)  */

const logoEl = document.querySelector('.logo');
if (logoEl && !logoEl.getAttribute('href')) {
  logoEl.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* Toggle do menu mobile  */

const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav');

navToggle?.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

// Fechar ao clicar em um link
navMenu?.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    navToggle?.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

/* Links âncora com scroll suave */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
