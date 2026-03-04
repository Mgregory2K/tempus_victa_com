let _activeOverlay = null;

function ensureModalCss(){
  const href = "/ui/shared/modal.css";
  const exists = [...document.querySelectorAll("link[rel='stylesheet']")].some(l => (l.getAttribute('href')||'') === href);
  if (!exists){
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

function closeActive(){
  if (_activeOverlay && _activeOverlay.parentNode){
    _activeOverlay.parentNode.removeChild(_activeOverlay);
  }
  _activeOverlay = null;
}

export function openModal(title, bodyNodeOrHtml, onSave, opts = {}){
  ensureModalCss();
  closeActive();

  const overlay = document.createElement('div');
  overlay.className = 'udl-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'udl-modal azure';

  const header = document.createElement('div');
  header.className = 'udl-modal-header';

  const h2 = document.createElement('h2');
  h2.textContent = (typeof title === 'string') ? title : (title?.title || 'Edit');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn subtle';
  closeBtn.type = 'button';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', closeActive);

  header.appendChild(h2);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'udl-modal-body';

  if (bodyNodeOrHtml instanceof HTMLElement){
    body.appendChild(bodyNodeOrHtml);
  } else if (typeof bodyNodeOrHtml === 'string'){
    const wrap = document.createElement('div');
    wrap.innerHTML = bodyNodeOrHtml;
    body.appendChild(wrap);
  } else {
    body.innerHTML = `<div class="muted">No content.</div>`;
  }

  const actions = document.createElement('div');
  actions.className = 'udl-modal-actions';

  const cancel = document.createElement('button');
  cancel.className = 'btn';
  cancel.type = 'button';
  cancel.textContent = opts.cancelText || 'Cancel';
  cancel.addEventListener('click', closeActive);

  const save = document.createElement('button');
  save.className = 'btn primary';
  save.type = 'button';
  save.textContent = opts.saveText || 'Save';
  save.addEventListener('click', async () => {
    if (typeof onSave === 'function'){
      const r = onSave();
      if (r && typeof r.then === 'function') await r;
    }
    closeActive();
  });

  actions.appendChild(cancel);
  actions.appendChild(save);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(actions);
  overlay.appendChild(modal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && opts.backdropClose !== false) closeActive();
  });

  document.body.appendChild(overlay);
  _activeOverlay = overlay;

  return { close: closeActive, overlay, modal, body };
}

// IMPORTANT: WinBoard imports this by name.
export function openPrompt(title, labelText, defaultValue = ''){
  return new Promise((resolve) => {
    const wrap = document.createElement('div');

    const label = document.createElement('label');
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;

    wrap.appendChild(label);
    wrap.appendChild(input);

    const { overlay } = openModal(title, wrap, () => resolve((input.value || '').trim()), {
      saveText: 'OK',
      cancelText: 'Cancel'
    });

    const cancelBtn = overlay.querySelector('.udl-modal-actions .btn:not(.primary)');
    if (cancelBtn){
      cancelBtn.addEventListener('click', () => resolve(null), { once: true });
    }

    setTimeout(() => input.focus(), 30);
  });
}
