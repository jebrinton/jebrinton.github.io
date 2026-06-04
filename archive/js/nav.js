// Scroll-aware navigation + mobile hamburger menu

(function () {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav__hamburger');
  const overlay = document.querySelector('.nav__overlay');

  // ---- Scroll detection ----
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // init on load

  // ---- Mobile hamburger ----
  if (hamburger && overlay) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      overlay.classList.toggle('open');
      document.body.style.overflow = overlay.classList.contains('open') ? 'hidden' : '';
    });

    // Close overlay when a link is clicked
    overlay.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ---- Active page indicator ----
  const currentPath = window.location.pathname.replace(/\/$/, '');
  document.querySelectorAll('.nav__links a, .nav__overlay a').forEach(link => {
    const href = link.getAttribute('href').replace(/\/$/, '');
    if (currentPath.endsWith(href) || (href === '/' && (currentPath === '' || currentPath === '/index.html'))) {
      link.classList.add('active');
    }
  });

  // ---- Email obfuscation ----
  const emailEl = document.querySelector('.footer__email');
  if (emailEl) {
    emailEl.addEventListener('copy', (e) => {
      e.preventDefault();
      const reversed = emailEl.textContent.split('').reverse().join('');
      e.clipboardData.setData('text/plain', reversed);
      const toast = emailEl.querySelector('.footer__email-toast');
      if (toast) {
        toast.textContent = 'nice try, bots \u{1f916}';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      }
    });

    // Show real email on click
    emailEl.addEventListener('click', (e) => {
      e.preventDefault();
      const toast = emailEl.querySelector('.footer__email-toast');
      if (toast) {
        toast.textContent = 'highlight & copy manually :)';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
      }
    });
  }
})();
