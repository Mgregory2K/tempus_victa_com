/**
 * UDL Records v1 (UI-only, localStorage)
 * Shared record shape for WinBoard / Ship / PBJ / Projects.
 */
const KEY = "udl_records_v1";

function nowISO(){ return new Date().toISOString(); }
function uid(prefix="R"){
  return prefix + "-" + Math.random().toString(16).slice(2,8) + "-" + Math.random().toString(16).slice(2,8);
}
function readAll(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  }catch{ return []; }
}
function writeAll(records){
  localStorage.setItem(KEY, JSON.stringify(records));
}
function normalize(r){
  const t = nowISO();
  return {
    id: r.id || uid(r.type ? r.type.toUpperCase().slice(0,3) : "R"),
    type: r.type || "record",
    title: r.title || "Untitled",
    status: r.status || "open",
    priority: r.priority || "med",
    owner: r.owner || "Local Operator",
    tags: Array.isArray(r.tags) ? r.tags : [],
    createdAt: r.createdAt || t,
    updatedAt: t,
    fields: r.fields || {},
    evidence: Array.isArray(r.evidence) ? r.evidence : [],
  };
}

export const Records = {
  _mode: "local", // local | server
  use(mode){ Records._mode = (mode==="server"?"server":"local"); },
  mode(){ return Records._mode; },

  all(){ return readAll().sort((a,b)=> (b.updatedAt||"").localeCompare(a.updatedAt||"")); },
  byType(type){ return Records.all().filter(r=>r.type===type); },
  get(id){ return readAll().find(r=>r.id===id) || null; },
  upsert(record){
    const r = normalize(record);
    const all = readAll();
    const idx = all.findIndex(x=>x.id===r.id);
    if(idx>=0) all[idx] = { ...all[idx], ...r, updatedAt: nowISO() };
    else all.unshift(r);
    writeAll(all);
    return r;
  },
  remove(id){
    const all = readAll().filter(r=>r.id!==id);
    writeAll(all);
  },
  clear(){ localStorage.removeItem(KEY); }
  ,

  // -----------------------------
  // Server-backed (async)
  // -----------------------------
  async allAsync(params={}){
    if(Records._mode !== "server") return Records.all();
    const qs = new URLSearchParams();
    if(params.type) qs.set("type", params.type);
    if(params.workspaceId) qs.set("workspaceId", params.workspaceId);
    const res = await fetch(`/api/records${qs.toString()?`?${qs}`:""}`);
    if(!res.ok) throw new Error(`records list failed: ${res.status}`);
    return await res.json();
  },
  async getAsync(id){
    if(Records._mode !== "server") return Records.get(id);
    const res = await fetch(`/api/records/${encodeURIComponent(id)}`);
    if(res.status===404) return null;
    if(!res.ok) throw new Error(`record get failed: ${res.status}`);
    return await res.json();
  },
  async upsertAsync(record){
    const r = normalize(record);
    if(Records._mode !== "server") return Records.upsert(r);
    const res = await fetch(`/api/records`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(r)
    });
    if(!res.ok) throw new Error(`record upsert failed: ${res.status}`);
    return await res.json();
  },
  async removeAsync(id){
    if(Records._mode !== "server") return Records.remove(id);
    const res = await fetch(`/api/records/${encodeURIComponent(id)}`, { method:"DELETE" });
    if(res.status===404) return;
    if(!res.ok) throw new Error(`record delete failed: ${res.status}`);
  },

  // Try to auto-select server mode if /api/health is reachable.
  async initAuto({prefer="server"}={}){
    if(prefer!=="server") { Records.use("local"); return "local"; }
    try{
      const res = await fetch("/api/health", {cache:"no-store"});
      if(res.ok) { Records.use("server"); return "server"; }
    }catch{}
    Records.use("local");
    return "local";
  }
};
