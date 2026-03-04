import { el } from "/ui/shared/ui.js";

// =====================================================
// PBJ THEME + INLINE COLOR STRIPPER (one-file fix)
// Makes PBJ readable in dark mode by removing inline color
// =====================================================
(function () {
  const qs = new URLSearchParams(location.search);

  function getTheme() {
    const t = (qs.get("theme") || document.documentElement.getAttribute("data-theme") || "light");
    return String(t).toLowerCase();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    // Kill any inline color that forces black text in dark mode
    const root = document.getElementById("root") || document.body;

    if (!root) return;

    // Remove inline color styles (including "!important" if present)
    const kill = (el) => {
      if (!el || !el.style) return;
      try { el.style.removeProperty("color"); } catch (e) {}
      try { el.style.removeProperty("background"); } catch (e) {}
      try { el.style.removeProperty("background-color"); } catch (e) {}
    };

    // Root + all descendants
    kill(root);
    root.querySelectorAll("*").forEach(kill);

    // Optional: ensure dark text flips to light if something still inherits badly
    if (theme === "dark") {
      root.style.setProperty("color", "rgba(248,250,252,0.94)", "important");
    } else {
      root.style.setProperty("color", "rgba(15,23,42,0.92)", "important");
    }
  }

  // Apply once immediately
  applyTheme(getTheme());

  // Listen to shell theme broadcasts if/when they happen
  window.addEventListener("message", (ev) => {
    if (!ev || !ev.data) return;
    if (ev.data.type === "udl-theme" && ev.data.theme) {
      applyTheme(String(ev.data.theme).toLowerCase());
    }
  });

  // Guard: if PBJ render code re-inserts inline styles, strip them again
  const obs = new MutationObserver(() => applyTheme(getTheme()));
  window.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root") || document.body;
    if (root) obs.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });
  });
})();


function render(){
  const root = document.getElementById("root");
  root.innerHTML = "";

  const hdr = el("div",{class:"hdr"},[
    el("div",{},[
      el("h1",{class:"page-title", style:"margin:0;"},["PBJ Intake"]),
      el("div",{class:"subtle"},["Intake only • no processing behind it yet • UI alignment target"])
    ]),
    el("div",{class:"row", style:"gap:10px; justify-content:flex-end;"},[
      el("button",{class:"btn", id:"reset"},["Reset"]),
      el("button",{class:"btn primary", id:"submit"},["Run PBJ (stub)"])
    ])
  ]);

  const left = el("div",{class:"card"},[
    el("div",{class:"hd"},[
      el("div",{class:"h3"},["Input"]),
      el("span",{class:"chip warn"},["UI Only"])
    ]),
    el("div",{class:"bd"},[
      el("iframe",{src:"/ui/modules/pbj/intake.html", style:"width:100%; height:760px; border:0; border-radius:14px; background: transparent;"})
    ])
  ]);

  const right = el("div",{class:"card"},[
  el("div",{class:"hd"},[
    el("div",{class:"h3"},['What "Invite" will become']),
    el("span",{class:"chip"},["Design"])
  ]),
  el("div",{class:"bd"},[
    el("div",{class:"mini"},[
      "No emails/texts yet. In the UI shell it will stage collaborators + roles locally, then later map to real auth."
    ]),

    el("div",{class:"card", style:"border-radius:14px; padding:12px; background: rgba(0,0,0,0.14); margin-top:12px;"},[
      el("div",{style:"font-weight:850;"},["Invite modes (future)"]),
      el("div",{class:"subtle", style:"margin-top:6px; white-space:pre-line;"},[
        "• Email invite (accounts)\n" +
        "• LAN/IP pairing (local-only)\n" +
        "• One-time demo link (expires)\n\n" +
        "We'll implement UI now; backend later."
      ])
    ]),

    el("div",{class:"card", style:"border-radius:14px; padding:12px; background: rgba(0,0,0,0.14); margin-top:12px;"},[
      el("div",{style:"font-weight:850;"},["Roles in this build"]),
      el("div",{class:"subtle", style:"margin-top:6px;"},[
        "Admin • Reader • Contributor • Demo (local, wiped on logout)"
      ])
    ])
  ])
]);

  root.appendChild(hdr);
  root.appendChild(el("div",{class:"formGrid"},[left,right]));

  document.getElementById("reset").addEventListener("click", ()=>alert("Reset (stub) — later resets the embedded form safely."));
  document.getElementById("submit").addEventListener("click", ()=>alert("PBJ Run is intentionally stubbed until your other PBJ project is ready."));
}
render();