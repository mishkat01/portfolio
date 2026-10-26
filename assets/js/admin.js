(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name) => `<svg class="icon"><use href="#i-${esc(name)}"/></svg>`;
  const ICON_NAMES = Object.keys(window.ICONS).sort();
  const DRAFT_KEY = 'portfolio-draft';
  const CONN_KEY = 'portfolio-admin-conn';

  /* ---------- Form schema: every editable field on the site ---------- */
  const f = {
    text: (key, label, extra) => ({ type: 'text', key, label, ...extra }),
    area: (key, label, extra) => ({ type: 'textarea', key, label, ...extra }),
    lines: (key, label, extra) => ({ type: 'lines', key, label, hint: 'One per line.', ...extra }),
    check: (key, label) => ({ type: 'checkbox', key, label }),
    icon: (key = 'icon', label = 'Icon') => ({ type: 'icon', key, label }),
    color: (key, label) => ({ type: 'color', key, label }),
    select: (key, label, options, extra) => ({ type: 'select', key, label, options, ...extra }),
    upload: (key, label, accept, extra) => ({ type: 'upload', key, label, accept, ...extra }),
    list: (key, label, opts) => ({ type: 'list', key, label, ...opts }),
  };
  const BOLD_HINT = 'Wrap words in **double stars** to make them bold.';

  const TABS = [
    {
      id: 'profile', label: 'Profile', icon: 'users', path: 'profile',
      fields: [
        f.text('name', 'Full name'),
        f.text('initials', 'Logo initials', { hint: '2–3 letters shown in the logo.' }),
        f.text('role', 'Job title'),
        f.upload('photo', 'Profile photo', 'image/*', { image: true }),
        f.upload('cv', 'CV / resume (PDF)', 'application/pdf', { hint: 'Leave empty to hide the "Download CV" button.' }),
        f.text('email', 'Email'),
        f.text('phone', 'Phone (as shown)'),
        f.text('whatsapp', 'WhatsApp number', { hint: 'Digits with country code, e.g. 8801821587206. Leave empty if you don\'t use WhatsApp.' }),
        f.text('location', 'Location'),
        f.text('linkedin', 'LinkedIn URL'),
        f.text('github', 'GitHub URL'),
        f.check('available', 'Show "available for work" badge'),
        f.text('availableText', 'Badge text'),
      ],
    },
    {
      id: 'hero', label: 'Hero', icon: 'star', path: 'hero',
      fields: [
        f.area('headline', 'Headline', { rows: 2 }),
        f.text('highlight', 'Highlighted end of headline', { hint: 'Shown in green after the headline.' }),
        f.area('intro', 'Intro text', { rows: 4, hint: 'Your name is made bold automatically.' }),
        f.text('metaLine', 'Small line under buttons'),
      ],
    },
    {
      id: 'stats', label: 'Numbers', icon: 'zap',
      fields: [
        f.list('stats', 'Numbers row', {
          title: (it) => `${it.value || ''}${it.suffix || ''} ${it.label || ''}`,
          blank: { value: '', suffix: '+', label: '' },
          fields: [
            f.text('value', 'Number', { hint: 'Whole numbers count up when shown.' }),
            f.text('suffix', 'After the number (+, %, k…)'),
            f.text('label', 'Label'),
          ],
        }),
      ],
    },
    {
      id: 'services', label: 'Services', icon: 'layout', path: 'services',
      fields: [
        f.text('title', 'Section title'),
        f.area('subtitle', 'Section subtitle', { rows: 2 }),
        f.list('items', 'Services', {
          title: (it) => it.title,
          blank: { icon: 'code', title: '', text: '' },
          fields: [f.icon(), f.text('title', 'Title'), f.area('text', 'Description', { rows: 3 })],
        }),
      ],
    },
    {
      id: 'work', label: 'Projects', icon: 'briefcase', path: 'work',
      fields: [
        f.text('title', 'Section title'),
        f.area('subtitle', 'Section subtitle', { rows: 3 }),
        f.list('items', 'Projects', {
          title: (it) => it.title,
          blank: { title: '', subtitle: '', category: '', badge: '', description: '', features: [], tags: [], link: '', linkLabel: 'View live product', image: '', icon: 'code', mock: 'products', color1: '#10b981', color2: '#0f766e' },
          fields: [
            f.text('title', 'Project name'),
            f.text('subtitle', 'Short subtitle'),
            f.text('category', 'Category chip'),
            f.text('badge', 'Badge (e.g. "Live on CodeCanyon")', { hint: 'Leave empty to hide.' }),
            f.area('description', 'Description', { rows: 3 }),
            f.lines('features', 'Features'),
            f.lines('tags', 'Tech tags'),
            f.text('link', 'Link URL', { hint: 'Leave empty to hide the button.' }),
            f.text('linkLabel', 'Button text'),
            f.upload('image', 'Screenshot (optional)', 'image/*', { image: true, hint: 'If set, the screenshot replaces the drawn cover below.' }),
            f.icon('icon', 'Cover icon'),
            f.select('mock', 'Cover drawing', ['products', 'calendar', 'list', 'player']),
            f.color('color1', 'Cover color 1'),
            f.color('color2', 'Cover color 2'),
          ],
        }),
      ],
    },
    {
      id: 'experience', label: 'Experience', icon: 'briefcase', path: 'experience',
      fields: [
        f.text('title', 'Section title'),
        f.list('items', 'Jobs', {
          title: (it) => [it.role, it.company].filter(Boolean).join(' — '),
          blank: { date: '', role: '', company: '', bullets: [] },
          fields: [
            f.text('role', 'Job title'),
            f.text('company', 'Company'),
            f.text('date', 'Dates & place'),
            f.lines('bullets', 'What you did', { hint: 'One per line. ' + BOLD_HINT }),
          ],
        }),
      ],
    },
    {
      id: 'education', label: 'Education', icon: 'cap', path: 'education',
      fields: [
        f.text('title', 'Section title'),
        f.text('footnote', 'Small note under the list'),
        f.list('items', 'Education', {
          title: (it) => it.title,
          blank: { icon: 'cap', title: '', org: '', note: '' },
          fields: [f.icon(), f.text('title', 'Course / degree'), f.text('org', 'School & years'), f.area('note', 'Note', { rows: 2 })],
        }),
      ],
    },
    {
      id: 'skills', label: 'Skills', icon: 'code', path: 'skills',
      fields: [
        f.text('title', 'Section title'),
        f.area('subtitle', 'Section subtitle', { rows: 2 }),
        f.list('groups', 'Skill groups', {
          title: (it) => it.name,
          blank: { name: '', items: [], extra: [] },
          fields: [f.text('name', 'Group name'), f.lines('items', 'Main skills'), f.lines('extra', 'Exposure skills (dashed)')],
        }),
        f.text('extraNote', 'Note for dashed skills'),
        f.text('terminalTitle', 'Terminal title'),
        f.lines('terminal', 'Terminal lines', { hint: 'One per line. Start with "$ " for a command, "✓" for a green line. Empty = hide terminal.', mono: true }),
      ],
    },
    {
      id: 'process', label: 'Process', icon: 'rocket', path: 'process',
      fields: [
        f.text('title', 'Section title'),
        f.area('subtitle', 'Section subtitle', { rows: 2 }),
        f.list('items', 'Steps', {
          title: (it) => it.title,
          blank: { icon: 'check', title: '', text: '' },
          fields: [f.icon(), f.text('title', 'Step name'), f.area('text', 'Description', { rows: 2 })],
        }),
      ],
    },
    {
      id: 'contact', label: 'Contact', icon: 'mail', path: 'contact',
      fields: [
        f.text('title', 'Section title'),
        f.area('text', 'Text', { rows: 3 }),
        f.lines('options', '"What do you need?" options'),
      ],
    },
    {
      id: 'seo', label: 'SEO', icon: 'globe', path: 'meta',
      fields: [
        f.text('title', 'Browser tab / Google title'),
        f.area('description', 'Google description', { rows: 3, hint: 'About 150 characters.' }),
      ],
    },
  ];

  /* ---------- State ---------- */
  let data = null;
  let sha = null;
  let conn = null; // { owner, repo, branch, folder, token } or null when offline
  let dirty = false;
  let activeTab = 'profile';

  /* ---------- UI helpers ---------- */
  const toastEl = $('[data-toast]');
  let toastTimer;
  const toast = (text, ms = 2600) => {
    toastEl.textContent = text;
    toastEl.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-shown'), ms);
  };

  const setDirty = (value) => {
    dirty = value;
    $('[data-dirty]').hidden = !dirty;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch (e) {}
  };
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  const show = (view) => {
    document.querySelectorAll('[data-view]').forEach((el) => { el.hidden = el.dataset.view !== view; });
  };

  /* ---------- GitHub API ---------- */
  const toBase64 = (bytes) => {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  const fromBase64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));
  const repoPath = (p) => [conn.folder.replace(/^\/+|\/+$/g, ''), p].filter(Boolean).join('/');

  const gh = async (method, path, body) => {
    const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(conn.owner)}/${encodeURIComponent(conn.repo)}/contents/${repoPath(path).split('/').map(encodeURIComponent).join('/')}${method === 'GET' ? `?ref=${encodeURIComponent(conn.branch)}` : ''}`, {
      method,
      headers: {
        Authorization: `Bearer ${conn.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || `GitHub error ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return json;
  };

  const explain = (err) => {
    if (err.status === 401) return 'GitHub says the token is wrong or expired.';
    if (err.status === 403) return 'The token has no permission. Give it "Contents: Read and write" for this repo.';
    if (err.status === 404) return 'Repo, branch or folder not found (or the token cannot see this repo).';
    if (err.status === 409 || err.status === 422) return 'data.json changed on GitHub since you loaded it. Reload the page and try again.';
    return err.message;
  };

  const loadLocal = async () => {
    const res = await fetch('data.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Could not load local data.json');
    return res.json();
  };

  const loadFromGitHub = async () => {
    try {
      const file = await gh('GET', 'data.json');
      sha = file.sha;
      return JSON.parse(fromBase64(file.content));
    } catch (err) {
      if (err.status !== 404) throw err;
      // Repo reachable but no data.json yet: start from the local copy; Save will create it.
      await gh('GET', '').catch((e) => { throw e; });
      sha = null;
      toast('No data.json in the repo yet. Saving will create it.', 4000);
      return loadLocal();
    }
  };

  const save = async () => {
    const text = JSON.stringify(data, null, 2) + '\n';
    if (!conn) { download(text); return; }
    const btn = $('[data-save]');
    btn.disabled = true;
    try {
      const res = await gh('PUT', 'data.json', {
        message: 'Update portfolio content',
        content: toBase64(new TextEncoder().encode(text)),
        branch: conn.branch,
        ...(sha ? { sha } : {}),
      });
      sha = res.content.sha;
      setDirty(false);
      toast('Saved! Your live site updates in about 1 minute.', 4000);
    } catch (err) {
      toast('Save failed: ' + explain(err), 6000);
    } finally {
      btn.disabled = false;
    }
  };

  const uploadFile = async (file) => {
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-').replace(/-+/g, '-');
    const path = `assets/uploads/${Date.now()}-${safe}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    await gh('PUT', path, { message: `Upload ${safe}`, content: toBase64(bytes), branch: conn.branch });
    return path;
  };

  const download = (text) => {
    const blob = new Blob([text], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'data.json' });
    a.click();
    URL.revokeObjectURL(a.href);
    toast('data.json downloaded. Put it in your site folder and upload it.', 4000);
  };

  /* ---------- Form builder ---------- */
  let uid = 0;
  const fieldId = () => `fld-${++uid}`;

  const renderField = (obj, field, onChange) => {
    const wrap = document.createElement('div');
    wrap.className = `field field-${field.type}`;
    const id = fieldId();
    const hint = field.hint ? `<p class="hint">${esc(field.hint)}</p>` : '';
    const value = obj[field.key];

    switch (field.type) {
      case 'text':
        wrap.innerHTML = `<label for="${id}">${esc(field.label)}</label><input id="${id}" type="text" value="${esc(value)}">${hint}`;
        $('input', wrap).addEventListener('input', (e) => { obj[field.key] = e.target.value; onChange(); });
        break;
      case 'textarea':
        wrap.innerHTML = `<label for="${id}">${esc(field.label)}</label><textarea id="${id}" rows="${field.rows || 3}">${esc(value)}</textarea>${hint}`;
        $('textarea', wrap).addEventListener('input', (e) => { obj[field.key] = e.target.value; onChange(); });
        break;
      case 'lines':
        wrap.innerHTML = `<label for="${id}">${esc(field.label)}</label><textarea id="${id}" rows="${Math.max(3, (value || []).length + 1)}"${field.mono ? ' class="mono"' : ''}>${esc((value || []).join('\n'))}</textarea>${hint}`;
        $('textarea', wrap).addEventListener('input', (e) => {
          obj[field.key] = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
          onChange();
        });
        break;
      case 'checkbox':
        wrap.innerHTML = `<label class="check"><input type="checkbox"${value ? ' checked' : ''}> ${esc(field.label)}</label>`;
        $('input', wrap).addEventListener('change', (e) => { obj[field.key] = e.target.checked; onChange(); });
        break;
      case 'select':
        wrap.innerHTML = `<label for="${id}">${esc(field.label)}</label><div class="select"><select id="${id}">${field.options.map((o) => `<option${o === value ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></div>${hint}`;
        $('select', wrap).addEventListener('change', (e) => { obj[field.key] = e.target.value; onChange(); });
        break;
      case 'icon':
        wrap.innerHTML = `<label for="${id}">${esc(field.label)}</label>
          <div class="icon-pick"><span class="icon-preview">${icon(value)}</span>
          <div class="select"><select id="${id}">${ICON_NAMES.map((n) => `<option${n === value ? ' selected' : ''}>${n}</option>`).join('')}</select></div></div>`;
        $('select', wrap).addEventListener('change', (e) => {
          obj[field.key] = e.target.value;
          $('.icon-preview', wrap).innerHTML = icon(e.target.value);
          onChange();
        });
        break;
      case 'color':
        wrap.innerHTML = `<label for="${id}">${esc(field.label)}</label><div class="color-pick"><input id="${id}" type="color" value="${esc(value || '#10b981')}"><input type="text" value="${esc(value || '')}" aria-label="${esc(field.label)} hex"></div>`;
        {
          const [picker, textIn] = wrap.querySelectorAll('input');
          picker.addEventListener('input', () => { textIn.value = picker.value; obj[field.key] = picker.value; onChange(); });
          textIn.addEventListener('input', () => {
            obj[field.key] = textIn.value;
            if (/^#[0-9a-f]{6}$/i.test(textIn.value)) picker.value = textIn.value;
            onChange();
          });
        }
        break;
      case 'upload':
        wrap.innerHTML = `<label for="${id}">${esc(field.label)}</label>
          <div class="upload">
            ${field.image ? `<img class="upload-preview" alt=""${value ? ` src="${esc(value)}"` : ' hidden'}>` : ''}
            <input id="${id}" type="text" value="${esc(value)}" placeholder="path or URL">
            <label class="btn btn-outline btn-sm upload-btn">${icon('upload')} Upload<input type="file" accept="${esc(field.accept)}" hidden></label>
          </div>${hint}`;
        {
          const textIn = $(`#${id}`, wrap);
          const preview = $('.upload-preview', wrap);
          const setPreview = (src) => { if (preview) { preview.hidden = !src; if (src) preview.src = src; } };
          textIn.addEventListener('input', () => { obj[field.key] = textIn.value.trim(); setPreview(obj[field.key]); onChange(); });
          $('input[type=file]', wrap).addEventListener('change', async (e) => {
            const file = e.target.files[0];
            e.target.value = '';
            if (!file) return;
            if (!conn) { toast('Uploading needs a GitHub connection. In offline mode, type the file path instead.', 4500); return; }
            if (file.size > 20 * 1024 * 1024) { toast('File is too big (max 20 MB).'); return; }
            toast('Uploading…', 60000);
            try {
              const path = await uploadFile(file);
              obj[field.key] = path;
              textIn.value = path;
              setPreview(URL.createObjectURL(file));
              onChange();
              toast('Uploaded. Press Save to use it on the site.', 4000);
            } catch (err) {
              toast('Upload failed: ' + explain(err), 6000);
            }
          });
        }
        break;
      case 'list':
        wrap.classList.add('list-field');
        renderList(wrap, obj, field, onChange);
        break;
    }
    return wrap;
  };

  const renderList = (wrap, obj, field, onChange) => {
    if (!Array.isArray(obj[field.key])) obj[field.key] = [];
    const items = obj[field.key];
    wrap.innerHTML = `<div class="list-head"><h3>${esc(field.label)} <span class="count">${items.length}</span></h3></div>`;
    const box = document.createElement('div');
    box.className = 'list-items';
    wrap.appendChild(box);

    const rerender = (openIndex) => {
      renderList(wrap, obj, field, onChange);
      if (openIndex != null) {
        const card = wrap.querySelectorAll('.item')[openIndex];
        if (card) { card.open = true; card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      }
    };

    items.forEach((item, i) => {
      const card = document.createElement('details');
      card.className = 'item';
      const label = () => esc(field.title(item) || '').trim() || `<em>New item</em>`;
      card.innerHTML = `<summary>
          <span class="item-num">${i + 1}</span><span class="item-title">${label()}</span>
          <span class="item-actions">
            <button type="button" class="icon-btn" data-act="up" aria-label="Move up"${i === 0 ? ' disabled' : ''}>${icon('chevron-up')}</button>
            <button type="button" class="icon-btn" data-act="down" aria-label="Move down"${i === items.length - 1 ? ' disabled' : ''}>${icon('chevron-down')}</button>
            <button type="button" class="icon-btn danger" data-act="del" aria-label="Delete">${icon('trash')}</button>
          </span>
        </summary>`;
      const body = document.createElement('div');
      body.className = 'item-body';
      field.fields.forEach((sub) => body.appendChild(renderField(item, sub, () => {
        $('.item-title', card).innerHTML = label();
        onChange();
      })));
      card.appendChild(body);

      card.querySelector('.item-actions').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        e.preventDefault();
        const act = btn.dataset.act;
        if (act === 'del') {
          if (!confirm(`Delete "${field.title(item) || 'this item'}"?`)) return;
          items.splice(i, 1);
          rerender();
        } else {
          const j = act === 'up' ? i - 1 : i + 1;
          [items[i], items[j]] = [items[j], items[i]];
          rerender();
        }
        onChange();
      });
      box.appendChild(card);
    });

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn btn-outline btn-sm add-btn';
    add.innerHTML = `${icon('plus')} Add ${esc(field.label.toLowerCase().replace(/s$/, ''))}`;
    add.addEventListener('click', () => {
      items.push(structuredClone(field.blank));
      rerender(items.length - 1);
      onChange();
    });
    wrap.appendChild(add);
  };

  /* ---------- Tabs ---------- */
  const renderTabs = () => {
    $('[data-tabs]').innerHTML = TABS.map((t) => `
      <button type="button" class="tab${t.id === activeTab ? ' is-active' : ''}" data-tab="${t.id}">${icon(t.icon)}<span>${esc(t.label)}</span></button>`).join('');
  };

  const renderPanel = () => {
    const tab = TABS.find((t) => t.id === activeTab);
    const target = tab.path ? (data[tab.path] ??= {}) : data;
    const panel = $('[data-panel]');
    panel.innerHTML = `<div class="panel-head"><h2>${esc(tab.label)}</h2></div>`;
    const card = document.createElement('div');
    card.className = 'panel-card';
    tab.fields.forEach((field) => card.appendChild(renderField(target, field, () => setDirty(true))));
    panel.appendChild(card);
  };

  $('[data-tabs]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    activeTab = btn.dataset.tab;
    renderTabs();
    renderPanel();
    window.scrollTo({ top: 0 });
  });

  const openEditor = (loaded) => {
    data = loaded;
    show('editor');
    $('[data-conn]').textContent = conn ? `${conn.owner}/${conn.repo} · ${conn.branch}` : 'Offline — Save downloads data.json';
    $('[data-save]').lastChild.textContent = conn ? 'Save' : 'Download';
    $('[data-download]').hidden = !conn;
    setDirty(false);
    renderTabs();
    renderPanel();
  };

  /* ---------- Login ---------- */
  const loginForm = $('[data-login-form]');
  const loginError = $('[data-login-error]');
  const storedConn = (() => {
    try { return JSON.parse(localStorage.getItem(CONN_KEY) || sessionStorage.getItem(CONN_KEY) || 'null'); } catch (e) { return null; }
  })();
  const defaults = storedConn || { owner: 'mishkat01', repo: 'mishkat01.github.io', branch: 'main', folder: '', token: '' };
  ['owner', 'repo', 'branch', 'folder', 'token'].forEach((k) => { loginForm.elements[k].value = defaults[k] || ''; });

  const connect = async (c, remember) => {
    conn = c;
    loginError.hidden = true;
    const btn = loginForm.querySelector('[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Connecting…';
    try {
      const loaded = await loadFromGitHub();
      try {
        const store = remember ? localStorage : sessionStorage;
        (remember ? sessionStorage : localStorage).removeItem(CONN_KEY);
        store.setItem(CONN_KEY, JSON.stringify(c));
      } catch (e) {}
      openEditor(loaded);
    } catch (err) {
      conn = null;
      loginError.textContent = explain(err);
      loginError.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Connect & load';
    }
  };

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = (k) => loginForm.elements[k].value.trim();
    connect({ owner: v('owner'), repo: v('repo'), branch: v('branch') || 'main', folder: v('folder'), token: v('token') }, loginForm.elements.remember.checked);
  });

  $('[data-offline]').addEventListener('click', async () => {
    conn = null;
    try { openEditor(await loadLocal()); } catch (err) { loginError.textContent = err.message; loginError.hidden = false; }
  });

  /* ---------- Top bar ---------- */
  $('[data-save]').addEventListener('click', save);
  $('[data-download]').addEventListener('click', () => download(JSON.stringify(data, null, 2) + '\n'));
  $('[data-preview]').addEventListener('click', () => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch (e) {}
    window.open('index.html?preview=1', '_blank');
  });
  $('[data-logout]').addEventListener('click', () => {
    if (dirty && !confirm('You have unsaved changes. Disconnect anyway?')) return;
    try { localStorage.removeItem(CONN_KEY); sessionStorage.removeItem(CONN_KEY); } catch (e) {}
    loginForm.elements.token.value = '';
    conn = null;
    dirty = false;
    show('login');
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && data) { e.preventDefault(); save(); }
  });
})();
