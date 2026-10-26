(() => {
  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Helpers ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Escaped text with **bold** support
  const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const url = (u) => (/^\s*(javascript|data):/i.test(u || '') ? '#' : esc(u));
  const icon = (name) => `<svg class="icon"><use href="#i-${esc(name)}"/></svg>`;
  const list = (a) => (Array.isArray(a) ? a.filter((x) => x !== '' && x != null) : []);
  const prettyUrl = (u) => String(u || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const reveal = (d = 0) => `data-reveal${d ? ` style="--d:${d}s"` : ''}`;
  const head = (eyebrow, title, sub) => `
    <div class="section-head" ${reveal()}>
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h2>${esc(title)}</h2>
      ${sub ? `<p>${esc(sub)}</p>` : ''}
    </div>`;

  const fill = (name, html) => {
    const el = document.querySelector(`[data-section="${name}"]`);
    const section = el.closest('section, footer');
    section.hidden = !html;
    el.innerHTML = html || '';
    if (section.id) {
      const link = document.querySelector(`.nav-links a[href="#${section.id}"]`);
      if (link) link.parentElement.hidden = !html;
    }
  };

  /* ---------- Section renderers ---------- */
  const renderHero = ({ profile: p, hero: h }) => {
    const intro = rich(h.intro).replace(esc(p.name), `<strong>${esc(p.name)}</strong>`);
    return `
      ${p.photo ? `<div class="avatar" ${reveal()}><picture><img src="${url(p.photo)}" width="600" height="600" alt="Portrait of ${esc(p.name)}" fetchpriority="high"></picture></div>` : ''}
      ${p.available ? `<a class="status-pill" href="#contact" ${reveal(.05)}><span class="dot" aria-hidden="true"></span>${esc(p.availableText)}</a>` : ''}
      <h1 ${reveal(.1)}>${esc(h.headline)} <span class="hl">${esc(h.highlight)}</span></h1>
      ${h.intro ? `<p class="lead" ${reveal(.15)}>${intro}</p>` : ''}
      <div class="cta-row" ${reveal(.2)}>
        <a class="btn btn-primary" href="#contact">Start a project ${icon('arrow-right')}</a>
        <a class="btn btn-outline" href="#work">See my work</a>
        ${p.cv ? `<a class="btn btn-ghost" href="${url(p.cv)}" download>${icon('download')} Download CV</a>` : ''}
      </div>
      <ul class="hero-meta" ${reveal(.25)}>
        ${p.location ? `<li>${icon('pin')} ${esc(p.location)}</li>` : ''}
        ${h.metaLine ? `<li>${icon('card')} ${esc(h.metaLine)}</li>` : ''}
      </ul>`;
  };

  const renderStats = ({ stats }) => {
    const items = list(stats);
    if (!items.length) return '';
    return `<div class="stats-grid" ${reveal()}>${items.map((s) => `
      <div class="stat">
        <div class="stat-num"><span ${/^\d+$/.test(s.value) ? `data-count="${esc(s.value)}"` : ''}>${esc(s.value)}</span>${s.suffix ? `<span class="suffix">${esc(s.suffix)}</span>` : ''}</div>
        <div class="stat-label">${esc(s.label)}</div>
      </div>`).join('')}</div>`;
  };

  const renderServices = ({ services: s }) => {
    const items = list(s.items);
    if (!items.length) return '';
    return head('Services', s.title, s.subtitle) + `<div class="grid-3">${items.map((it, i) => `
      <article class="card" ${reveal((i % 3) * .05)}>
        <span class="card-icon">${icon(it.icon)}</span>
        <h3>${esc(it.title)}</h3>
        <p>${esc(it.text)}</p>
      </article>`).join('')}</div>`;
  };

  const mocks = {
    products: () => `<div class="m-head"><b class="m-title"></b><b class="m-btn"></b></div>
      <div class="m-products">${'<span></span>'.repeat(6)}</div>`,
    calendar: () => {
      const pattern = '.s.o..s s.o.s.. .o..so. ..s...s';
      const cells = [...pattern.replace(/ /g, '')].map((c) => `<span${c === 'o' ? ' class="on"' : c === 's' ? ' class="soft"' : ''}></span>`);
      return `<div class="m-head"><b class="m-title"></b><b class="m-btn"></b></div><div class="m-cal">${cells.join('')}</div>`;
    },
    list: () => `<div class="m-head"><b class="m-title"></b><b class="m-btn"></b></div>
      <div class="m-list">${'<div class="m-row"><i></i><b></b><b class="s"></b></div>'.repeat(4)}</div>`,
    player: () => `<div class="m-player"><span class="m-live">LIVE</span><span class="m-play"></span></div>
      <div class="m-thumbs">${'<span></span>'.repeat(4)}</div>`,
  };

  const cover = (it) => {
    const style = `--c1:${esc(it.color1 || '#10b981')}; --c2:${esc(it.color2 || '#0f766e')}`;
    if (it.image) {
      return `<div class="cover has-image" style="${style}"><img src="${url(it.image)}" alt="${esc(it.title)} screenshot" loading="lazy"></div>`;
    }
    return `<div class="cover" style="${style}">
      <span class="cover-icon">${icon(it.icon || 'code')}</span>
      <div class="mock" aria-hidden="true">
        <div class="mock-bar"><i></i><i></i><i></i></div>
        <div class="mock-body">
          <div class="mock-side">${'<b></b>'.repeat(5)}</div>
          <div class="mock-main">${(mocks[it.mock] || mocks.products)()}</div>
        </div>
      </div>
    </div>`;
  };

  const renderWork = ({ work: w }) => {
    const items = list(w.items);
    if (!items.length) return '';
    return head('Selected work', w.title, w.subtitle) + `<div class="projects">${items.map((it, i) => `
      <article class="project" ${reveal((i % 2) * .08)}>
        ${cover(it)}
        <div class="project-body">
          <div class="project-top">
            ${it.category ? `<span class="chip">${esc(it.category)}</span>` : '<span></span>'}
            ${it.badge ? `<span class="live"><span class="dot" aria-hidden="true"></span> ${esc(it.badge)}</span>` : ''}
          </div>
          <h3>${esc(it.title)}</h3>
          ${it.subtitle ? `<p class="project-sub">${esc(it.subtitle)}</p>` : ''}
          ${it.description ? `<p class="project-desc">${esc(it.description)}</p>` : ''}
          ${list(it.features).length ? `<ul class="features">${list(it.features).map((f) => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul>` : ''}
          ${list(it.tags).length ? `<div class="tags">${list(it.tags).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
          ${it.link ? `<a class="btn btn-outline btn-sm project-link" href="${url(it.link)}" target="_blank" rel="noopener">${esc(it.linkLabel || 'View project')} ${icon('arrow-up-right')}</a>` : ''}
        </div>
      </article>`).join('')}</div>`;
  };

  const renderExperience = ({ experience: x, education: e }) => {
    const jobs = list(x.items);
    const edu = list(e.items);
    if (!jobs.length && !edu.length) return '';
    const left = jobs.length ? `<div>${head('Experience', x.title)}
      <ol class="timeline">${jobs.map((j) => `
        <li class="tl-item" ${reveal()}>
          <span class="tl-date">${esc(j.date)}</span>
          <h3>${esc(j.role)}</h3>
          <p class="tl-org">${esc(j.company)}</p>
          ${list(j.bullets).length ? `<ul>${list(j.bullets).map((b) => `<li>${rich(b)}</li>`).join('')}</ul>` : ''}
        </li>`).join('')}</ol></div>` : '';
    const right = edu.length ? `<aside class="edu">${head('Education', e.title)}
      <div class="edu-list">${edu.map((it, i) => `
        <div class="edu-card" ${reveal(i * .05)}>
          <span class="card-icon">${icon(it.icon || 'cap')}</span>
          <div>
            <h3>${esc(it.title)}</h3>
            ${it.org ? `<p class="edu-org">${esc(it.org)}</p>` : ''}
            ${it.note ? `<p class="edu-note">${esc(it.note)}</p>` : ''}
          </div>
        </div>`).join('')}
        ${e.footnote ? `<p class="edu-ref" ${reveal()}>${esc(e.footnote)}</p>` : ''}
      </div></aside>` : '';
    return left + right;
  };

  const terminalLine = (line) => {
    const t = String(line);
    if (t.startsWith('$')) return `<span class="t-line"><span class="t-prompt">$</span> <span class="t-cmd">${esc(t.slice(1).trim())}</span></span>`;
    if (t.startsWith('✓')) return `<span class="t-line"><span class="t-ok">  ${esc(t)}</span></span>`;
    return `<span class="t-line"><span class="t-muted">  ${esc(t)}</span></span>`;
  };

  const renderSkills = ({ skills: s }) => {
    const groups = list(s.groups);
    const lines = list(s.terminal);
    if (!groups.length) return '';
    const hasExtra = groups.some((g) => list(g.extra).length);
    const terminal = lines.length ? `
      <div class="terminal" data-terminal ${reveal(.1)} aria-label="Example deployment log">
        <div class="term-bar"><i></i><i></i><i></i><span class="term-title">${esc(s.terminalTitle)}</span></div>
        <pre class="term-body">${lines.map(terminalLine).join('\n')} <span class="t-cursor" aria-hidden="true"></span></pre>
      </div>` : '';
    return head('Skills', s.title, s.subtitle) + `
      <div class="skills-grid${terminal ? '' : ' no-terminal'}">
        <div class="skill-groups">${groups.map((g) => `
          <div class="skill-group" ${reveal()}>
            <h3>${esc(g.name)}</h3>
            <div class="skill-chips">
              ${list(g.items).map((x) => `<span class="skill-chip">${esc(x)}</span>`).join('')}
              ${list(g.extra).map((x) => `<span class="skill-chip is-soft">${esc(x)}</span>`).join('')}
            </div>
          </div>`).join('')}
          ${hasExtra && s.extraNote ? `<p class="skill-note">${esc(s.extraNote)}</p>` : ''}
        </div>
        ${terminal}
      </div>`;
  };

  const renderProcess = ({ process: pr }) => {
    const items = list(pr.items);
    if (!items.length) return '';
    return head('How I work', pr.title, pr.subtitle) + `<ol class="steps">${items.map((it, i) => `
      <li class="step" ${reveal(i * .05)}>
        <span class="step-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="card-icon">${icon(it.icon || 'check')}</span>
        <h3>${esc(it.title)}</h3>
        <p>${esc(it.text)}</p>
      </li>`).join('')}</ol>`;
  };

  const method = (href, iconName, label, value, external) => `
    <li><a class="method" href="${url(href)}"${external ? ' target="_blank" rel="noopener"' : ''}>
      <span class="method-icon">${icon(iconName)}</span>
      <span class="method-link"><span class="method-label">${label}</span><span class="method-value">${esc(value)}</span></span>
    </a></li>`;

  const renderContact = ({ profile: p, contact: c }) => `
    <div class="contact-card" ${reveal()}>
      <div class="contact-info">
        <p class="eyebrow">Contact</p>
        <h2>${esc(c.title)}</h2>
        <p class="contact-text">${esc(c.text)}</p>
        <ul class="contact-methods">
          ${p.email ? `<li class="method">
            <span class="method-icon">${icon('mail')}</span>
            <a class="method-link" href="mailto:${esc(p.email)}"><span class="method-label">Email</span><span class="method-value">${esc(p.email)}</span></a>
            <button class="icon-btn copy-btn" type="button" data-copy="${esc(p.email)}" aria-label="Copy email address">${icon('copy')}</button>
          </li>` : ''}
          ${p.whatsapp ? method(`https://wa.me/${String(p.whatsapp).replace(/\D/g, '')}`, 'chat', 'WhatsApp / Phone', p.phone || p.whatsapp, true)
            : p.phone ? method(`tel:${String(p.phone).replace(/[^\d+]/g, '')}`, 'phone', 'Phone', p.phone) : ''}
          ${p.linkedin ? method(p.linkedin, 'linkedin', 'LinkedIn', prettyUrl(p.linkedin).replace(/^linkedin\.com\//, '').replace(/-[a-z0-9]*\d[a-z0-9]*$/, ''), true) : ''}
          ${p.github ? method(p.github, 'github', 'GitHub', prettyUrl(p.github), true) : ''}
        </ul>
      </div>
      ${p.email ? `<form class="form" data-contact-form data-email="${esc(p.email)}">
        <div class="form-row">
          <div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" type="text" autocomplete="name" required></div>
          <div class="field"><label for="f-email">Your email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
        </div>
        ${list(c.options).length ? `<div class="field"><label for="f-type">What do you need?</label>
          <div class="select"><select id="f-type" name="type">${list(c.options).map((o) => `<option>${esc(o)}</option>`).join('')}</select></div></div>` : ''}
        <div class="field"><label for="f-msg">Tell me about your project</label>
          <textarea id="f-msg" name="message" rows="5" required placeholder="What are you building? Any deadline or budget in mind?"></textarea></div>
        <button class="btn btn-primary btn-block" type="submit">Send message ${icon('arrow-right')}</button>
        <p class="form-note">This opens your email app with the message ready to send.</p>
      </form>` : ''}
    </div>`;

  const renderFooter = ({ profile: p }) => `
    <p>© ${new Date().getFullYear()} ${esc(p.name)} · ${esc(p.role)}</p>
    <div class="footer-links">
      ${p.github ? `<a class="icon-btn" href="${url(p.github)}" target="_blank" rel="noopener" aria-label="GitHub">${icon('github')}</a>` : ''}
      ${p.linkedin ? `<a class="icon-btn" href="${url(p.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">${icon('linkedin')}</a>` : ''}
      ${p.email ? `<a class="icon-btn" href="mailto:${esc(p.email)}" aria-label="Email">${icon('mail')}</a>` : ''}
      <a class="icon-btn" href="#top" aria-label="Back to top">${icon('arrow-up')}</a>
    </div>`;

  const applyMeta = ({ meta = {}, profile: p }) => {
    if (meta.title) document.title = meta.title;
    if (meta.description) document.querySelector('meta[name="description"]').setAttribute('content', meta.description);
    document.querySelectorAll('[data-bind]').forEach((el) => { el.textContent = p[el.dataset.bind] || ''; });
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: p.name,
      jobTitle: p.role,
      email: p.email ? `mailto:${p.email}` : undefined,
      telephone: p.phone || undefined,
      address: p.location ? { '@type': 'PostalAddress', addressLocality: p.location } : undefined,
      sameAs: [p.github, p.linkedin].filter(Boolean),
    });
    document.head.appendChild(ld);
  };

  const render = (data) => {
    applyMeta(data);
    fill('hero', renderHero(data));
    fill('stats', renderStats(data));
    fill('services', renderServices(data));
    fill('work', renderWork(data));
    fill('experience', renderExperience(data));
    fill('skills', renderSkills(data));
    fill('process', renderProcess(data));
    fill('contact', renderContact(data));
    fill('footer', renderFooter(data));
  };

  /* ---------- Theme ---------- */
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const themeBtn = document.querySelector('[data-theme-toggle]');
  const currentTheme = () => root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');

  const syncThemeButton = () => {
    const mode = currentTheme();
    themeBtn.dataset.mode = mode;
    themeBtn.setAttribute('aria-label', mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  };

  themeBtn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeButton();
  });
  darkQuery.addEventListener('change', syncThemeButton);
  syncThemeButton();

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const setMenu = (open) => {
    header.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('nav-open')));
  document.querySelectorAll('#nav-links a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Header border on scroll ---------- */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Toast ---------- */
  const toast = document.querySelector('[data-toast]');
  let toastTimer;
  const showToast = (text) => {
    toast.textContent = text;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 2200);
  };

  /* ---------- Behaviour for rendered content ---------- */
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion || !target) return;
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const typeTerminal = (term) => {
    if (reduceMotion) return;
    const lines = [...term.querySelectorAll('.t-line')];
    term.classList.add('is-typing');
    lines.forEach((line, i) => setTimeout(() => line.classList.add('is-shown'), 350 + i * 380));
  };

  const activate = () => {
    // Active nav link
    const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]:not(.btn)')];
    const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter((s) => s && !s.hidden);
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => sectionObserver.observe(s));

    // Scroll reveal
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        el.querySelectorAll('[data-count]').forEach(countUp);
        if (el.hasAttribute('data-terminal')) typeTerminal(el);
        obs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

    // Copy email
    document.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const value = btn.dataset.copy;
        try {
          await navigator.clipboard.writeText(value);
        } catch (e) {
          const tmp = document.createElement('textarea');
          tmp.value = value;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand('copy');
          tmp.remove();
        }
        showToast('Email copied');
      });
    });

    // Contact form → email app
    const form = document.querySelector('[data-contact-form]');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const subject = `${data.get('type') || 'New project'} — from ${data.get('name')}`;
        const body = `${data.get('message')}\n\n— ${data.get('name')}\n${data.get('email')}`;
        window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        showToast('Opening your email app…');
      });
    }

    // Jump to #section if the page was opened with a hash
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
  };

  /* ---------- Load data ---------- */
  // admin.html "Preview" opens index.html?preview=1 and shows the unsaved draft
  const draft = (() => {
    if (!new URLSearchParams(location.search).has('preview')) return null;
    try { return JSON.parse(localStorage.getItem('portfolio-draft')); } catch (e) { return null; }
  })();

  (draft ? Promise.resolve(draft) : fetch('data.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }))
    .then((data) => {
      render(data);
      activate();
      if (draft) showToast('Preview — these changes are not saved yet');
    })
    .catch((err) => {
      document.querySelector('#main').innerHTML = `<p class="container load-error">Could not load data.json (${esc(err.message)}). Open this page through a web server, not as a file.</p>`;
    });
})();
