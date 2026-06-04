// Pixel art hero background — adapted from photo_to_pixel_art_v4
(function () {
  const HERO_IMAGE = 'assets/images/hero-bg.jpg';
  const MOBILE_BP = 768;

  // State
  let srcImg = null;
  let pixelSize = window.innerWidth <= MOBILE_BP ? 8 : 6;
  let ditherMode = 1; // ordered
  let colorCount = 12;
  let palette = [];
  let currentPreset = null;
  let tainted = false;

  const PRESETS = [
    { name: 'Dusk',    colors: ['#0d0d2b','#1a1a5e','#3d3580','#7c6fa0','#ffb347','#ff7043','#2d5a3d','#4a8c5c','#c4934a','#e8c06a','#163020','#0d2010'] },
    { name: 'GB',      colors: ['#0f380f','#306230','#8bac0f','#9bbc0f'] },
    { name: 'CGA',     colors: ['#000000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa','#aa5500','#aaaaaa','#555555','#5555ff','#55ff55','#55ffff','#ff5555','#ff55ff','#ffff55','#ffffff'] },
    { name: 'Sunset',  colors: ['#1a0a2e','#3d1a5e','#7c3580','#cc4488','#ff7043','#ffb347','#ffd700','#fff0a0','#2d1810','#5a3020'] },
    { name: 'Ocean',   colors: ['#0a1628','#1a3a6b','#2a6ab5','#5a9fd4','#a0d4f0','#d0eeff','#1a3320','#2d5a3d','#e8c06a','#fff8f0'] },
    { name: 'Forest',  colors: ['#0a0f0a','#0f1f10','#1a3320','#2d5a3d','#4a8c5c','#7ab87a','#b0d4a0','#ffe8b0','#ffcc60','#ffffff'] },
  ];

  // Utilities
  function clamp(v) { return Math.max(0, Math.min(255, v | 0)); }
  function hexToRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function colorDist(a, b) { return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; }

  function nearest(r, g, b) {
    if (!palette.length) return [r, g, b];
    let best = 0, bd = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const d = colorDist([r, g, b], palette[i]);
      if (d < bd) { bd = d; best = i; }
    }
    return palette[best];
  }

  // Palette extraction — median cut only
  function medianCut(data, W, H, k) {
    const stride = Math.max(1, (W * H / 3000) | 0);
    const pixels = [];
    for (let i = 0; i < W * H; i += stride) pixels.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
    function cut(b) {
      const r = [0, 1, 2].map(ch => { const v = b.map(p => p[ch]); return Math.max(...v) - Math.min(...v); });
      const ax = r.indexOf(Math.max(...r));
      b.sort((a, c) => a[ax] - c[ax]);
      const m = b.length >> 1;
      return [b.slice(0, m), b.slice(m)];
    }
    function avg(b) {
      const s = [0, 0, 0];
      b.forEach(p => { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; });
      return s.map(v => Math.round(v / b.length));
    }
    let buckets = [pixels];
    while (buckets.length < k) {
      buckets.sort((a, b) => b.length - a.length);
      const [a, b] = cut(buckets.shift());
      if (a.length) buckets.push(a);
      if (b.length) buckets.push(b);
    }
    return buckets.map(avg);
  }

  function autoExtract() {
    if (!srcImg) return;
    if (tainted) {
      if (palette.length === 0) {
        palette = PRESETS[0].colors.map(hexToRgb);
        currentPreset = 0;
        updatePresetChips();
      }
      render();
      return;
    }
    try {
      const pw = Math.max(1, Math.ceil(srcImg.width / pixelSize));
      const ph = Math.max(1, Math.ceil(srcImg.height / pixelSize));
      const tmp = document.createElement('canvas');
      tmp.width = pw; tmp.height = ph;
      const ctx = tmp.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(srcImg, 0, 0, pw, ph);
      const id = ctx.getImageData(0, 0, pw, ph);
      palette = medianCut(id.data, pw, ph, colorCount);
      render();
    } catch (e) {
      tainted = true;
      autoExtract();
    }
  }

  // Rendering
  function render() {
    if (!srcImg || !palette.length) return;
    const canvas = document.getElementById('pixel-canvas');
    if (!canvas) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = Math.max(1, Math.ceil(vw / pixelSize));
    const ph = Math.max(1, Math.ceil(vh / pixelSize));
    canvas.width = pw;
    canvas.height = ph;

    const ctx = canvas.getContext('2d');

    // Cover-fit the source image
    const imgAspect = srcImg.width / srcImg.height;
    const canAspect = pw / ph;
    let sx = 0, sy = 0, sw = srcImg.width, sh = srcImg.height;
    if (imgAspect > canAspect) {
      sw = srcImg.height * canAspect;
      sx = (srcImg.width - sw) / 2;
    } else {
      sh = srcImg.width / canAspect;
      sy = (srcImg.height - sh) / 2;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(srcImg, sx, sy, sw, sh, 0, 0, pw, ph);

    if (tainted) return;

    const imageData = ctx.getImageData(0, 0, pw, ph);
    const data = imageData.data;
    const err = new Float32Array(pw * ph * 3);
    const out = ctx.createImageData(pw, ph);

    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) {
        const i = (y * pw + x) * 4;
        let r = data[i] + err[(y * pw + x) * 3];
        let g = data[i + 1] + err[(y * pw + x) * 3 + 1];
        let b = data[i + 2] + err[(y * pw + x) * 3 + 2];

        if (ditherMode === 1) {
          const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
          const t = (bayer[y % 4][x % 4] / 16 - 0.5) * 40;
          r += t; g += t; b += t;
        }

        r = clamp(r); g = clamp(g); b = clamp(b);
        const q = nearest(r, g, b);
        out.data[i] = q[0]; out.data[i + 1] = q[1]; out.data[i + 2] = q[2]; out.data[i + 3] = 255;

        if (ditherMode === 2) {
          const er = r - q[0], eg = g - q[1], eb = b - q[2];
          function ae(dx, dy, f) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < pw && ny >= 0 && ny < ph) {
              const ni = (ny * pw + nx) * 3;
              err[ni] += er * f; err[ni + 1] += eg * f; err[ni + 2] += eb * f;
            }
          }
          ae(1, 0, 7 / 16); ae(-1, 1, 3 / 16); ae(0, 1, 5 / 16); ae(1, 1, 1 / 16);
        }
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  // Controls
  function bindControls() {
    const psSlider = document.getElementById('ctrl-pixelsize');
    const psVal = document.getElementById('ctrl-pixelsize-val');
    const ncSlider = document.getElementById('ctrl-colors');
    const ncVal = document.getElementById('ctrl-colors-val');

    if (psSlider) {
      psSlider.value = pixelSize;
      if (psVal) psVal.textContent = pixelSize;
      psSlider.addEventListener('input', () => {
        pixelSize = parseInt(psSlider.value);
        if (psVal) psVal.textContent = pixelSize;
        if (currentPreset !== null) { render(); } else { autoExtract(); }
      });
    }

    if (ncSlider) {
      ncSlider.value = colorCount;
      if (ncVal) ncVal.textContent = colorCount;
      ncSlider.addEventListener('input', () => {
        colorCount = parseInt(ncSlider.value);
        if (ncVal) ncVal.textContent = colorCount;
        currentPreset = null;
        updatePresetChips();
        autoExtract();
      });
    }

    // Dither icons
    document.querySelectorAll('[data-dither]').forEach(btn => {
      btn.addEventListener('click', () => {
        ditherMode = parseInt(btn.dataset.dither);
        document.querySelectorAll('[data-dither]').forEach(b => b.classList.toggle('on', b === btn));
        render();
      });
    });

    // Palette preset icons
    document.querySelectorAll('[data-palette]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.palette);
        if (idx === -1) {
          currentPreset = null;
          autoExtract();
        } else {
          currentPreset = idx;
          palette = PRESETS[idx].colors.map(hexToRgb);
        }
        updatePresetChips();
        render();
      });
    });

    updatePresetChips();
    updateDitherChips();
  }

  function updatePresetChips() {
    document.querySelectorAll('[data-palette]').forEach(btn => {
      const idx = parseInt(btn.dataset.palette);
      btn.classList.toggle('on', idx === -1 ? currentPreset === null : idx === currentPreset);
    });
  }

  function updateDitherChips() {
    document.querySelectorAll('[data-dither]').forEach(btn => {
      btn.classList.toggle('on', parseInt(btn.dataset.dither) === ditherMode);
    });
  }

  // Resize
  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (currentPreset !== null) { render(); } else { autoExtract(); }
    }, 200);
  }

  // Init
  function init() {
    const canvas = document.getElementById('pixel-canvas');
    if (!canvas) return;

    const img = new Image();
    // No crossOrigin needed — image is always same-origin
    img.onload = () => {
      srcImg = img;
      autoExtract();
      bindControls();
    };
    img.onerror = () => {
      const w = 640, h = 360;
      const tmp = document.createElement('canvas');
      tmp.width = w; tmp.height = h;
      const ctx = tmp.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1a0a2e');
      grad.addColorStop(0.4, '#3d1a5e');
      grad.addColorStop(0.6, '#7c3580');
      grad.addColorStop(0.8, '#ff7043');
      grad.addColorStop(1, '#ffb347');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#0d0d2b';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.7);
      for (let x = 0; x <= w; x += 20) {
        ctx.lineTo(x, h * 0.7 - Math.sin(x / 60) * 40 - Math.sin(x / 30) * 20);
      }
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      const fallback = new Image();
      fallback.onload = () => {
        srcImg = fallback;
        autoExtract();
        bindControls();
      };
      fallback.src = tmp.toDataURL();
    };
    img.src = HERO_IMAGE;

    window.addEventListener('resize', onResize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
