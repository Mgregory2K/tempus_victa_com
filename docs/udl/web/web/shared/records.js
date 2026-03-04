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
};
