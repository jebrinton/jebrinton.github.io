// Realistic typing animation with burst-pause model + finger distance
// Config loaded from /bio.md
(function () {

  // ======== QWERTY key position map ========
  const KEY_MAP = {
    '`':  [0, 0, 0], '1': [0, 1, 0], '2': [0, 2, 1], '3': [0, 3, 2], '4': [0, 4, 3], '5': [0, 5, 3],
    '6':  [0, 6, 4], '7': [0, 7, 4], '8': [0, 8, 5], '9': [0, 9, 6], '0': [0, 10, 7],
    'q':  [1, 0, 0], 'w': [1, 1, 1], 'e': [1, 2, 2], 'r': [1, 3, 3], 't': [1, 4, 3],
    'y':  [1, 5, 4], 'u': [1, 6, 4], 'i': [1, 7, 5], 'o': [1, 8, 6], 'p': [1, 9, 7],
    'a':  [2, 0, 0], 's': [2, 1, 1], 'd': [2, 2, 2], 'f': [2, 3, 3], 'g': [2, 4, 3],
    'h':  [2, 5, 4], 'j': [2, 6, 4], 'k': [2, 7, 5], 'l': [2, 8, 6], ';': [2, 9, 7],
    'z':  [3, 0, 0], 'x': [3, 1, 1], 'c': [3, 2, 2], 'v': [3, 3, 3], 'b': [3, 4, 3],
    'n':  [3, 5, 4], 'm': [3, 6, 4], ',': [3, 7, 5], '.': [3, 8, 6], '/': [3, 9, 7],
    ' ':  [4, 5, 3],
    '-':  [0, 11, 7], '=': [0, 12, 7], '[': [1, 10, 7], ']': [1, 11, 7],
    "'":  [2, 10, 7], '\\': [2, 11, 7],
  };

  const HOME = [
    [2, 0], [2, 1], [2, 2], [2, 3],
    [2, 6], [2, 7], [2, 8], [2, 9],
  ];

  const FINGER_STRENGTH = [0.7, 0.85, 1.0, 0.95, 0.95, 1.0, 0.85, 0.7];

  function getKeyInfo(ch) {
    const lower = ch.toLowerCase();
    if (KEY_MAP[lower]) return KEY_MAP[lower];
    const accented = {
      'ü': KEY_MAP['u'], 'ö': KEY_MAP['o'], 'ç': KEY_MAP['c'],
      'ş': KEY_MAP['s'], 'ğ': KEY_MAP['g'], 'ı': KEY_MAP['i'],
      'á': KEY_MAP['a'], 'é': KEY_MAP['e'], 'í': KEY_MAP['i'],
      'ñ': KEY_MAP['n'], 'ú': KEY_MAP['u'],
    };
    if (accented[lower]) return accented[lower];
    return [2, 5, 4];
  }

  function fingerDistance(from, to) {
    if (!from || !to) return 0;
    const fi = from[2], ti = to[2];
    if (fi === ti) {
      const dr = Math.abs(from[0] - to[0]);
      const dc = Math.abs(from[1] - to[1]);
      return Math.sqrt(dr * dr + dc * dc) * 1.5;
    }
    const home = HOME[ti];
    const dr = Math.abs(home[0] - to[0]);
    const dc = Math.abs(home[1] - to[1]);
    return Math.sqrt(dr * dr + dc * dc);
  }

  // ======== Timing model ========

  function charDelay(ch, prevKey, burstPos) {
    const BASE = 65;
    const info = getKeyInfo(ch);
    const finger = info[2];
    const dist = fingerDistance(prevKey, info);
    const distCost = dist * 12;
    const strengthMul = 1 / FINGER_STRENGTH[finger];
    const isUpper = ch !== ch.toLowerCase() && ch !== ch.toUpperCase();
    const shiftPenalty = isUpper ? 35 : 0;
    const burstCost = burstPos === 0 ? 25 : 0;
    const jitter = (Math.random() + Math.random() + Math.random() - 1.5) * 26;
    return Math.max(30, (BASE * strengthMul) + distCost + shiftPenalty + burstCost + jitter);
  }

  function deleteDelay() {
    return 30 + Math.random() * 20;
  }

  // ======== Burst-pause generator ========

  function* typingDelays(text) {
    let burstLen = 3 + Math.floor(Math.random() * 4);
    let burstPos = 0;
    let prevKey = null;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === ' ') {
        yield { delay: 40 + Math.random() * 50, char: ch };
        burstPos = 0;
        burstLen = 3 + Math.floor(Math.random() * 4);
        prevKey = getKeyInfo(ch);
        continue;
      }
      const isSentenceEnd = (ch === '.' || ch === '!' || ch === '?') && i < text.length - 1;
      const delay = charDelay(ch, prevKey, burstPos);
      yield { delay, char: ch };
      prevKey = getKeyInfo(ch);
      burstPos++;
      if (burstPos >= burstLen) {
        burstPos = 0;
        burstLen = 3 + Math.floor(Math.random() * 4);
      }
      if (isSentenceEnd) {
        yield { delay: 300 + Math.random() * 200, char: null };
      }
    }
  }

  // ======== bio.md parser ========
  // # section-id         → section (matches data-typer)
  // plain text            → prefix (if - items follow) or standalone line
  // - text                → completion (appended to prefix with auto-space)

  function parseBioMd(md) {
    const sections = {};
    let currentSection = null;
    let currentPrefix = null;
    const lines = md.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed) continue;

      // Section header: # id
      const sectionMatch = trimmed.match(/^#\s+(.+)$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1].trim();
        sections[currentSection] = []; // array of { prefix, completion } entries
        currentPrefix = null;
        continue;
      }

      if (!currentSection) continue;

      // Completion: - text
      if (trimmed.startsWith('- ')) {
        const completion = trimmed.slice(2);
        if (currentPrefix !== null) {
          sections[currentSection].push({
            prefix: currentPrefix,
            completion: completion,
          });
        }
        continue;
      }

      // Plain text line — could be a prefix or standalone
      // First, flush any previous prefix that had no completions
      if (currentPrefix !== null) {
        // Previous prefix had no completions → standalone line
        sections[currentSection].push({
          prefix: '',
          completion: currentPrefix,
        });
      }

      // Check if next non-empty line is a completion
      currentPrefix = trimmed;
    }

    // Flush last prefix if it had no completions
    if (currentSection && currentPrefix !== null) {
      sections[currentSection].push({
        prefix: '',
        completion: currentPrefix,
      });
    }

    return sections;
  }

  // ======== Animator ========

  function animateSection(el, entries) {
    let entryIdx = 0;
    let linePos = 0;
    let currentPrefix = ''; // what prefix is currently displayed

    const cursorSpan = document.createElement('span');
    cursorSpan.className = 'typer-cursor';
    cursorSpan.textContent = '\u2588';

    function sleep(ms) {
      return new Promise(r => setTimeout(r, ms));
    }

    function getMaxChars() {
      const span = document.createElement('span');
      span.style.cssText =
        'font-family:' + getComputedStyle(el).fontFamily +
        ';font-size:' + getComputedStyle(el).fontSize +
        ';position:absolute;visibility:hidden;white-space:pre;';
      span.textContent = 'M';
      document.body.appendChild(span);
      const charW = span.getBoundingClientRect().width;
      document.body.removeChild(span);
      return Math.floor(el.clientWidth / charW);
    }

    function getText() {
      return el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild.textContent : '';
    }

    function setText(str) {
      const textNode = el.firstChild;
      if (textNode && textNode.nodeType === 3) {
        textNode.textContent = str;
      } else {
        el.insertBefore(document.createTextNode(str), el.firstChild);
      }
    }

    async function typeText(text) {
      const maxChars = getMaxChars();
      const tokens = text.match(/\S+|\s+/g) || [];

      for (let t = 0; t < tokens.length; t++) {
        const token = tokens[t];
        const isSpace = !token.trim();

        if (isSpace) {
          const nextWord = tokens[t + 1];
          if (nextWord && linePos + 1 + nextWord.length > maxChars && linePos > 0) {
            setText(getText() + '\n');
            linePos = 0;
            await sleep(40 + Math.random() * 50);
            continue;
          }
          await sleep(40 + Math.random() * 50);
          setText(getText() + ' ');
          linePos++;
          continue;
        }

        if (linePos > 0 && linePos + token.length > maxChars) {
          setText(getText() + '\n');
          linePos = 0;
        }

        const delays = typingDelays(token);
        for (const { delay, char } of delays) {
          await sleep(delay);
          if (char !== null) {
            setText(getText() + char);
            linePos++;
          }
        }
      }
    }

    async function deleteUntil(keepLen) {
      while (true) {
        const text = getText();
        if (text.length <= keepLen) break;
        await sleep(deleteDelay());
        setText(text.slice(0, -1));
      }
      const remaining = getText();
      const lastNL = remaining.lastIndexOf('\n');
      linePos = lastNL === -1 ? remaining.length : remaining.length - lastNL - 1;
    }

    async function run() {
      // Start with first entry's prefix
      const firstPrefix = entries[0].prefix;
      el.textContent = '';
      el.appendChild(document.createTextNode(''));
      el.appendChild(cursorSpan);

      // Type the initial prefix
      if (firstPrefix) {
        await typeText(firstPrefix + ' ');
      }
      currentPrefix = firstPrefix;

      await sleep(1000 + Math.random() * 2000);

      while (true) {
        const entry = entries[entryIdx];
        const needsNewPrefix = entry.prefix !== currentPrefix;

        if (needsNewPrefix) {
          // Delete everything, type new prefix (if any)
          await deleteUntil(0);
          await sleep(200 + Math.random() * 200);
          if (entry.prefix) {
            await typeText(entry.prefix + ' ');
          }
          currentPrefix = entry.prefix;
        }

        // Type the completion
        await typeText(entry.completion);

        // Pause to read
        await sleep(7000 + Math.random() * 2000);

        // Determine what to delete based on next entry
        const nextIdx = (entryIdx + 1) % entries.length;
        const nextEntry = entries[nextIdx];
        const nextNeedsNewPrefix = nextEntry.prefix !== currentPrefix;

        if (nextNeedsNewPrefix) {
          // Next entry has different prefix — delete everything
          await deleteUntil(0);
          await sleep(200 + Math.random() * 200);
          if (nextEntry.prefix) {
            await typeText(nextEntry.prefix + ' ');
          }
          currentPrefix = nextEntry.prefix;
        } else {
          // Same prefix — just delete the completion
          const prefixLen = currentPrefix ? currentPrefix.length + 1 : 0; // +1 for auto-space
          await deleteUntil(prefixLen);
        }

        await sleep(300 + Math.random() * 400);
        entryIdx = (entryIdx + 1) % entries.length;
      }
    }

    run();
  }

  // ======== Init ========

  async function init() {
    // Fetch and parse bio.md
    let sections;
    try {
      const resp = await fetch('bio.md');
      const md = await resp.text();
      sections = parseBioMd(md);
    } catch (e) {
      console.error('Failed to load bio.md:', e);
      return;
    }

    // Attach to data-typer elements
    const els = document.querySelectorAll('[data-typer]');
    els.forEach(el => {
      const id = el.dataset.typer;
      if (sections[id] && sections[id].length > 0) {
        animateSection(el, sections[id]);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
