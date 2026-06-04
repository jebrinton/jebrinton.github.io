/* ============================================================
   offline.js — Questdex interactivity
   - Stars animate in on scroll
   - Click to flip card (keyboard: Enter/Space)
   - Cursor-tilt parallax (pointer: fine only, reduced-motion respected)
   - Hidden 9th card reveals after all others have been flipped
   - Mobile: carousel is CSS-driven (scroll-snap)
   ============================================================ */

(function () {
  'use strict';

  const PREFERS_REDUCED_MOTION =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SUPPORTS_FINE_POINTER =
    window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const grid = document.getElementById('questdex-grid');
    if (!grid) return;

    const allCards    = Array.from(grid.querySelectorAll('.cq-card'));
    const hiddenCards = allCards.filter(c => c.dataset.hidden === 'true');
    const regularCards = allCards.filter(c => c.dataset.hidden !== 'true');

    setupScrollIn(regularCards);   // stars animate when card enters view
    setupFlipping(allCards);       // click-to-flip + keyboard
    setupHiddenReveal(regularCards, hiddenCards);
    if (SUPPORTS_FINE_POINTER && !PREFERS_REDUCED_MOTION) {
      setupTiltParallax(allCards);
    }
  }

  /* ----------------------------------------------------------
     Scroll-in: add .is-visible when card enters viewport.
     (Stars have CSS transition-delays to stagger their pop-in.)
     ---------------------------------------------------------- */
  function setupScrollIn(cards) {
    if (PREFERS_REDUCED_MOTION || !('IntersectionObserver' in window)) {
      cards.forEach(c => c.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' });

    cards.forEach(c => io.observe(c));
  }

  /* ----------------------------------------------------------
     Flipping
     ---------------------------------------------------------- */
  function setupFlipping(cards) {
    cards.forEach(card => {
      card.addEventListener('click', (e) => onCardClick(e, card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFlip(card);
        }
      });

      // Explicit FLIP button on the back also closes the card.
      const backClose = card.querySelector('.cq-card__back-close');
      if (backClose) {
        backClose.addEventListener('click', (e) => {
          e.stopPropagation();
          card.classList.remove('is-flipped');
        });
      }
    });
  }

  function onCardClick(e, card) {
    // Don't flip if the user clicked a link or button inside the card.
    const target = e.target;
    if (target.closest('a, button')) return;
    toggleFlip(card);
  }

  const flippedOnce = new Set();

  function toggleFlip(card) {
    card.classList.toggle('is-flipped');

    // Any flip (including to-back) counts as "seen" for unlock purposes.
    if (card.dataset.hidden !== 'true' && card.dataset.id) {
      flippedOnce.add(card.dataset.id);
      maybeUnlockHidden();
    }
  }

  /* ----------------------------------------------------------
     Hidden card reveal
     ---------------------------------------------------------- */
  let cachedRegularIds = null;
  let cachedHiddenCards = null;
  let unlocked = false;

  function setupHiddenReveal(regular, hidden) {
    cachedRegularIds = regular.map(c => c.dataset.id).filter(Boolean);
    cachedHiddenCards = hidden;
  }

  function maybeUnlockHidden() {
    if (unlocked) return;
    if (!cachedRegularIds || cachedRegularIds.length === 0) return;
    const allFlipped = cachedRegularIds.every(id => flippedOnce.has(id));
    if (!allFlipped) return;

    unlocked = true;
    cachedHiddenCards.forEach(card => {
      card.hidden = false;
      card.removeAttribute('aria-hidden');
      // allow the display flip to register, then kick the animation class
      requestAnimationFrame(() => {
        requestAnimationFrame(() => card.classList.add('is-unlocked'));
      });
    });

    bumpCounter();

    // Bring the hidden card(s) into view.
    const first = cachedHiddenCards[0];
    if (first) {
      setTimeout(() => {
        first.scrollIntoView({
          behavior: PREFERS_REDUCED_MOTION ? 'auto' : 'smooth',
          block: 'center'
        });
      }, 200);
    }
  }

  function bumpCounter() {
    const counter = document.querySelector('.questdex-counter');
    const num = document.getElementById('questdex-collected');
    if (!counter || !num) return;

    // Read total from the text node after our span: "COLLECTED  X / TOTAL"
    const text = counter.querySelector('.questdex-counter__text');
    if (!text) return;

    // Swap the denominator to total+1, and highlight.
    const totalMatch = text.textContent.match(/\/(\s*)(\d+)/);
    if (totalMatch) {
      const newTotal = parseInt(totalMatch[2], 10) + cachedHiddenCards.length;
      // Rebuild the text preserving the span#questdex-collected
      text.innerHTML = text.innerHTML.replace(
        /\/(\s*)(\d+)/,
        (_m, sp) => '/' + sp + newTotal
      );
    }

    counter.classList.add('is-complete');
    num.textContent = String((cachedRegularIds || []).length + cachedHiddenCards.length);
  }

  /* ----------------------------------------------------------
     Cursor-tilt parallax
     ---------------------------------------------------------- */
  function setupTiltParallax(cards) {
    const MAX_DEG = 8;   // max tilt in any axis
    cards.forEach(card => {
      let raf = 0;
      let rect = null;

      card.addEventListener('pointerenter', () => {
        rect = card.getBoundingClientRect();
      });

      card.addEventListener('pointermove', (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const x = (e.clientX - rect.left) / rect.width;   // 0..1
          const y = (e.clientY - rect.top) / rect.height;   // 0..1
          const rotY = (x - 0.5) * 2 * MAX_DEG;             // -MAX..+MAX
          const rotX = (0.5 - y) * 2 * MAX_DEG;
          card.style.setProperty('--tilt-x', rotX.toFixed(2) + 'deg');
          card.style.setProperty('--tilt-y', rotY.toFixed(2) + 'deg');
        });
      });

      card.addEventListener('pointerleave', () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        rect = null;
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });

      // Also reset when window resizes (cached rect becomes stale)
      window.addEventListener('resize', () => { rect = null; }, { passive: true });
    });
  }
})();
