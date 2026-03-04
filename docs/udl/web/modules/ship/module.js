import { el, uid } from "/ui/shared/ui.js";
import { Records } from "/ui/shared/records.js";

const cfgKey = "ship_board_cfg_v1";
const ticketsKey = "ship_board_tickets_v1";

const defaultCfg = {
  columns: [
    { id:"todo", name:"TO DO" },
    { id:"doing", name:"IN PROGRESS" },
    { id:"done", name:"DONE" },
  ],
  statuses: [
    { id:"s_todo", name:"To Do", column:"todo" },
    { id:"s_inprog", name:"In Progress", column:"doing" },
    { id:"s_done", name:"Done", column:"done" },
  ],
};

const defaultTickets = [
  { id:"UDL-001", title:"Sidebar pin/hover polish", status:"s_inprog", owner:"Michael", sev:"P2", tags:["ui","shell"] },
  { id:"UDL-002", title:"Make boards feel Jira-ish", status:"s_todo", owner:"Michael", sev:"P1", tags:["ship","board"] },
  { id:"UDL-003", title:"Settings panel layout", status:"s_todo", owner:"Michael", sev:"P3", tags:["settings"] },
  { id:"UDL-004", title:"WinBoard tiles + streaks", status:"s_inprog", owner:"Michael", sev:"P2", tags:["winboard"] },
  { id:"UDL-005", title:"Fix small UI papercuts", status:"s_done", owner:"Michael", sev:"P3", tags:["cleanup"] },
];

function load(key, fallback){
  try{ const raw=localStorage.getItem(key); if(!raw) return fallback; const d=JSON.parse(raw); return d||fallback; }catch{ return fallback; }
}
function save(key, data){ localStorage.setItem(key, JSON.stringify(data)); }

function statusToColumn(cfg, statusId){
  const s = cfg.statuses.find(x=>x.id===statusId);
  return s?.column || "todo";
}
function statusName(cfg, statusId){
  return cfg.statuses.find(x=>x.id===statusId)?.name || "Unknown";
}

function render(){
  const cfg = load(cfgKey, defaultCfg);
  const tickets = load(ticketsKey, defaultTickets);

  const root = document.getElementById("root");
  root.innerHTML = "";

  const hdr = el("div",{class:"hdr"},[
    el("div",{},[
      el("h1",{class:"page-title", style:"margin:0;"},["Ship Board"]),
      el("div",{class:"subtle"},["Jira-like workflows • Columns + statuses • UI-only"])
    ]),
    el("div",{class:"row", style:"gap:10px; justify-content:flex-end;"},[
      el("button",{class:"btn", id:"newTicketBtn"},["New Issue"]),
      el("button",{class:"btn primary", id:"shipTodayBtn"},["Ship Today"])
    ])
  ]);

  const board = el("div",{class:"columns", id:"columns"});
  const side = el("div",{class:"card"},[
    el("div",{class:"hd"},[
      el("div",{class:"h3"},["Workflow Settings"]),
      el("span",{class:"chip"},["Admin"])
    ]),
    el("div",{class:"bd", className:"bd"},[
      el("div",{class:"pair"},[
        el("div",{class:"mini"},["This is the Jira-style “Columns and statuses” admin."]),
        el("div",{class:"card", style:"border-radius:14px; padding:12px; background: rgba(0,0,0,0.14);"},[
          el("div",{style:"font-weight:850; margin-bottom:8px;"},["Column constraints"]),
          el("select",{id:"colConstraint"},[
            el("option",{value:"none"},["None"]),
            el("option",{value:"wip3"},["Max 3 in progress (UI)"]),
            el("option",{value:"wip5"},["Max 5 in progress (UI)"]),
          ])
        ]),
      ]),
      el("div",{class:"card", style:"border-radius:14px; padding:12px; background: rgba(0,0,0,0.14);"},[
        el("div",{style:"font-weight:850; margin-bottom:10px;"},["Map statuses to columns"]),
        el("div",{class:"sideList", id:"statusMap"})
      ]),
      el("div",{class:"row", style:"gap:10px;"},[
        el("button",{class:"btn smallbtn", id:"addStatusBtn"},["Add status"]),
        el("button",{class:"btn smallbtn", id:"resetBtn"},["Reset UI"])
      ])
    ])
  ]);

  const wrap = el("div",{class:"boardWrap"},[
    el("div",{class:"card"},[
      el("div",{class:"hd"},[
        el("div",{class:"h3"},["Board"]),
        el("div",{class:"row", style:"gap:10px; flex:0;"},[
          el("input",{id:"q", type:"text", placeholder:"Search issues…", style:"width:240px;"}),
          el("button",{class:"btn"},["Views"])
        ])
      ]),
      el("div",{class:"bd"},[board])
    ]),
    side
  ]);

  root.appendChild(hdr);
  root.appendChild(wrap);

  // --- Record View Drawer (ServiceNow-ish) ---
  let drawerBackdrop = null;
  let drawer = null;
  let drawerInner = null;

  const drawerState = { open:false, ticket:null, record:null };

  function closeDrawer(){
    if(!drawer || !drawerBackdrop) return;
    drawer.classList.remove("open");
    drawerBackdrop.classList.remove("open");
    drawerState.open=false;
    drawerState.ticket=null;
    drawerState.record=null;
  }

  function ensureDrawer(){
    // already exists?
    const existingDrawer = document.getElementById("drawer");
    const existingBackdrop = document.getElementById("drawerBackdrop");
    if(existingDrawer && existingBackdrop){
      drawer = existingDrawer;
      drawerBackdrop = existingBackdrop;
      drawerInner = drawer.querySelector(".drawerInner");
      return;
    }
    drawerBackdrop = el("div",{class:"drawerBackdrop", id:"drawerBackdrop"});
    drawer = el("div",{class:"drawer", id:"drawer"});
    drawerInner = el("div",{class:"drawerInner"},[]);
    drawer.appendChild(drawerInner);
    root.appendChild(drawerBackdrop);
    root.appendChild(drawer);
    drawerBackdrop.addEventListener("click", closeDrawer);
  }

  // create immediately, but also safe for patch-order issues
  ensureDrawer();

  // Toasts (minimal, local UI feedback)
  function toast(msg, kind="ok"){
    const hostId = "toastHost";
    let host = document.getElementById(hostId);
    if(!host){
      host = el("div",{id:hostId, class:"toastHost"},[]);
      root.appendChild(host);
    }
    const t = el("div",{class:`toast ${kind}`},[msg]);
    host.appendChild(t);
    setTimeout(()=>{ t.classList.add("show"); }, 10);
    setTimeout(()=>{ t.classList.remove("show"); t.classList.add("hide"); }, 2200);
    setTimeout(()=>{ try{ t.remove(); }catch{} }, 2600);
  }



  async function loadRecordForTicket(t){
    try{
      await Records.initAuto({prefer:"local"});
      const r = await Records.getAsync(t.id);
      if(r) return r;
    }catch{ /* ignore */ }
    // fallback: synthesize
    const col = statusToColumn(cfg, t.status);
    const recordStatus = col==="done"?"done":(col==="doing"?"doing":"todo");
    return {
      id: t.id,
      type: "ship",
      title: t.title,
      status: recordStatus,
      priority: t.sev,
      owner: t.owner,
      tags: t.tags || [],
      workspaceId: "default",
      links: { parentId: t._parentId || undefined, relatedIds: [] },
      fields: { sev: t.sev, description: "" },
      evidence: { notes: "" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      audit: [],
    };
  }

  function renderDrawer(){
    ensureDrawer();
    const t = drawerState.ticket;
    const r = drawerState.record;
    if(!t || !r) return;

    const safe = (v)=> (v==null?"":String(v));
    const tagsStr = (r.tags||[]).join(", ");

    const tabBtn = (id,label)=> el("button",{class:"btn smallbtn ghost", "data-tab":id},[label]);
    const tabHost = el("div",{class:"drawerTabs"},[
      tabBtn("details","Details"),
      tabBtn("links","Links"),
      tabBtn("evidence","Evidence"),
      tabBtn("audit","Audit"),
    ]);

    const bodyHost = el("div",{class:"drawerBody", id:"drawerBody"});
    const footer = el("div",{class:"drawerFooter"},[
      el("div",{class:"mini"},[`${t._source==="records" ? "Synced" : "Local"} • ${safe(r.updatedAt).replace("T"," ").replace("Z","")}`]),
      el("div",{class:"row", style:"gap:10px; justify-content:flex-end;"},[
        el("button",{class:"btn", onClick:closeDrawer},["Close"]),
        el("button",{class:"btn primary", id:"drawerSaveBtn"},["Save"]),
      ])
    ]);

    drawerInner.innerHTML = "";
    drawerInner.appendChild(el("div",{class:"drawerHeader"},[
      el("div",{},[
        el("div",{class:"k"},[
          t.id,
          (r.links?.parentId ? `  •  PBJ:${r.links.parentId}` : "")
        ]),
        el("div",{class:"drawerTitle"},[safe(r.title) || "(untitled)"]),
        (r.links?.parentId ? el("span",{class:"chip pbjChip"},["Linked to PBJ"]) : el("span",{class:"chip"},["Ship"])),
        (drawerState.dirty ? el("span",{class:"chip dirtyChip"},["Unsaved"]) : el("span",{class:"chip okChip"},["Saved"])),
      ]),
      el("button",{class:"btn ghost smallbtn", title:"Close", onClick:closeDrawer},["✕"])
    ]));
    drawerInner.appendChild(tabHost);
    drawerInner.appendChild(bodyHost);
    drawerInner.appendChild(footer);

    function markDirtyField(elm){
      if(!elm) return;
      const orig = elm.dataset.orig ?? "";
      const cur = (elm.value ?? "").toString();
      const dirty = cur !== orig;
      elm.classList.toggle("dirtyField", dirty);
      // overall dirty if any field dirty
      const anyDirty = !!drawerInner.querySelector(".dirtyField");
      drawerState.dirty = anyDirty;
      // update chips + save button state
      const saveBtn = drawerInner.querySelector("#drawerSaveBtn");
      if(saveBtn){
        saveBtn.disabled = !anyDirty;
        saveBtn.classList.toggle("pulse", anyDirty);
      }
      const dirtyChip = drawerInner.querySelector(".dirtyChip");
      const okChip = drawerInner.querySelector(".okChip");
      if(dirtyChip && okChip){
        dirtyChip.style.display = anyDirty ? "" : "none";
        okChip.style.display = anyDirty ? "none" : "";
      }
    }

    function bindDirtyTracking(){
      drawerInner.querySelectorAll("input,select,textarea").forEach(inp=>{
        if(inp.dataset.bound==="1") return;
        inp.dataset.bound="1";
        if(inp.dataset.orig == null){
          inp.dataset.orig = (inp.value ?? "").toString();
        }
        inp.addEventListener("input", ()=>markDirtyField(inp));
        inp.addEventListener("change", ()=>markDirtyField(inp));
      });
      // initialize state
      drawerState.dirty = false;
      const saveBtn = drawerInner.querySelector("#drawerSaveBtn");
      if(saveBtn){
        saveBtn.disabled = true;
        saveBtn.classList.remove("pulse");
      }
      const dirtyChip = drawerInner.querySelector(".dirtyChip");
      const okChip = drawerInner.querySelector(".okChip");
      if(dirtyChip && okChip){
        dirtyChip.style.display = "none";
        okChip.style.display = "";
      }
    }


    function setActiveTab(id){
      tabHost.querySelectorAll("button").forEach(b=> b.classList.toggle("active", b.dataset.tab===id));
      bodyHost.innerHTML = "";
      if(id==="details"){
        const statusOptions = [
          {v:"todo", l:"To Do"},
          {v:"doing", l:"In Progress"},
          {v:"done", l:"Done"},
        ];
        bodyHost.appendChild(el("div",{class:"drawerGrid"},[
          el("div",{class:"drawerField"},[
            el("label",{},["Title"]),
            el("input",{id:"d_title", type:"text", value:safe(r.title)})
          ]),
          el("div",{class:"drawerField"},[
            el("label",{},["Owner"]),
            el("input",{id:"d_owner", type:"text", value:safe(r.owner)})
          ]),
          el("div",{class:"drawerField"},[
            el("label",{},["Severity / Priority"]),
            el("select",{id:"d_sev"},[
              ...["P1","P2","P3","P4"].map(p=> el("option",{value:p, selected:(safe(r.priority||r.fields?.sev)===p)},[p]))
            ])
          ]),
          el("div",{class:"drawerField"},[
            el("label",{},["Status"]),
            el("select",{id:"d_status"}, statusOptions.map(o=> el("option",{value:o.v, selected:(r.status===o.v)},[o.l])))
          ]),
          el("div",{class:"drawerField", style:"grid-column: 1 / -1;"},[
            el("label",{},["Tags (comma separated)"]),
            el("input",{id:"d_tags", type:"text", value:tagsStr, placeholder:"ui, shell, board"})
          ]),
          el("div",{class:"drawerField", style:"grid-column: 1 / -1;"},[
            el("label",{},["Description"]),
            el("textarea",{id:"d_desc", rows:"6", placeholder:"What is this issue really?", },[safe(r.fields?.description || "")])
          ]),
        ]));
        return;
      }
      if(id==="links"){
        const parent = r.links?.parentId ? String(r.links.parentId) : "";
        const related = (r.links?.relatedIds || []).join(", ");
        bodyHost.appendChild(el("div",{class:"drawerGrid"},[
          el("div",{class:"drawerField", style:"grid-column: 1 / -1;"},[
            el("label",{},["Parent PBJ Record Id"]),
            el("input",{id:"d_parent", type:"text", value:parent, placeholder:"(optional) PBJ-... or uuid"}),
          el("div",{class:"row", style:"gap:10px; grid-column: 1 / -1;"},[
            el("button",{class:"btn", disabled: !parent, onClick:()=>{
              const pid = (drawerInner.querySelector("#d_parent")?.value || "").trim();
              if(!pid) return;
              try{ localStorage.setItem("udl_nav_open_record", pid); }catch{}
              try{ window.parent?.postMessage({type:"udl-nav", path:"/pbj", openRecordId: pid}, "*"); }catch{}
            }},["Open Parent PBJ"]),
            el("button",{class:"btn primary", id:"createPBJBtn", onClick: async ()=>{
              try{
                const pidExisting = (drawerInner.querySelector("#d_parent")?.value || "").trim();
                if(pidExisting){
                  toast("PBJ already linked", "warn");
                  return;
                }
                // Build PBJ record from current Ship ticket/record
                const pbjId = uid("PBJ");
                const desc = (drawerInner.querySelector("#d_desc")?.value || (drawerState.record?.fields?.description || "") || "").trim();
                const sev = (drawerInner.querySelector("#d_sev")?.value || drawerState.record?.priority || drawerState.record?.fields?.sev || drawerState.ticket?.sev || "P3");
                const title = (drawerInner.querySelector("#d_title")?.value || drawerState.record?.title || drawerState.ticket?.title || "PBJ");
                const owner = (drawerInner.querySelector("#d_owner")?.value || drawerState.record?.owner || drawerState.ticket?.owner || "Michael");
                const tags = ((drawerInner.querySelector("#d_tags")?.value || "").split(",").map(x=>x.trim()).filter(Boolean));
                const now = new Date().toISOString();
                const pbjRecord = {
                  id: pbjId,
                  type: "pbj",
                  title: title,
                  status: "new",
                  priority: sev,
                  owner: owner,
                  tags: Array.from(new Set(["from-ship", ...tags])),
                  workspaceId: "default",
                  links: { parentId: drawerState.ticket?.id || drawerState.record?.id, relatedIds: [] },
                  fields: {
                    source: "ship",
                    shipId: drawerState.ticket?.id || drawerState.record?.id,
                    severity: sev,
                    description: desc,
                  },
                  evidence: { notes: "" },
                  audit: [{ at: now, msg: "Created from Ship drawer" }],
                  createdAt: now,
                  updatedAt: now,
                };
                await Records.initAuto({prefer:"local"});
                await Records.upsertAsync(pbjRecord);
                // Link Ship record -> PBJ
                const shipRec = await loadRecordForTicket(drawerState.ticket);
                shipRec.links = { ...(shipRec.links||{}), parentId: pbjId, relatedIds: (shipRec.links?.relatedIds||[]) };
                shipRec.updatedAt = new Date().toISOString();
                shipRec.audit = Array.isArray(shipRec.audit)? shipRec.audit : [];
                shipRec.audit.push({ at: shipRec.updatedAt, msg: `Linked to PBJ ${pbjId}` });
                await Records.upsertAsync(shipRec);
                // Mirror into ticket + UI
                drawerState.ticket._parentId = pbjId;
                drawerState.ticket._source = "records";
                try{ localStorage.setItem("udl_nav_open_record", pbjId); }catch{}
                try{ window.parent?.postMessage({type:"udl-nav", path:"/pbj", openRecordId: pbjId}, "*"); }catch{}
                toast("PBJ created", "ok");
              }catch(e){
                console.error(e);
                toast("PBJ create failed", "err");
              }
            }},["Create PBJ from Ship"]),
            el("div",{class:"mini"},[parent ? "Jump to PBJ module and focus this record." : "Enter a Parent PBJ id to enable jump."])
          ])
          ]),
          el("div",{class:"drawerField", style:"grid-column: 1 / -1;"},[
            el("label",{},["Related Record Ids (comma separated)"]),
            el("input",{id:"d_related", type:"text", value:related, placeholder:"SHIP-123, UDL-456"})
          ]),
          el("div",{class:"mini"},[
            "Tip: if you want “Open PBJ”, we’ll wire a jump-to-module next (postMessage → shell router)."
          ])
        ]));
        return;
      }
      if(id==="evidence"){
        bodyHost.appendChild(el("div",{class:"drawerGrid"},[
          el("div",{class:"drawerField", style:"grid-column: 1 / -1;"},[
            el("label",{},["Evidence / Notes"]),
            el("textarea",{id:"d_evidence", rows:"10", placeholder:"Links, screenshots, decisions, proof…"},[safe(r.evidence?.notes || "")])
          ]),
          el("div",{class:"mini"},[
            "Saved into the shared Record so other modules can consume it later."
          ])
        ]));
        return;
      }
      if(id==="audit"){
        const items = (r.audit || []).slice().reverse();
        bodyHost.appendChild(el("div",{class:"drawerAudit"},[
          el("div",{class:"mini"},["This is record-level activity (local-first). API audit logs are still written to /api/audit/event."]),
          ...(items.length? items.map(a=> el("div",{class:"auditRow"},[
            el("div",{class:"k"},[a.at]),
            el("div",{},[a.msg])
          ])) : [el("div",{class:"mini"},["No activity yet. Save the record to generate an entry."])])
        ]));
        return;
      }
    }

    tabHost.addEventListener("click",(e)=>{
      const b = e.target?.closest("button");
      if(!b) return;
      setActiveTab(b.dataset.tab);
      bindDirtyTracking();
    });

    setActiveTab("details");

    bindDirtyTracking();

    async function persist(){
      // pull values from whichever tab is active (all inputs are in DOM if visited; handle missing by keep old)
      const q = (id)=> drawerInner.querySelector(id);
      const title = q("#d_title")?.value ?? r.title;
      const owner = q("#d_owner")?.value ?? r.owner;
      const sev = q("#d_sev")?.value ?? (r.priority || r.fields?.sev || "P3");
      const status = q("#d_status")?.value ?? r.status;
      const tags = (q("#d_tags")?.value ?? (r.tags||[]).join(",")).split(",").map(x=>x.trim()).filter(Boolean);
      const desc = q("#d_desc")?.value ?? (r.fields?.description || "");
      const parentId = (q("#d_parent")?.value ?? (r.links?.parentId || "")).trim();
      const relatedIds = (q("#d_related")?.value ?? (r.links?.relatedIds||[]).join(",")).split(",").map(x=>x.trim()).filter(Boolean);
      const evidence = q("#d_evidence")?.value ?? (r.evidence?.notes || "");

      // update record object
      r.title = title;
      r.owner = owner;
      r.priority = sev;
      r.status = status;
      r.tags = tags;
      r.fields = {...(r.fields||{}), sev, description: desc};
      r.links = { ...(r.links||{}), parentId: parentId||undefined, relatedIds };
      r.evidence = { ...(r.evidence||{}), notes: evidence };
      r.updatedAt = new Date().toISOString();
      r.audit = Array.isArray(r.audit) ? r.audit : [];
      r.audit.push({ at: new Date().toISOString(), msg: "Saved from Ship record drawer" });

      // mirror to ticket
      t.title = title;
      t.owner = owner;
      t.sev = sev;
      t.tags = tags;
      t._parentId = parentId || null;
      // map record status → board status id
      const statusId = status==="done" ? "s_done" : (status==="doing" ? "s_inprog" : "s_todo");
      t.status = statusId;

      save(ticketsKey, tickets);
      await draw();

      // persist via Records (promotes local ticket into shared record)
      try{
        await Records.initAuto({prefer:"local"});
        await Records.upsertAsync(r);
        t._source = "records";
        // API audit event (existing server log)
        fetch("/api/audit/event", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({action:"record.upsert", recordId:r.id, recordType:r.type, workspaceId:r.workspaceId})
        }).catch(()=>{});
      }catch{ /* ignore */ }

      // reset dirty markers to new baseline
      try{
        drawerInner.querySelectorAll("input,select,textarea").forEach(inp=>{
          inp.dataset.orig = (inp.value ?? "").toString();
          inp.classList.remove("dirtyField");
        });
        drawerState.dirty = false;
        const saveBtn = drawerInner.querySelector("#drawerSaveBtn");
        if(saveBtn){ saveBtn.disabled = true; saveBtn.classList.remove("pulse"); }
      }catch{}
      toast("Saved", "ok");
      renderDrawer(); // refresh drawer
    }

    drawerInner.querySelector("#drawerSaveBtn")?.addEventListener("click", ()=>{ persist(); });
  }

  async function openDrawerFor(t){
    ensureDrawer();
    // Open immediately so UI responds even if record load takes time.
    drawer?.classList.add("open");
    drawerBackdrop?.classList.add("open");
    drawerState.open = true;

    drawerState.ticket = t;
    drawerState.record = null;
    // lightweight loading view
    try{
      if(drawerInner){
        drawerInner.innerHTML = `
          <div class="drawerHeader">
            <div>
              <div class="k">${t.id}</div>
              <div class="drawerTitle">${t.title || "(untitled)"}</div>
            </div>
            <button class="btn ghost smallbtn" id="drawerCloseBtn" title="Close">✕</button>
          </div>
          <div class="drawerBody">
            <div class="mini">Loading record…</div>
          </div>
        `;
        drawerInner.querySelector("#drawerCloseBtn")?.addEventListener("click", closeDrawer);
      }
    }catch{}

    // Now load record and render full drawer
    try{
      drawerState.record = await loadRecordForTicket(t);
    }catch(e){
      drawerState.record = {
        id: t.id, type:"ship", title:t.title || "(untitled)", status:"todo",
        workspaceId:"default", owner:t.owner || "Michael", priority:t.sev || "P3",
        tags: t.tags || [], links:{ parentId: t._parentId || undefined, relatedIds: [] },
        fields:{ sev:t.sev || "P3", description:"" }, evidence:{ notes:"" }, audit:[]
      };
    }
    renderDrawer();
  }


  async function syncFromRecords(){
    try{
      await Records.initAuto({prefer:"local"});
      const recs = await Records.allAsync({type:"ship", workspaceId:"default"});
      // merge into local tickets list (non-destructive)
      recs.forEach(r=>{
        if(tickets.find(t=>t.id===r.id)) return;
        const st = (r.status||"todo");
        const statusId = st==="done"?"s_done":(st==="doing"?"s_inprog":"s_todo");
        tickets.unshift({
          id: r.id,
          title: r.title || "(untitled)",
          status: statusId,
          owner: r.owner || "Michael",
          sev: r.fields?.sev || r.priority || "P3",
          tags: r.tags || [],
          _source: "records",
          _parentId: r.links?.parentId || null
        });
      });
      save(ticketsKey, tickets);
    }catch{ /* ignore */ }
  }

  async function draw(){
    board.innerHTML = "";
    const q = (document.getElementById("q")?.value || "").toLowerCase();

    cfg.columns.forEach(col=>{
      const colTickets = tickets.filter(t=> statusToColumn(cfg, t.status)===col.id)
        .filter(t=> (t.id+" "+t.title+" "+t.owner+" "+(t.tags||[]).join(" ")).toLowerCase().includes(q));

      const colEl = el("div",{class:"card", style:"padding:12px;"},[
        el("div",{class:"colHead"},[
          el("div",{class:"colTitle"},[
            el("span",{class:"tag"},[col.name]),
            el("span",{class:"colCount"},[`${colTickets.length} issues`]),
          ]),
          el("button",{class:"btn ghost smallbtn", title:"Add quick issue", onClick:()=>quickIssue(col.id)},["+"])
        ]),
        el("div",{class:"col", id:`col_${col.id}`}, colTickets.map(t=>ticketEl(t)))
      ]);
      board.appendChild(colEl);
    });

    // status map
    const mapHost = document.getElementById("statusMap");
    mapHost.innerHTML = "";
    cfg.statuses.forEach(s=>{
      mapHost.appendChild(el("div",{class:"sideRow"},[
        el("div",{},[
          el("div",{style:"font-weight:800;"},[s.name]),
          el("div",{class:"mini"},[`→ ${cfg.columns.find(c=>c.id===s.column)?.name || s.column}`]),
        ]),
        el("select",{value:s.column, onChange:(e)=>{ s.column=e.target.value; save(cfgKey,cfg); draw(); }}, 
          cfg.columns.map(c=> el("option",{value:c.id},[c.name]))
        )
      ]));
    });
  }

  function ticketEl(t){
    return el("div",{class:"ticket"},[
      el("div",{class:"k"},[t.id]),
      el("div",{class:"t"},[t.title]),
      el("div",{class:"meta"},[
        el("span",{class:"tag"},[statusName(cfg, t.status)]),
        el("span",{class:"tag"},[t.sev]),
        el("span",{class:"tag"},[t.owner]),
        ...(t.tags||[]).slice(0,2).map(x=> el("span",{class:"tag"},[x]))
      ]),
      el("div",{class:"row", style:"gap:8px; margin-top:6px;"},[
        el("button",{class:"btn smallbtn", onClick:()=>move(t,-1)},["←"]),
        el("button",{class:"btn smallbtn", onClick:()=>move(t, +1)},["→"]),
        el("button",{class:"btn primary smallbtn", onClick:()=>open(t)},["Open"]),
      ])
    ]);
  }

  async function move(t, dir){
    const colId = statusToColumn(cfg, t.status);
    const colIdx = cfg.columns.findIndex(c=>c.id===colId);
    const next = cfg.columns[Math.max(0, Math.min(cfg.columns.length-1, colIdx+dir))]?.id;
    const nextStatus = cfg.statuses.find(s=>s.column===next)?.id || t.status;
    t.status = nextStatus;
    save(ticketsKey, tickets);
    // if this ticket originated from shared Records, mirror status back
    if(t._source==="records"){
      const rs = statusToColumn(cfg, t.status);
      const recordStatus = rs==="done"?"done":(rs==="doing"?"doing":"todo");
      Records.initAuto({prefer:"local"})
        .then(()=>Records.upsertAsync({id:t.id, type:"ship", title:t.title, status: recordStatus, owner:t.owner, priority:t.sev, tags:t.tags, workspaceId:"default", links:{ parentId: t._parentId || undefined }, fields:{sev:t.sev} }))
        .then(()=>fetch("/api/audit/event", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action:"record.upsert", recordId:t.id, recordType:"ship", workspaceId:"default"})}))
        .catch(()=>{});
    }
    draw();
  }

  function quickIssue(colId){
    const status = cfg.statuses.find(s=>s.column===colId)?.id || cfg.statuses[0].id;
    tickets.unshift({ id:`UDL-${Math.floor(100+Math.random()*900)}`, title:"New issue (UI)", status, owner:"Michael", sev:"P3", tags:["new"] });
    save(ticketsKey, tickets);
    draw();
  }

  function open(t){
    openDrawerFor(t);
  }

  document.getElementById("q").addEventListener("input", draw);
  document.getElementById("newTicketBtn").addEventListener("click", ()=> quickIssue("todo"));
  document.getElementById("resetBtn").addEventListener("click", ()=>{
    localStorage.removeItem(cfgKey);
    localStorage.removeItem(ticketsKey);
    render();
  });
  document.getElementById("addStatusBtn").addEventListener("click", ()=>{
    const name = prompt("New status name?");
    if(!name) return;
    cfg.statuses.push({ id: uid("s"), name, column: cfg.columns[0].id });
    save(cfgKey, cfg);
    draw();
  });

  // Open record requested by shell navigation (e.g., PBJ -> Ship)
  async function openFromNav(){
    let id = "";
    try{ id = localStorage.getItem("udl_nav_open_record") || ""; }catch{}
    if(!id) return;
    // try open immediately
    let t = tickets.find(x=>x.id===id);
    if(!t){
      try{
        await syncFromRecords();
        await draw();
        t = tickets.find(x=>x.id===id);
      }catch{}
    }
    if(t){
      openDrawerFor(t);
    }
    try{ localStorage.removeItem("udl_nav_open_record"); }catch{}
  }

  syncFromRecords().then(draw).then(openFromNav);
}
render();
