// Shared modal helpers (ES module)
// Purpose: lightweight, dependency-free prompts/modals that feel consistent with the shell.

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function ensureStyles() {
  if (document.getElementById("udl-shared-modal-css")) return;
  const style = document.createElement("style");
  style.id = "udl-shared-modal-css";
  style.textContent = `
    .udl-shared-modal-backdrop{ position:fixed; inset:0; background: rgba(8,16,30,0.58); display:flex; align-items:center; justify-content:center; z-index:9999; padding:16px; }
    .udl-shared-modal{ width:min(720px, 96vw); max-height: 92vh; overflow:auto;
      background: linear-gradient(180deg, rgba(10,33,64,0.98) 0%, rgba(9,24,46,0.98) 100%);
      border:1px solid rgba(140,190,255,0.22);
      border-radius:18px;
      box-shadow: 0 18px 60px rgba(0,0,0,0.55);
      color: rgba(255,255,255,0.92);
    }
    .udl-shared-modal-hd{ padding:12px 14px; display:flex; justify-content:space-between; align-items:center; gap:12px;
      border-bottom:1px solid rgba(140,190,255,0.18);
      position:sticky; top:0;
      background: rgba(10,33,64,0.98);
    }
    .udl-shared-modal-title{ font-size:16px; font-weight:900; letter-spacing:0.02em; }
    .udl-shared-modal-bd{ padding:14px; display:grid; gap:10px; }
    .udl-shared-modal-bd label{ font-size:12px; color: rgba(255,255,255,0.78); }
    .udl-shared-modal-bd input{ width:100%; padding:10px 10px; border-radius:12px; border:1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: inherit; outline:none; }
    .udl-shared-modal-bd input:focus{ border-color: rgba(120,160,255,0.75); box-shadow: 0 0 0 3px rgba(120,160,255,0.18); }
    .udl-shared-modal-ft{ display:flex; justify-content:flex-end; gap:10px; padding: 0 14px 14px 14px; }
  `;
  document.head.appendChild(style);
}

function mountModal({ title, bodyHtml }) {
  ensureStyles();
  const backdrop = document.createElement("div");
  backdrop.className = "udl-shared-modal-backdrop";
  const panel = document.createElement("div");
  panel.className = "udl-shared-modal";
  panel.innerHTML = `
    <div class="udl-shared-modal-hd">
      <div class="udl-shared-modal-title">${esc(title || "")}</div>
      <button class="btn smallbtn" type="button" data-x="1">Close</button>
    </div>
    <div class="udl-shared-modal-bd">${bodyHtml}</div>
  `;
  backdrop.appendChild(panel);
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  panel.querySelector('[data-x="1"]').addEventListener("click", close);

  return { backdrop, panel, close };
}

// Simple text prompt returning string or null.
export function openPrompt({ title = "", label = "", placeholder = "", defaultValue = "", okText = "OK", cancelText = "Cancel" } = {}) {
  return new Promise((resolve) => {
    const m = mountModal({
      title: title || "Input",
      bodyHtml: `
        ${label ? `<label>${esc(label)}</label>` : ""}
        <input type="text" data-i="1" value="${esc(defaultValue)}" placeholder="${esc(placeholder)}"/>
        <div class="udl-shared-modal-ft">
          <button class="btn" type="button" data-cancel="1">${esc(cancelText)}</button>
          <button class="btn primary" type="button" data-ok="1">${esc(okText)}</button>
        </div>
      `
    });

    const input = m.panel.querySelector('[data-i="1"]');
    const done = (val) => { m.close(); resolve(val); };

    m.panel.querySelector('[data-cancel="1"]').addEventListener("click", () => done(null));
    m.panel.querySelector('[data-ok="1"]').addEventListener("click", () => done((input.value ?? "").toString()));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); done((input.value ?? "").toString()); }
      if (e.key === "Escape") { e.preventDefault(); done(null); }
    });

    // focus/select
    setTimeout(() => { try { input.focus(); input.select(); } catch {} }, 0);
  });
}
