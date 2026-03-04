function broadcastTheme(theme){ try{ document.querySelectorAll('iframe').forEach(fr=>{ try{ fr.contentWindow?.postMessage({ type:'udl-theme', theme }, '*'); }catch(e){} }); }catch(e){} }

import { kpis, transactions } from "/ui/shared/mock_data.js";
import { qs, qsa } from "/ui/shared/utils.js";
import { loadThemeConfig, saveThemeConfig, applyShellTheme, skinFor } from "/ui/shared/theme.manager.js";

// Cross-module navigation from iframes (e.g., Ship drawer -> PBJ)
window.addEventListener("message", (ev)=>{
  try{
    const msg = ev.data;
    if(!msg || msg.type !== "udl-nav") return;
    if(msg.openRecordId){
      try{ localStorage.setItem("udl_nav_open_record", msg.openRecordId); }catch{}
    }
    if(typeof msg.path === "string" && msg.path.startsWith("/")){
      location.hash = msg.path;
    }
  }catch(e){}
});

const state = {
  themeCfg: loadThemeConfig(),
  theme: document.documentElement.getAttribute("data-theme") || "dark",
  role: "Admin",
  modules: {},
};

applyShellTheme(state.themeCfg);

async function loadUiConfig(){
  try{
    const res = await fetch("/api/ui-config");
    const cfg = await res.json();
    state.modules = cfg.modules || {};
    // keep role label in sync with config default
    const defRole = cfg.roles?.default_role;
    if(defRole) setRole(defRole);
  }catch(e){
    console.warn("ui-config unavailable", e);
  }
}

function setRole(role){
  state.role = role;
  qs("#roleLabel").textContent = `Role: ${role}`;
}

function setTheme(next){
  state.theme = next;
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("udl_theme", next);

  try{ broadcastTheme(next); }catch(e){}
}

function route(){
  const hash = location.hash.replace("#", "") || "/analytics";
  const path = hash.startsWith("/") ? hash : "/analytics";
  setActive(path);
  render(path);
}

function setActive(path){
  qsa("#nav a").forEach(a=>{
    a.classList.toggle("active", a.dataset.route === path);
  });
  const label = ({
    "/analytics":"Analytics",
    "/settings":"Settings",
    "/udl":"UDL",
    "/pbj":"PBJ",
    "/ship":"Ship",
    "/winboard":"WinBoard",
    "/audit":"Audit Logs",
  })[path] || "Analytics";
  qs("#crumbs").innerHTML = `Home <span class="muted">›</span> <b>${label}</b>`;
  document.title = `UDL v2 • ${label}`;
}

function render(path){
  const host = qs("#content");
  if(path === "/analytics"){
    host.innerHTML = analyticsView();
    bindAnalytics();
    return;
  }
  if(path === "/settings"){
    host.innerHTML = settingsView();
    bindSettings();
    return;
  }
  if(path === "/audit"){
    host.innerHTML = auditView();
    bindAudit();
    return;
  }

  // module routes
  const key = path.replace("/","");
  const url = state.modules[key];
  host.innerHTML = moduleFrame(url || `/ui/modules/${key}/index.html?embed=1`, key);
}

function moduleFrame(src, key){
  const skin = skinFor(state.themeCfg, key);
  const join = src.includes("?") ? "&" : "?";
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  const withSkin = `${src}${join}skin=${encodeURIComponent(skin)}&theme=${encodeURIComponent(theme)}`;
  return `<iframe class="frame" src="${withSkin}" title="module"></iframe>`;
}

function analyticsView(){
  // 4 KPI cards + ring + bar box + transactions table
  const cards = kpis.map(k=>`
    <div class="card">
      <div class="hd">
        <div class="kpi">
          <div>
            <div class="label"><span class="tag">KPI</span> ${k.label}</div>
            <div class="value">${k.value} <span style="font-size:12px;color:var(--muted);font-weight:650;">USD</span></div>
          </div>
          <div style="display:grid; gap:8px; justify-items:end;">
            <div class="chip" style="color:${k.good?'var(--good)':'var(--bad)'}; border-color:${k.good?'rgba(61,220,151,.35)':'rgba(255,92,122,.35)'};">
              ${k.delta}
            </div>
            <div class="spark"></div>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  const rows = transactions.map(t=>`
    <tr>
      <td><span class="tag">${t.id}</span></td>
      <td style="color:var(--text)">${t.item}</td>
      <td style="color:var(--text)">${t.price}</td>
      <td>${t.customer}</td>
      <td>${t.date}</td>
      <td>${t.pay}</td>
      <td>${t.email}</td>
    </tr>
  `).join("");

  return `
    <div style="display:flex; align-items:end; justify-content:space-between; gap:12px; margin-bottom: 12px;">
      <div>
        <h1 class="page-title">Analytics</h1>
        <div class="subtle">UI-first baseline • mock data • LAN-ready</div>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn" id="rangeBtn">Range: 1M</button>
        <button class="btn primary" id="refreshBtn">Refresh</button>
      </div>
    </div>

    <div class="grid kpis">${cards}</div>

    <div class="grid main" style="margin-top:16px;">
      <div class="card">
        <div class="hd"><div style="font-weight:750;">Customers Activity</div><div class="chip">Paid • Checkout</div></div>
        <div class="bd">
          <div class="barbox">[ chart surface ]</div>
        </div>
      </div>
      <div class="card">
        <div class="hd"><div style="font-weight:750;">Product Activity</div><div class="chip">Total</div></div>
        <div class="bd">
          <div class="ring">
            <div style="text-align:center;">
              <div class="big">415,236</div>
              <div class="small">Total Activity</div>
              <div style="margin-top:12px; display:flex; gap:8px; justify-content:center;">
                <span class="chip">To Pack</span>
                <span class="chip">Delivery</span>
                <span class="chip">Returned</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <div class="hd">
        <div style="font-weight:750;">Recent Transactions</div>
        <div style="display:flex; gap:10px; align-items:center;">
          <input id="txSearch" type="text" placeholder="Search..." style="width: 240px;"/>
          <button class="btn">Customize</button>
          <button class="btn">Export</button>
        </div>
      </div>
      <div class="bd">
        <table class="table">
          <thead>
            <tr>
              <th>Order ID</th><th>Product</th><th>Price</th><th>Customer</th><th>Date</th><th>Payment</th><th>Email</th>
            </tr>
          </thead>
          <tbody id="txBody">${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function bindAnalytics(){
  qs("#refreshBtn")?.addEventListener("click", ()=> toast("info","Mock refresh (wire later)."));
  qs("#rangeBtn")?.addEventListener("click", ()=> toast("info","Range control stub."));
  qs("#txSearch")?.addEventListener("input", (e)=>{
    const q = e.target.value.toLowerCase();
    const body = qs("#txBody");
    const filtered = transactions.filter(t=> Object.values(t).join(" ").toLowerCase().includes(q));
    body.innerHTML = filtered.map(t=>`
      <tr>
        <td><span class="tag">${t.id}</span></td>
        <td style="color:var(--text)">${t.item}</td>
        <td style="color:var(--text)">${t.price}</td>
        <td>${t.customer}</td>
        <td>${t.date}</td>
        <td>${t.pay}</td>
        <td>${t.email}</td>
      </tr>
    `).join("");
  });
}

function settingsView(){
  return `
    <div style="display:flex; align-items:end; justify-content:space-between; gap:12px; margin-bottom: 12px;">
      <div>
        <h1 class="page-title">Settings</h1>
        <div class="subtle">Profile • Plans • Data Sources • Exports • Audit</div>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn" id="saveSettings">Save</button>
        <button class="btn primary" id="applySettings">Apply</button>
      </div>
    </div>

    <div class="grid main">
      <div class="card">
        <div class="hd"><div style="font-weight:750;">Account Settings</div><div class="chip">Team</div></div>
        <div class="bd" style="display:grid; gap:12px;">
          <div class="row">
            <div class="field"><label>First name</label><input id="fn" type="text" value="Michael"/></div>
            <div class="field"><label>Last name</label><input id="ln" type="text" value="Gregory"/></div>
          </div>
          <div class="field"><label>Welcome message</label><textarea id="wm" rows="3">Welcome to Unified Dashboard Lite v2.</textarea></div>
          <div class="row">
            <div class="field"><label>Role</label>
              <select id="roleSel">
                <option>Admin</option><option>Contributor</option><option>Reader</option><option>Demo</option>
              </select>
            </div>
            <div class="field"><label>Theme</label>
              <select id="themeSel">
                <option value="dark">Dark</option><option value="light">Light</option>
              </select>
            </div>
          </div>
          <div class="card" style="padding:12px; background: rgba(255,255,255,0.02);">
            <div style="font-weight:750; margin-bottom:6px;">Demo Mode</div>
            <div class="muted">Demo data is stored ephemerally and purged on logout.</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="hd"><div style="font-weight:750;">Quick Links</div></div>
        <div class="bd" style="display:grid; gap:10px;">
          <button class="btn" id="goData">Data Sources</button>
          <button class="btn" id="goExports">Exports</button>
          <button class="btn" id="goAudit">Audit Logs</button>
          <div class="card" style="padding:12px; background: rgba(0,0,0,0.16);">
            <div style="font-weight:750;">LAN Tip</div>
            <div class="muted">Open this UI from your phone using <span class="tag">http://&lt;laptop-ip&gt;:9110/ui/</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindSettings(){
  qs("#themeSel").value = state.theme;
  qs("#roleSel").value = state.role;

  qs("#themeSel")?.addEventListener("change", (e)=> setTheme(e.target.value));
  qs("#roleSel")?.addEventListener("change", (e)=> setRole(e.target.value));
  qs("#saveSettings")?.addEventListener("click", ()=> toast("ok","Settings saved (stub)."));
  qs("#applySettings")?.addEventListener("click", ()=> toast("ok","Settings applied (stub)."));

  qs("#goAudit")?.addEventListener("click", ()=> location.hash = "#/audit");
  qs("#goData")?.addEventListener("click", ()=> toast("info","Data Sources UI comes in Phase 3."));
  qs("#goExports")?.addEventListener("click", ()=> toast("info","Exports UI comes in Phase 3."));
}

function auditView(){
  return `
    <div style="display:flex; align-items:end; justify-content:space-between; gap:12px; margin-bottom: 12px;">
      <div>
        <h1 class="page-title">Audit Logs</h1>
        <div class="subtle">Append-only events (v2 baseline)</div>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn" id="writeAudit">Write test event</button>
        <button class="btn primary" id="reloadAudit">Reload</button>
      </div>
    </div>

    <div class="card">
      <div class="hd"><div style="font-weight:750;">Recent Events</div><div class="chip">/api/audit/event</div></div>
      <div class="bd">
        <div class="muted">This viewer is stubbed. In Phase 3 we’ll add a real GET endpoint and stream the trace.</div>
      </div>
    </div>
  `;
}

function bindAudit(){
  qs("#writeAudit")?.addEventListener("click", async ()=>{
    await fetch("/api/audit/event", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({event:"test", note:"hello"})});
    toast("ok","Wrote audit event.");
  });
  qs("#reloadAudit")?.addEventListener("click", ()=> toast("info","Reload stub."));
}

function toast(level, msg){
  // ultra-light toast
  const el = document.createElement("div");
  el.className = "chip";
  el.style.position = "fixed";
  el.style.right = "18px";
  el.style.bottom = "18px";
  el.style.zIndex = 9999;
  el.style.boxShadow = "var(--shadow)";
  el.style.borderColor = level==="ok" ? "rgba(61,220,151,.35)" : level==="warn" ? "rgba(255,204,102,.35)" : "rgba(110,168,255,.35)";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 2400);
}

// top-level bindings
qs("#themeBtn").addEventListener("click", ()=>{
  const next = state.theme === "dark" ? "light" : "dark";
  setTheme(next);
});

qs("#logoutBtn").addEventListener("click", ()=>{
  // "Demo purge" button for now: writes audit event and shows toast
  fetch("/api/audit/event", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({event:"demo_purge", role: state.role})})
    .catch(()=>{});
  toast("warn","Demo purge requested (wire real purge later).");
});

qs("#quickExportBtn").addEventListener("click", ()=> toast("info","Export stub (Phase 3)."));
qs("#inviteBtn").addEventListener("click", ()=> toast("info","Invite stub."));

// init
(function init(){
  const saved = localStorage.getItem("udl_theme");
  if(saved) setTheme(saved);
  loadUiConfig().finally(()=>{
    window.addEventListener("hashchange", route);
    route();
  });
})();


try{ const mo = new MutationObserver(()=>broadcastTheme(document.documentElement.getAttribute('data-theme')||'light')); mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); }catch(e){}
