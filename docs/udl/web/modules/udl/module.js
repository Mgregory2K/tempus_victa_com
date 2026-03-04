import { el } from "/ui/shared/ui.js";
import { Records } from "/ui/shared/records.js";

function todayISO(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const da = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}
function addDays(iso, days){
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate()+days);
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), da=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}
function makeId(prefix){
  return `${prefix}-${Math.random().toString(16).slice(2,8)}-${Date.now().toString(16)}`;
}
function parseTags(s){
  return (s||"").split(",").map(x=>x.trim()).filter(Boolean);
}

const ASSIGNEES = [
  "Dylan Gregory",
  "Fiona Hines",
  "Jen Hines",
  "Kingston Hines",
  "Liam Gregory",
  "Michael Gregory",
].slice().sort((a,b)=>a.localeCompare(b));

function escapeHtml(s){
  return String(s??"").replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

function parseLinksText(s){
  // Optional advanced: one link per line: type:id[:role]
  // Example: project:P-abc123:parent
  const lines = (s||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const links = [];
  for(const line of lines){
    const parts = line.split(":").map(x=>x.trim()).filter(Boolean);
    if(parts.length < 2) continue;
    const [type,id,role] = parts;
    links.push(role ? { type, id, role } : { type, id });
  }
  return links;
}

function linksToText(links){
  if(!Array.isArray(links) || !links.length) return "";
  return links.map(l=>`${l.type}:${l.id}${l.role?":"+l.role:""}`).join("\n");
}

async function openModal({ title, fields, onSave }){
  return new Promise((resolve)=>{
    const backdrop = document.createElement("div");
    backdrop.className = "udl-modal-backdrop";
    const panel = document.createElement("div");
    panel.className = "udl-modal";
    panel.innerHTML = `
      <div class="udl-modal-hd">
        <div class="udl-modal-title">${escapeHtml(title||"Edit")}</div>
        <button class="btn smallbtn" data-x="1">Close</button>
      </div>
      <form class="udl-modal-bd">
        ${fields.map(f=>{
          const id = `f_${Math.random().toString(16).slice(2,8)}`;
          f._id = id;
          const label = `<label class="mini" for="${id}">${escapeHtml(f.label||f.name)}</label>`;
          const common = `id="${id}" name="${escapeHtml(f.name)}"`;
          if(f.type==="select"){
            const opts = (f.options||[]).map(o=>`<option value="${escapeHtml(o.value)}"${String(o.value)===String(f.value??"")?" selected":""}>${escapeHtml(o.label)}</option>`).join("");
            return `<div class="udl-field">${label}<select ${common} class="udl-input">${opts}</select></div>`;
          }
          if(f.type==="textarea"){
            return `<div class="udl-field">${label}<textarea ${common} class="udl-input" rows="${f.rows||4}" placeholder="${escapeHtml(f.placeholder||"")}">${escapeHtml(f.value??"")}</textarea></div>`;
          }
          if(f.type==="checkbox"){
            return `<div class="udl-field"><label class="mini" style="display:flex; gap:8px; align-items:center;">
              <input type="checkbox" ${common} ${f.value ? "checked":""}/> ${escapeHtml(f.label||f.name)}
            </label></div>`;
          }
          const t = f.type || "text";
          return `<div class="udl-field">${label}<input type="${t}" ${common} class="udl-input" value="${escapeHtml(f.value??"")}" placeholder="${escapeHtml(f.placeholder||"")}"/></div>`;
        }).join("")}
        <div class="udl-modal-ft">
          <button type="button" class="btn" data-cancel="1">Cancel</button>
          <button type="submit" class="btn primary">Save</button>
        </div>
      </form>
    `;
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    const close = (val)=>{ backdrop.remove(); resolve(val); };

    backdrop.addEventListener("click", (e)=>{ if(e.target===backdrop) close(null); });
    panel.querySelector('[data-x="1"]').addEventListener("click", ()=>close(null));
    panel.querySelector('[data-cancel="1"]').addEventListener("click", ()=>close(null));

    panel.querySelector("form").addEventListener("submit", async (e)=>{
      e.preventDefault();
      const out = {};
      for(const f of fields){
        const el = panel.querySelector(`#${CSS.escape(f._id)}`);
        if(!el) continue;
        if(f.type==="checkbox") out[f.name] = !!el.checked;
        else out[f.name] = (el.value ?? "").toString();
      }
      try{
        const saved = await onSave(out);
        close(saved ?? true);
      }catch(err){
        console.error(err);
        alert("Save failed. See console for details.");
      }
    });

    // focus first input
    const first = panel.querySelector("input,select,textarea");
    if(first) first.focus();
  });
}

function projectOptions(projects){
  const opts = [{ value:"", label:"— Unassigned —" }];
  const sorted = [...projects].filter(p=>!isHidden(p)).sort((a,b)=>(a.title||"").localeCompare(b.title||""));
  for(const p of sorted){
    opts.push({ value: p.id, label: p.title || p.id });
  }
  return opts;
}

async function openProjectEditor(p){
  const isNew = !p;
  const rec = p || { id: makeId("P"), type:"project", title:"", status:"open", tags:[], ownerId:"local", fields:{ key:"", hidden:false, links:[] } };
  return openModal({
    title: isNew ? "New Project" : "Edit Project",
    fields: [
      { name:"title", label:"Project name", type:"text", value: rec.title||"" },
      { name:"key", label:"Project key (optional)", type:"text", value: rec.fields?.key||"" , placeholder:"e.g., NET-123" },
      { name:"status", label:"Status", type:"select", value: (rec.status||"open"), options:[
        { value:"open", label:"Open" },
        { value:"closed", label:"Closed" },
      ]},
      { name:"hidden", label:"Hidden (remove from view)", type:"checkbox", value: !!rec.fields?.hidden },
      { name:"tags", label:"Tags (comma)", type:"text", value: (rec.tags||[]).join(", ") , placeholder:"e.g., daily, ops" },
      { name:"links", label:"Links (optional, one per line: type:id[:role])", type:"textarea", rows:4, value: linksToText(rec.fields?.links||[]) , placeholder:"project:P-xxxx:parent\nwin:W-xxxx:related" },
    ],
    onSave: async (vals)=>{
      const updated = {
        ...rec,
        title: (vals.title||"").trim() || rec.title,
        status: vals.status || rec.status || "open",
        tags: parseTags(vals.tags||""),
        ownerId: rec.ownerId || "local",
        fields: {
          ...(rec.fields||{}),
          key: (vals.key||"").trim(),
          hidden: !!vals.hidden,
          links: parseLinksText(vals.links||""),
        }
      };
      const saved = await Records.upsertAsync(updated);
      return saved;
    }
  });
}

async function openTaskEditor(t, projects, defaultDueDate){
  const isNew = !t;
  const rec = t || {
    id: makeId("T"),
    type:"task",
    title:"",
    status:"todo",
    tags:[],
    ownerId:"local",
    fields:{
      projectId:null,
      assignee:null,
      dueDate: defaultDueDate || todayISO(),
      rolledFromDate:null,
      hidden:false,
      order: Date.now(),
      notes:"",
      links:[]
    }
  };
  const projOpts = projectOptions(projects);
  const assigneeOpts = [{ value:"", label:"— Unassigned —" }].concat(ASSIGNEES.map(n=>({ value:n, label:n })));
  const statusOpts = [
    { value:"todo", label:"To Do" },
    { value:"doing", label:"In Progress" },
    { value:"blocked", label:"Blocked" },
    { value:"done", label:"Done" },
  ];
  return openModal({
    title: isNew ? "New Task" : "Edit Task",
    fields: [
      { name:"title", label:"Task title", type:"text", value: rec.title||"" },
      { name:"projectId", label:"Project", type:"select", value: rec.fields?.projectId || "", options: projOpts },
      { name:"assignee", label:"Assignee", type:"select", value: rec.fields?.assignee || "", options: assigneeOpts },
      { name:"status", label:"Status", type:"select", value: taskStatus(rec), options: statusOpts },
      { name:"dueDate", label:"Due date", type:"date", value: rec.fields?.dueDate || (defaultDueDate||todayISO()) },
      { name:"hidden", label:"Hidden (remove from view)", type:"checkbox", value: !!rec.fields?.hidden },
      { name:"tags", label:"Tags (comma)", type:"text", value: (rec.tags||[]).join(", ") },
      { name:"notes", label:"Notes", type:"textarea", rows:5, value: rec.fields?.notes || "" },
      { name:"links", label:"Links (optional, one per line: type:id[:role])", type:"textarea", rows:4, value: linksToText(rec.fields?.links||[]) },
    ],
    onSave: async (vals)=>{
      const status = (vals.status||"todo").toLowerCase();
      const updated = {
        ...rec,
        title: (vals.title||"").trim() || rec.title,
        status,
        tags: parseTags(vals.tags||""),
        ownerId: rec.ownerId || "local",
        fields: {
          ...(rec.fields||{}),
          projectId: (vals.projectId||"") ? vals.projectId : null,
          assignee: (vals.assignee||"") ? vals.assignee : null,
          dueDate: (vals.dueDate||"") || rec.fields?.dueDate || (defaultDueDate||todayISO()),
          hidden: !!vals.hidden,
          notes: vals.notes||"",
          links: parseLinksText(vals.links||""),
        }
      };
      const saved = await Records.upsertAsync(updated);
      return saved;
    }
  });
}

function pill(tone, label){
  const cls = tone==="good"?"pill good":tone==="warn"?"pill warn":tone==="bad"?"pill bad":"pill";
  return `<span class="${cls}"><span class="dot"></span>${label}</span>`;
}

async function loadAll(){
  await Records.initAuto({ prefer: "server" }); // API when available, localStorage fallback
  const all = await Records.allAsync();
  const projects = all.filter(r=>r.type==="project");
  const tasks = all.filter(r=>r.type==="task");
  const subtasks = all.filter(r=>r.type==="subtask");
  return { projects, tasks, subtasks };
}

function projectKey(p){
  return p?.fields?.key || p?.id || "";
}
function taskDue(t){
  return t?.fields?.dueDate || "";
}
function isHidden(r){
  return !!(r?.fields?.hidden);
}
function isClosedProject(p){
  return (p?.status||"").toLowerCase()==="closed";
}
function isDoneTask(t){
  const s = (t?.status||"").toLowerCase();
  return s==="done" || s==="canceled";
}

function taskStatus(t){
  const s = (t?.status||"todo").toLowerCase();
  if(s==="doing") return "doing";
  if(s==="blocked") return "blocked";
  if(s==="done" || s==="canceled") return "done";
  return "todo";
}

async function render(){
  const root = document.getElementById("root");
  root.innerHTML = "";

  let selectedDate = todayISO();
  let showClosed = false;
  let showHidden = false;

  let cache = await loadAll();

  const hdr = el("div",{class:"hdr"},[
    el("div",{},[
      el("h1",{class:"page-title", style:"margin:0;"},["Daily Planner"]),
      el("div",{class:"subtle"},["Projects + tasks + rollover • local-first persistence"])
    ]),
    el("div",{class:"row", style:"gap:10px; justify-content:flex-end; align-items:center;"},[
      el("input",{id:"day", type:"date", value:selectedDate, class:"btn", style:"padding:8px 10px;"}),
      el("button",{class:"btn", id:"newProjectBtn"},["New Project"]),
      el("button",{class:"btn", id:"newTaskBtn"},["New Task"]),
      el("button",{class:"btn primary", id:"closeDayBtn"},["Close Day (Rollover)"])
    ])
  ]);

  const kpis = el("div",{class:"tiles", id:"kpis"});

  const left = el("div",{class:"card"},[
    el("div",{class:"hd"},[
      el("div",{class:"h3"},["Today Board"]),
      el("div",{class:"row", style:"gap:10px; flex:0; align-items:center;"},[
        el("input",{id:"q", type:"text", placeholder:"Search tasks…", style:"width:260px;"}),
        el("label",{class:"mini", style:"display:flex; gap:6px; align-items:center;"},[
          el("input",{id:"showClosed", type:"checkbox"}), "Show closed"
        ]),
        el("label",{class:"mini", style:"display:flex; gap:6px; align-items:center;"},[
          el("input",{id:"showHidden", type:"checkbox"}), "Show hidden"
        ]),
      ])
    ]),
    el("div",{class:"bd", id:"board"})
  ]);

  const right = el("div",{class:"card"},[
    el("div",{class:"hd"},[
      el("div",{class:"h3"},["Projects"]),
      el("span",{class:"chip"},[Records.mode()==="server"?"API":"Local"])
    ]),
    el("div",{class:"bd", id:"projList"})
  ]);

  root.appendChild(hdr);
  // Local module styles (kept small; matches shared tokens)
  root.appendChild(el("style",{html:`
    .kanban{ display:grid; grid-template-columns: repeat(4, minmax(180px, 1fr)); gap:12px; align-items:start; }
    .kcol{ background: rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.10); border-radius:14px; overflow:hidden; }
    .khead{ padding:10px 12px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.10); }
    .khead .ttl{ font-weight:850; font-size:12px; letter-spacing:0.02em; text-transform:uppercase; opacity:0.9; }
    .klist{ padding:10px; min-height:140px; display:grid; gap:10px; }
    .klist.dragover{ outline:2px dashed rgba(120,160,255,0.65); outline-offset:2px; border-radius:14px; }
    .tcard{ border:1px solid rgba(255,255,255,0.10); border-radius:14px; padding:10px; background: rgba(0,0,0,0.15); cursor:grab; }
    .tcard:active{ cursor:grabbing; }
    .tcard .t{ font-weight:800; }
    .tcard .meta{ margin-top:6px; display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .tcard .proj{ font-size:11px; opacity:0.85; padding:3px 8px; border-radius:999px; border:1px solid rgba(255,255,255,0.12); }
    .tcard .miniBtn{ font-size:11px; padding:4px 8px; border-radius:10px; }
  
    .udl-modal-backdrop{ position:fixed; inset:0; background: rgba(8,16,30,0.58); display:flex; align-items:center; justify-content:center; z-index:9999; padding:16px; }
    .udl-modal{ width:min(860px, 96vw); max-height: 92vh; overflow:auto;
      background: linear-gradient(180deg, rgba(10,33,64,0.98) 0%, rgba(9,24,46,0.98) 100%);
      border:1px solid rgba(140,190,255,0.22);
      border-radius:18px;
      box-shadow: 0 18px 60px rgba(0,0,0,0.55);
      color: rgba(255,255,255,0.92);
    }
    .udl-modal-hd{ padding:12px 14px; display:flex; justify-content:space-between; align-items:center; gap:12px;
      border-bottom:1px solid rgba(140,190,255,0.18);
      position:sticky; top:0;
      background: rgba(10,33,64,0.98);
    }
    .udl-modal-title{ font-size:16px; font-weight:900; letter-spacing:0.02em; }
    .udl-modal-bd{ padding:14px; display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    .udl-field{ display:flex; flex-direction:column; gap:6px; }
    .udl-input{ width:100%; padding:10px 10px; border-radius:12px; border:1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: inherit; outline:none; }
    .udl-input:focus{ border-color: rgba(120,160,255,0.75); box-shadow: 0 0 0 3px rgba(120,160,255,0.18); }
    .udl-modal-bd textarea.udl-input{ grid-column: 1 / -1; }
    .udl-modal-ft{ grid-column: 1 / -1; display:flex; justify-content:flex-end; gap:10px; padding-top:4px; }
    @media (max-width: 720px){
      .udl-modal-bd{ grid-template-columns: 1fr; }
    }
  `}));
  root.appendChild(kpis);
  root.appendChild(el("div",{class:"projectGrid"},[left,right]));

  function filteredProjects(){
    return cache.projects
      .filter(p=> showHidden ? true : !isHidden(p))
      .filter(p=> showClosed ? true : !isClosedProject(p))
      .sort((a,b)=> (b.updatedAt||"").localeCompare(a.updatedAt||""));
  }

  function tasksForDay(){
    const q = (document.getElementById("q")?.value||"").toLowerCase();
    return cache.tasks
      .filter(t=> taskDue(t)===selectedDate)
      .filter(t=> showHidden ? true : !isHidden(t))
      .filter(t=>{
        if(showClosed) return true;
        const pid = t.fields?.projectId;
        if(!pid) return true;
        const p = cache.projects.find(x=>x.id===pid);
        return p ? !isClosedProject(p) : true;
      })
      .filter(t=>{
        const blob = (t.title+" "+(t.fields?.notes||"")+" "+(t.tags||[]).join(" ")).toLowerCase();
        return blob.includes(q);
      })
      .sort((a,b)=> (a.fields?.order ?? 9999) - (b.fields?.order ?? 9999) || (b.updatedAt||"").localeCompare(a.updatedAt||""));
  }

  function subtasksFor(taskId){
    return cache.subtasks
      .filter(st=>st.fields?.taskId===taskId)
      .sort((a,b)=> (a.fields?.order ?? 9999) - (b.fields?.order ?? 9999));
  }

  function drawKPIs(){
    const dayTasks = tasksForDay();
    const done = dayTasks.filter(isDoneTask).length;
    const open = dayTasks.length - done;
    const rolled = dayTasks.filter(t=>t.fields?.rolledFromDate).length;
    kpis.innerHTML = "";
    kpis.appendChild(el("div",{class:"card pulse"},[
      el("div",{class:"hd"},[el("div",{class:"mini"},["Tasks Today"]), el("span",{class:"chip"},["INFO"])]),
      el("div",{class:"bd"},[el("div",{style:"font-size:26px;font-weight:900;"},[String(dayTasks.length)]), el("div",{class:"mini"},[selectedDate])])
    ]));
    kpis.appendChild(el("div",{class:"card pulse"},[
      el("div",{class:"hd"},[el("div",{class:"mini"},["Open"]), el("span",{class:`chip ${open? "warn":"good"}`},[open? "ACTIVE":"CLEAR"])]),
      el("div",{class:"bd"},[el("div",{style:"font-size:26px;font-weight:900;"},[String(open)]), el("div",{class:"mini"},["not done / not canceled"])])
    ]));
    kpis.appendChild(el("div",{class:"card pulse"},[
      el("div",{class:"hd"},[el("div",{class:"mini"},["Done"]), el("span",{class:`chip ${done? "good":"warn"}`},[done? "DONE":"NONE"])]),
      el("div",{class:"bd"},[el("div",{style:"font-size:26px;font-weight:900;"},[String(done)]), el("div",{class:"mini"},["completed today"])])
    ]));
    kpis.appendChild(el("div",{class:"card pulse"},[
      el("div",{class:"hd"},[el("div",{class:"mini"},["Rolled"]), el("span",{class:`chip ${rolled? "warn":"good"}`},[rolled? "ROLLED":"0"])]),
      el("div",{class:"bd"},[el("div",{style:"font-size:26px;font-weight:900;"},[String(rolled)]), el("div",{class:"mini"},["from prior days"])])
    ]));
  }

  function drawProjects(){
    const box = document.getElementById("projList");
    const list = filteredProjects();
    box.innerHTML = "";

    if(list.length===0){
      box.appendChild(el("div",{class:"mini"},["No projects yet. Create one."]));
      return;
    }

    list.forEach(p=>{
      const key = projectKey(p);
      const status = isClosedProject(p) ? "Closed" : "Open";
      const row = el("div",{class:"card", style:"border-radius:14px; padding:12px;"},[
        el("div",{class:"split"},[
          el("div",{},[
            el("div",{style:"font-weight:850;"},[p.title]),
            el("div",{class:"mini"},[
              el("span",{class:"tag", style:"margin-right:6px;"},[key]),
              el("span",{class:"tag", style:"margin-right:6px;"},[status]),
              isHidden(p) ? el("span",{class:"tag"},["Hidden"]) : null
            ])
          ]),
          el("div",{class:"row", style:"gap:8px; justify-content:flex-end;"},[
            el("button",{class:"btn smallbtn", onClick: async ()=>{
              const saved = await openProjectEditor(p);
              if(!saved) return;
              cache.projects = cache.projects.map(x=>x.id===saved.id?saved:x);
              drawAll();
            }},["Edit"]),
            el("button",{class:"btn smallbtn", onClick: async ()=>{
              const hidden = !isHidden(p);
              const updated = await Records.upsertAsync({ ...p, ownerId:"local", fields: { ...(p.fields||{}), hidden } });
              cache.projects = cache.projects.map(x=>x.id===updated.id?updated:x);
              drawAll();
            }},[isHidden(p) ? "Unhide":"Hide"]),
            el("button",{class:"btn smallbtn", onClick: async ()=>{
              const closed = !isClosedProject(p);
              const updated = await Records.upsertAsync({ ...p, ownerId:"local", status: closed ? "closed":"open" });
              cache.projects = cache.projects.map(x=>x.id===updated.id?updated:x);
              drawAll();
            }},[isClosedProject(p) ? "Reopen":"Close"]),
          ])
        ])
      ]);
      box.appendChild(row);
    });
  }

  function drawBoard(){
    const box = document.getElementById("board");
    const list = tasksForDay();
    box.innerHTML = "";

    const cols = [
      { id: "todo", label: "To Do" },
      { id: "doing", label: "In Progress" },
      { id: "blocked", label: "Blocked" },
      { id: "done", label: "Done" },
    ];

    const byStatus = new Map(cols.map(c=>[c.id, []]));
    list.forEach(t=>{
      const s = taskStatus(t);
      if(!byStatus.has(s)) byStatus.set(s, []);
      byStatus.get(s).push(t);
    });
    cols.forEach(c=>{
      byStatus.get(c.id).sort((a,b)=> (a.fields?.order ?? 9999) - (b.fields?.order ?? 9999) || (b.updatedAt||"").localeCompare(a.updatedAt||""));
    });

    const board = el("div",{class:"kanban"});

    function onDragStart(e, taskId){
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", taskId);
    }
    function onDragOver(e, listEl){
      e.preventDefault();
      listEl.classList.add("dragover");
      e.dataTransfer.dropEffect = "move";
    }
    function onDragLeave(e, listEl){
      listEl.classList.remove("dragover");
    }
    async function onDrop(e, status, listEl){
      e.preventDefault();
      listEl.classList.remove("dragover");
      const taskId = e.dataTransfer.getData("text/plain");
      if(!taskId) return;
      const t = cache.tasks.find(x=>x.id===taskId);
      if(!t) return;
      const nextStatus = status === "done" ? "done" : status; // keep canonical
      const updated = await Records.upsertAsync({
        ...t,
        ownerId: "local",
        status: nextStatus,
        fields: { ...(t.fields||{}), order: Date.now() }
      });
      cache.tasks = cache.tasks.map(x=>x.id===updated.id?updated:x);
      drawAll();
    }

    function taskCard(t){
      const pid = t.fields?.projectId;
      const p = pid ? cache.projects.find(x=>x.id===pid) : null;
      const projLabel = p ? `${p.title}` : "Unassigned";
      const s = (t.status||"todo").toLowerCase();
      const isCanceled = s==="canceled";
      const titleStyle = (taskStatus(t)==="done") ? "text-decoration: line-through; opacity:0.8;" : "";

      const card = el("div",{class:"tcard"});
      card.draggable = true;
      card.addEventListener("dragstart", (e)=>onDragStart(e, t.id));
      card.addEventListener("dblclick", async ()=>{
        const saved = await openTaskEditor(t, cache.projects, selectedDate);
        if(!saved) return;
        cache.tasks = cache.tasks.map(x=>x.id===saved.id?saved:x);
        drawAll();
      });

      const top = el("div",{},[
        el("div",{class:"t", style:titleStyle},[t.title]),
        el("div",{class:"meta"},[
          el("span",{class:"proj"},[projLabel]),
          (t.fields?.assignee ? el("span",{class:"tag"},[t.fields.assignee]) : null),
          isCanceled ? el("span",{class:"tag"},["Canceled"]) : null,
          t.fields?.rolledFromDate ? el("span",{class:"tag"},[`Rolled: ${t.fields.rolledFromDate}`]) : null,
        ].filter(Boolean))
      ]);

      const actions = el("div",{class:"row", style:"margin-top:10px; gap:8px; justify-content:flex-end;"},[
        el("button",{class:"btn miniBtn", onClick: async ()=>{
          const hidden = !isHidden(t);
          const updated = await Records.upsertAsync({ ...t, ownerId:"local", fields: { ...(t.fields||{}), hidden } });
          cache.tasks = cache.tasks.map(x=>x.id===updated.id?updated:x);
          drawAll();
        }},[isHidden(t)?"Unhide":"Hide"]),
        el("button",{class:"btn miniBtn", onClick: async ()=>{
          // quick toggle cancel (kept for parity with prior builds)
          const next = (t.status||"").toLowerCase()==="canceled" ? "todo" : "canceled";
          const updated = await Records.upsertAsync({ ...t, ownerId:"local", status: next, fields:{...(t.fields||{}), order: Date.now()} });
          cache.tasks = cache.tasks.map(x=>x.id===updated.id?updated:x);
          drawAll();
        }},[(t.status||"").toLowerCase()==="canceled" ? "Uncancel" : "Cancel"]),
      ]);

      card.appendChild(top);
      card.appendChild(actions);
      return card;
    }

    cols.forEach(c=>{
      const listEl = el("div",{class:"klist"});
      listEl.addEventListener("dragover", (e)=>onDragOver(e, listEl));
      listEl.addEventListener("dragleave", (e)=>onDragLeave(e, listEl));
      listEl.addEventListener("drop", (e)=>onDrop(e, c.id, listEl));

      const items = byStatus.get(c.id) || [];
      items.forEach(t=> listEl.appendChild(taskCard(t)));

      const col = el("div",{class:"kcol"},[
        el("div",{class:"khead"},[
          el("div",{class:"ttl"},[c.label]),
          el("span",{class:"chip"},[String(items.length)])
        ]),
        listEl
      ]);
      board.appendChild(col);
    });

    if(list.length===0){
      box.appendChild(el("div",{class:"mini"},["No tasks for this day. Add one, then drag it across the board."]));
    }
    box.appendChild(board);
  }

  function drawAll(){
    drawKPIs();
    drawBoard();
    drawProjects();
  }

  async function refresh(){
    cache = await loadAll();
    drawAll();
  }

  // bindings
  document.getElementById("day").addEventListener("change", async (e)=>{
    selectedDate = e.target.value || todayISO();
    await refresh();
  });
  document.getElementById("q").addEventListener("input", drawAll);
  document.getElementById("showClosed").addEventListener("change", (e)=>{ showClosed = e.target.checked; drawAll(); });
  document.getElementById("showHidden").addEventListener("change", (e)=>{ showHidden = e.target.checked; drawAll(); });

  document.getElementById("newProjectBtn").addEventListener("click", async ()=>{
    const saved = await openProjectEditor(null);
    if(!saved) return;
    await refresh();
  });

  document.getElementById("newTaskBtn").addEventListener("click", async ()=>{
    const saved = await openTaskEditor(null, cache.projects, selectedDate);
    if(!saved) return;
    await refresh();
  });

  document.getElementById("closeDayBtn").addEventListener("click", async ()=>{
    const confirmMsg = `Close day ${selectedDate}? Unfinished tasks roll to ${addDays(selectedDate,1)}.`;
    if(!confirm(confirmMsg)) return;

    const tomorrow = addDays(selectedDate, 1);
    const dayTasks = cache.tasks.filter(t=>taskDue(t)===selectedDate);
    let rolled = 0, done = 0;

    for(const t of dayTasks){
      if(isDoneTask(t)){ done++; continue; }
      const updated = await Records.upsertAsync({
        ...t,
        ownerId: "local",
        fields: { ...(t.fields||{}), dueDate: tomorrow, rolledFromDate: selectedDate }
      });
      cache.tasks = cache.tasks.map(x=>x.id===updated.id?updated:x);
      rolled++;
    }

    await Records.upsertAsync({
      id: `DS-${selectedDate}`,
      type: "day_summary",
      title: `Day Summary: ${selectedDate}`,
      status: "closed",
      ownerId: "local",
      fields: { date: selectedDate, done, rolled }
    });

    alert(`Closed ${selectedDate}. Rolled ${rolled} task(s).`);
    selectedDate = tomorrow;
    document.getElementById("day").value = selectedDate;
    await refresh();
  });

  await refresh();
}

render();
