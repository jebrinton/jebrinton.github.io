/* Progressive reading tools: the article and footnote links work without JS. */
(() => {
  'use strict';
  const body = document.querySelector('.article-body');
  const localTarget = link => {
    try { return document.getElementById(decodeURIComponent(new URL(link.href).hash.slice(1))); }
    catch { return null; }
  };

  if (body) {
    const outline = document.querySelector('.reading-outline');
    const list = document.querySelector('.outline-list');
    const headings = [...body.querySelectorAll('h2,h3')].filter(h => !h.closest('.footnotes,[role="doc-endnotes"]'));
    const entries = headings.map((heading, index) => {
      const title = heading.textContent.trim();
      if (!heading.id) {
        const base = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `section-${index + 1}`;
        let id = base, suffix = 2;
        while (document.getElementById(id)) id = `${base}-${suffix++}`;
        heading.id = id;
      }
      const href = `#${encodeURIComponent(heading.id)}`;
      const permalink = document.createElement('a');
      permalink.className = 'heading-link';
      permalink.href = href;
      permalink.textContent = '#';
      permalink.setAttribute('aria-label', `Link to ${title}`);
      permalink.title = `Link to ${title}`;
      heading.append(permalink);
      const item = document.createElement('li');
      if (heading.tagName === 'H3') item.className = 'outline-subsection';
      const link = document.createElement('a');
      link.href = href; link.textContent = title;
      link.addEventListener('click', () => { if (!wide.matches) outline.open = false; });
      item.append(link); list?.append(item);
      return { heading, link };
    });
    // Resolve generated heading anchors on an incoming deep link too.
    if (location.hash) {
      try {
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (headings.includes(target)) requestAnimationFrame(() => target.scrollIntoView());
      } catch { /* An invalid URL fragment must not break reading tools. */ }
    }
    const wide = matchMedia('(min-width: 1350px)');
    if (outline) {
      outline.hidden = !entries.length;
      const resizeOutline = () => { outline.open = wide.matches; };
      resizeOutline(); wide.addEventListener('change', resizeOutline);
    }
    const progress = document.querySelector('.reading-progress');
    let scheduled = false;
    const updateReading = () => {
      scheduled = false;
      const rect = body.getBoundingClientRect();
      const travel = Math.max(1, rect.height - innerHeight + 140);
      const fraction = Math.max(0, Math.min(1, (140 - rect.top) / travel));
      if (progress) {
        progress.style.setProperty('--read-progress', fraction);
        progress.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
      }
      let active = null;
      for (const entry of entries) {
        if (entry.heading.getBoundingClientRect().top <= 180) active = entry;
      }
      entries.forEach(entry => {
        if (entry === active) entry.link.setAttribute('aria-current', 'location');
        else entry.link.removeAttribute('aria-current');
      });
    };
    const queueReading = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateReading); } };
    addEventListener('scroll', queueReading, { passive: true });
    addEventListener('resize', queueReading);
    if ('ResizeObserver' in window) new ResizeObserver(queueReading).observe(body);
    updateReading();

    // Imported LessWrong/EA footnotes and Markdown footnotes share this behavior.
    const references = [...body.querySelectorAll('.footnote-reference a[href],a.footnote-ref,a[role="doc-noteref"],sup a[href^="#fn"]')].filter(ref => {
      const target = localTarget(ref);
      return target && (target.matches('[role="doc-endnote"],.footnote-item') || target.closest('.footnotes,.footnote,[role="doc-endnotes"]'));
    });
    if (references.length) {
      const popup = document.createElement('section');
      popup.className = 'footnote-popover'; popup.id = 'footnote-preview'; popup.hidden = true;
      popup.setAttribute('role', 'dialog'); popup.setAttribute('aria-labelledby', 'footnote-preview-label');
      popup.innerHTML = '<header><span id="footnote-preview-label"></span><button type="button" aria-label="Close footnote">×</button></header><div class="footnote-preview-body"></div><a class="footnote-full">Go to footnote</a>';
      document.body.append(popup);
      const content = popup.querySelector('.footnote-preview-body');
      const closeButton = popup.querySelector('button');
      let trigger = null, closeTimer, pinned = false;
      const close = (restore = false) => {
        clearTimeout(closeTimer);
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        popup.hidden = true; pinned = false;
        if (restore) trigger?.focus({ preventScroll: true });
      };
      const place = () => {
        if (!trigger || popup.hidden) return;
        const anchor = trigger.getBoundingClientRect();
        const width = popup.offsetWidth, height = popup.offsetHeight;
        popup.style.left = `${Math.max(12, Math.min(innerWidth - width - 12, anchor.left - 20))}px`;
        const below = anchor.bottom + 12;
        popup.style.top = `${Math.max(12, below + height <= innerHeight - 12 ? below : Math.min(innerHeight - height - 12, anchor.top - height - 12))}px`;
      };
      const show = (ref, pin) => {
        const target = localTarget(ref); if (!target) return;
        clearTimeout(closeTimer);
        if (trigger && trigger !== ref) trigger.setAttribute('aria-expanded', 'false');
        trigger = ref; pinned = pin;
        const clone = target.cloneNode(true);
        clone.removeAttribute('id');
        clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        clone.querySelectorAll('a[href*="#fnref"],.footnote-backref,[role="doc-backlink"]').forEach(node => node.remove());
        content.replaceChildren(...clone.childNodes);
        popup.querySelector('#footnote-preview-label').textContent = `Footnote ${ref.textContent.replace(/[\[\]]/g, '').trim()}`;
        popup.querySelector('.footnote-full').href = ref.href;
        ref.setAttribute('aria-expanded', 'true'); popup.hidden = false; place();
      };
      const later = () => { if (!pinned) closeTimer = setTimeout(() => close(), 180); };
      references.forEach(ref => {
        if (!localTarget(ref)) return;
        ref.setAttribute('aria-haspopup', 'dialog'); ref.setAttribute('aria-controls', popup.id); ref.setAttribute('aria-expanded', 'false');
        ref.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && !pinned) show(ref, false); });
        ref.addEventListener('pointerleave', later);
        ref.addEventListener('click', event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          if (trigger === ref && pinned && !popup.hidden) close();
          else { show(ref, true); closeButton.focus({ preventScroll: true }); }
        });
      });
      popup.addEventListener('pointerenter', () => clearTimeout(closeTimer));
      popup.addEventListener('pointerleave', later);
      popup.addEventListener('focusin', () => { pinned = true; clearTimeout(closeTimer); });
      closeButton.addEventListener('click', () => close(true));
      popup.querySelector('.footnote-full').addEventListener('click', () => close());
      document.addEventListener('pointerdown', event => { if (!popup.contains(event.target) && !references.some(ref => ref.contains(event.target))) close(); });
      document.addEventListener('keydown', event => { if (event.key === 'Escape' && !popup.hidden) { event.preventDefault(); close(true); } });
      document.addEventListener('focusin', event => { if (!popup.hidden && pinned && !popup.contains(event.target) && event.target !== trigger) close(); });
      addEventListener('scroll', () => { if (pinned) place(); else close(); }, { passive: true });
      addEventListener('resize', place);
    }
  }

  const dialog = document.querySelector('#blog-search');
  const opener = document.querySelector('.search-toggle');
  if (!dialog || !opener) return;
  const shortcut = opener.querySelector('kbd');
  if (shortcut && !/Mac|iPhone|iPad/.test(navigator.platform)) shortcut.textContent = 'Ctrl K';
  const input = dialog.querySelector('input');
  const results = dialog.querySelector('.search-results');
  const message = dialog.querySelector('.search-message');
  let posts = null, loading = false, selected = -1, matches = [], returnFocus;
  const safeURL = url => {
    try {
      const parsed = new URL(url, new URL(opener.dataset.searchIndex, location.href));
      return parsed.origin === location.origin && parsed.pathname.startsWith('/blog/') ? parsed.href : null;
    } catch { return null; }
  };
  const choose = index => {
    selected = index;
    [...results.children].forEach((item, i) => item.setAttribute('aria-selected', String(i === index)));
    if (index >= 0) { input.setAttribute('aria-activedescendant', `search-result-${index}`); results.children[index]?.scrollIntoView({ block: 'nearest' }); }
    else input.removeAttribute('aria-activedescendant');
  };
  const render = () => {
    results.replaceChildren(); choose(-1);
    if (!posts) return;
    const terms = input.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    matches = posts.map(post => {
      const title = String(post.title || ''), text = `${title} ${post.excerpt || ''} ${post.text || ''}`.toLocaleLowerCase();
      const score = terms.reduce((sum, term) => sum + (title.toLocaleLowerCase().includes(term) ? 5 : 1), 0);
      return { ...post, title, href: safeURL(post.url), text, score };
    }).filter(post => post.href && terms.every(term => post.text.includes(term)))
      .sort((a, b) => terms.length ? b.score - a.score || String(b.date).localeCompare(String(a.date)) : String(b.date).localeCompare(String(a.date)))
      .slice(0, 12);
    message.textContent = terms.length ? (matches.length ? `${matches.length} result${matches.length === 1 ? '' : 's'}${matches.length === 12 ? ' shown' : ''}` : 'No matching posts. Try different words.') : 'Recent posts';
    matches.forEach((post, i) => {
      const li = document.createElement('li'); li.id = `search-result-${i}`; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', 'false');
      const a = document.createElement('a'); a.href = post.href; a.tabIndex = -1;
      const title = document.createElement('strong'); title.textContent = post.title;
      const excerpt = document.createElement('span'); excerpt.textContent = String(post.excerpt || post.text || '').slice(0, 180);
      a.append(title, excerpt); li.append(a); results.append(li);
      li.addEventListener('pointermove', () => { if (selected !== i) choose(i); });
    });
  };
  const load = async () => {
    if (posts || loading) return;
    loading = true; message.textContent = 'Loading posts…';
    try {
      const response = await fetch(opener.dataset.searchIndex);
      if (!response.ok) throw new Error('Search unavailable');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Invalid index');
      posts = data; render();
    } catch { message.textContent = 'Search could not load. Close and reopen to retry.'; }
    finally { loading = false; }
  };
  const open = () => {
    if (dialog.open) return;
    returnFocus = document.activeElement;
    dialog.showModal(); opener.setAttribute('aria-expanded', 'true'); input.focus(); render(); load();
  };
  opener.addEventListener('click', open);
  dialog.querySelector('.search-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { opener.setAttribute('aria-expanded', 'false'); returnFocus?.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  input.addEventListener('input', render);
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); if (!matches.length) return;
      choose(event.key === 'ArrowDown' ? (selected + 1) % matches.length : (selected <= 0 ? matches.length - 1 : selected - 1));
    } else if (event.key === 'Enter' && matches.length) { event.preventDefault(); location.assign(matches[selected < 0 ? 0 : selected].href); }
  });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !event.altKey) { event.preventDefault(); dialog.open ? dialog.close() : open(); }
  });
  opener.hidden = false;
})();
