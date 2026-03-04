import { el, uid } from "/ui/shared/ui.js";
import { Records } from "/ui/shared/records.js";
import { openModal } from "/ui/shared/modal.js";
/** Records compatibility wrapper (supports old local-only Records + newer async Records) */
async function recInitAuto(){
  try{
    if (typeof Records.initAuto === "function") return await Records.initAuto({ prefer: "server" });
  }catch(e){}
  return "local";
}
async function recAll(query){
  if (typeof Records.allAsync === "function") return await Records.allAsync(query);
  if (typeof Records.all === "function") return Records.all(query);
  // last resort: localStorage key used by legacy Records v1
  return [];
}
async function recUpsert(rec){
  if (typeof Records.upsertAsync === "function") return await recUpsert(rec);
  if (typeof Records.upsert === "function") return Records.upsert(rec);
  // legacy: Records.save?
  if (typeof Records.save === "function") return Records.save(rec);
  throw new Error("Records upsert not available");
}


const ASSIGNEES = [
  "Dylan Gregory",
  "Fiona Hines",
  "Jen Hines",
  "Kingston Hines",
  "Liam Gregory",
  "Michael Gregory"
].sort((a,b)=>a.localeCompare(b));

function iso(d){ return d.toISOString().slice(0,10); }
function todayISO(){ return iso(new Date()); }

function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

let state = {
  mode: "local",
  day: todayISO(),
  projects: [],
  tasks: [],
  wins: [],
  showHidden: false,
  showClosed: false,
};

async function refresh(){
  state.projects = await recAll({ type:"project" });
  // server mode returns {records:[]}; normalize
  if(state.projects?.records) state.projects = state.projects.records;
  state.tasks = await recAll({ type:"task" });
  if(state.tasks?.records) state.tasks = state.tasks.records;
  state.wins = await recAll({ type:"win" });
  if(state.wins?.records) state.wins = state.wins.records;
}

function projectById(id){ return state.projects.find(p=>p.id===id) || null; }

function taskForDay(){
  return state.tasks.filter(t => (t.fields?.dueDate || "") === state.day);
}

function visibleProjects(){
  return state.projects
    .filter(p => state.showHidden ? true : !p.fields?.hidden)
    .filter(p => state.showClosed ? true : (p.status !== "closed"));
}

function visibleTasksForDay(){
  const projVisible = new Set(visibleProjects().map(p=>p.id));
  return taskForDay()
    .filter(t => state.showHidden ? true : !t.fields?.hidden)
    .filter(t => {
      const pid = t.fields?.projectId;
      if(!pid) return true; // unassigned always visible
      return projVisible.has(pid); // if project hidden/closed and filters off, hide tasks
    });
}

function kpiCounts(){
  const tasks = visibleTasksForDay();
  const c = { todo:0, doing:0, blocked:0, done:0 };
  for(const t of tasks){
    const s = (t.fields?.status || "todo");
    if(c[s] !== undefined) c[s] += 1;
    else c.todo += 1;
  }
  return c;
}

function buildTaskCard(t){
  const pid = t.fields?.projectId || "";
  const proj = pid ? projectById(pid) : null;
  const projName = proj ? (proj.title || proj.id) : "Unassigned";
  const assignee = t.fields?.assignee || "Unassigned";

  return el("div", { class:"card", draggable:"true", "data-id": t.id, style:"padding:10px; border-radius:14px; cursor:grab;" }, [
    el("div", { style:"display:flex; justify-content:space-between; gap:10px; align-items:flex-start;" }, [
      el("div", {}, [
        el("div", { style:"font-weight:850; color:var(--text);" }, [t.title || "(untitled)"]),
        el("div", { class:"mini", style:"margin-top:6px;" }, [`${projName} • ${assignee}`]),
      ]),
      el("span", { class:"chip", style:"white-space:nowrap;" }, [(t.fields?.status || "todo").toUpperCase()])
    ]),
  ]);
}

function boardColumn(title, key, tasks){
  const col = el("div", { class:"card", style:"padding:12px; min-height:220px; border-radius:14px;" }, [
    el("div", { style:"display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;" }, [
      el("div", { style:"font-weight:900; letter-spacing:.4px;" }, [title]),
      el("span", { class:"tag" }, [String(tasks.length)])
    ]),
    el("div", { class:"dropzone", "data-status": key, style:"display:grid; gap:10px;" },
      tasks.map(buildTaskCard)
    )
  ]);
  return col;
}

function openProjectEditor(project=null){
  const isNew = !project;
  const p = project ? JSON.parse(JSON.stringify(project)) : {
    id: uid("P"),
    type:"project",
    title:"",
    status:"open",
    tags:[],
    fields:{ hidden:false, key:"", links:[], ownerId:"local" }
  };

  const form = el("div", {}, [
    el("div", { class:"udl-row" }, [
      el("div", {}, [
        el("label", {}, ["Project name"]),
        el("input", { id:"p_title", type:"text", placeholder:"e.g., Execute 404 edits", value: p.title || "" })
      ]),
      el("div", {}, [
        el("label", {}, ["Project key (optional)"]),
        el("input", { id:"p_key", type:"text", placeholder:"e.g., NET-123", value: p.fields?.key || "" })
      ]),
    ]),
    el("div", { class:"udl-row" }, [
      el("div", {}, [
        el("label", {}, ["Status"]),
        el("select", { id:"p_status" }, [
          el("option", { value:"open", selected: p.status==="open" }, ["Open"]),
          el("option", { value:"closed", selected: p.status==="closed" }, ["Closed"]),
        ])
      ]),
      el("div", {}, [
        el("label", {}, ["Tags (comma)"]),
        el("input", { id:"p_tags", type:"text", placeholder:"e.g., book, ops", value: (p.tags||[]).join(", ") })
      ]),
    ]),
    el("div", { class:"udl-check-row" }, [
      el("input", { id:"p_hidden", type:"checkbox", checked: !!p.fields?.hidden }),
      el("div", { class:"udl-check-text" }, ["Hidden (remove from view)"]),
    ]),
    el("div", {}, [
      el("label", {}, ["Links (optional, one per line: type:id[:role])"]),
      el("textarea", { id:"p_links", placeholder:"project:P-xxxx:parent\nwin:W-xxxx:related", value: (p.fields?.links||[]).map(l=>`${l.type}:${l.id}${l.role?`:${l.role}`:""}`).join("\n") })
    ])
  ]);

  openModal({
    title: isNew ? "New Project" : "Edit Project",
    body: form,
    onSave: async () => {
      const title = form.querySelector("#p_title").value.trim();
      const key = form.querySelector("#p_key").value.trim();
      const status = form.querySelector("#p_status").value;
      const tags = form.querySelector("#p_tags").value.split(",").map(s=>s.trim()).filter(Boolean);
      const hidden = form.querySelector("#p_hidden").checked;
      const linksRaw = form.querySelector("#p_links").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
      const links = linksRaw.map(line=>{
        const parts = line.split(":");
        return { type: parts[0] || "related", id: parts[1] || "", role: parts[2] || "" };
      }).filter(x=>x.id);

      const rec = {
        ...p,
        title: title || p.title || "Untitled Project",
        status,
        tags,
        fields: { ...(p.fields||{}), key, hidden, links, ownerId:"local" }
      };
      await recUpsert(rec);
      await refresh();
      render();
    }
  });
}

function openTaskEditor(task=null){
  const isNew = !task;
  const t = task ? JSON.parse(JSON.stringify(task)) : {
    id: uid("T"),
    type:"task",
    title:"",
    status:"open",
    tags:[],
    fields:{
      ownerId:"local",
      dueDate: state.day,
      status:"todo",
      projectId:"",
      assignee:"",
      hidden:false,
      notes:"",
      links:[]
    }
  };

  const projOpts = visibleProjects().slice().sort((a,b)=> (a.title||"").localeCompare(b.title||""));
  const form = el("div", {}, [
    el("div", {}, [
      el("label", {}, ["Task title"]),
      el("input", { id:"t_title", type:"text", placeholder:"What needs to get done?", value: t.title || "" })
    ]),
    el("div", { class:"udl-row" }, [
      el("div", {}, [
        el("label", {}, ["Project"]),
        el("select", { id:"t_project" }, [
          el("option", { value:"", selected: !t.fields?.projectId }, ["— Unassigned —"]),
          ...projOpts.map(p => el("option", { value:p.id, selected: (t.fields?.projectId===p.id) }, [p.title || p.id]))
        ])
      ]),
      el("div", {}, [
        el("label", {}, ["Assignee"]),
        el("select", { id:"t_assignee" }, [
          el("option", { value:"", selected: !t.fields?.assignee }, ["— Unassigned —"]),
          ...ASSIGNEES.map(n => el("option", { value:n, selected: (t.fields?.assignee===n) }, [n]))
        ])
      ]),
    ]),
    el("div", { class:"udl-row" }, [
      el("div", {}, [
        el("label", {}, ["Status"]),
        el("select", { id:"t_status" }, [
          el("option", { value:"todo", selected: (t.fields?.status==="todo") }, ["To Do"]),
          el("option", { value:"doing", selected: (t.fields?.status==="doing") }, ["In Progress"]),
          el("option", { value:"blocked", selected: (t.fields?.status==="blocked") }, ["Blocked"]),
          el("option", { value:"done", selected: (t.fields?.status==="done") }, ["Done"]),
        ])
      ]),
      el("div", {}, [
        el("label", {}, ["Due date"]),
        el("input", { id:"t_due", type:"date", value: t.fields?.dueDate || state.day })
      ]),
    ]),
    el("div", { class:"udl-check-row" }, [
      el("input", { id:"t_hidden", type:"checkbox", checked: !!t.fields?.hidden }),
      el("div", { class:"udl-check-text" }, ["Hidden (remove from view)"]),
    ]),
    el("div", {}, [
      el("label", {}, ["Notes"]),
      el("textarea", { id:"t_notes", placeholder:"Optional notes…", value: t.fields?.notes || "" })
    ]),
    el("div", {}, [
      el("label", {}, ["Links (optional, one per line: type:id[:role])"]),
      el("textarea", { id:"t_links", placeholder:"project:P-xxxx:parent\nwin:W-xxxx:related", value: (t.fields?.links||[]).map(l=>`${l.type}:${l.id}${l.role?`:${l.role}`:""}`).join("\n") })
    ])
  ]);

  openModal({
    title: isNew ? "New Task" : "Edit Task",
    body: form,
    onSave: async () => {
      const title = form.querySelector("#t_title").value.trim();
      const projectId = form.querySelector("#t_project").value;
      const assignee = form.querySelector("#t_assignee").value;
      const status = form.querySelector("#t_status").value;
      const dueDate = form.querySelector("#t_due").value || state.day;
      const hidden = form.querySelector("#t_hidden").checked;
      const notes = form.querySelector("#t_notes").value || "";
      const linksRaw = form.querySelector("#t_links").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
      const links = linksRaw.map(line=>{
        const parts = line.split(":");
        return { type: parts[0] || "related", id: parts[1] || "", role: parts[2] || "" };
      }).filter(x=>x.id);

      const rec = {
        ...t,
        title: title || t.title || "Untitled Task",
        fields: { ...(t.fields||{}), projectId, assignee, status, dueDate, hidden, notes, links, ownerId:"local" }
      };
      await recUpsert(rec);
      await refresh();
      render();
    }
  });
}

async function closeDayRollover(){
  const tasks = visibleTasksForDay();
  const tomorrow = iso(new Date(new Date(state.day+"T00:00:00").getTime() + 86400000));
  const unfinished = tasks.filter(t => (t.fields?.status || "todo") !== "done");
  for(const t of unfinished){
    const rec = { ...t, fields: { ...(t.fields||{}), dueDate: tomorrow, rolledFromDate: state.day } };
    await recUpsert(rec);
  }
  await recUpsert({
    type:"day_summary",
    title:`Day Summary ${state.day}`,
    fields:{ ownerId:"local", date: state.day, rolledCount: unfinished.length }
  });
  state.day = tomorrow;
  await refresh();
  render();
}

function bindDnD(root){
  // drag start
  root.querySelectorAll("[draggable='true']").forEach(card=>{
    card.addEventListener("dragstart", (e)=>{
      e.dataTransfer.setData("text/plain", card.getAttribute("data-id"));
    });
  });

  // drop zones
  root.querySelectorAll(".dropzone").forEach(zone=>{
    zone.addEventListener("dragover", (e)=>{ e.preventDefault(); });
    zone.addEventListener("drop", async (e)=>{
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      const status = zone.getAttribute("data-status");
      const task = state.tasks.find(t=>t.id===id);
      if(!task) return;
      await recUpsert({ ...task, fields:{ ...(task.fields||{}), status } });
      await refresh();
      render();
    });
  });
}

function bindClicks(root){
  // open task editor on double click
  root.querySelectorAll("[draggable='true']").forEach(card=>{
    card.addEventListener("dblclick", ()=>{
      const id = card.getAttribute("data-id");
      const task = state.tasks.find(t=>t.id===id);
      if(task) openTaskEditor(task);
    });
  });
}

function render(){
  const root = document.getElementById("root");
  if(!root) return;

  const counts = kpiCounts();

  const hdr = el("div",{class:"hdr"},[
    el("div",{},[
      el("h1",{class:"page-title", style:"margin:0;"},["Daily Planner"]),
      el("div",{class:"subtle"},["Projects + tasks • Kanban • rollover • local-first"])
    ]),
    el("div",{class:"row", style:"gap:10px; justify-content:flex-end; flex-wrap:wrap;"},[
      el("input",{id:"dayPick", type:"date", value: state.day}),
      el("button",{class:"btn", id:"newProject"},["New Project"]),
      el("button",{class:"btn", id:"newTask"},["New Task"]),
      el("button",{class:"btn primary", id:"roll"},["Close Day (Rollover)"]),
      el("span",{class:"pill good", style:"margin-left:6px;"},[
        el("span",{class:"dot"}), `${state.mode.toUpperCase()}: ${state.mode==="server"?"API":"local"}`
      ])
    ])
  ]);

  // board
  const tasks = visibleTasksForDay();
  const by = (k)=>tasks.filter(t => (t.fields?.status || "todo") === k);
  const board = el("div",{class:"card", style:"padding:12px; border-radius:14px;"},[
    el("div",{style:"display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px; flex-wrap:wrap;"},[
      el("div",{style:"font-weight:900;"},["Today Board"]),
      el("div",{class:"row", style:"gap:14px; align-items:center; flex-wrap:wrap;"},[
        el("input",{id:"q", type:"text", placeholder:"Search tasks…", style:"width:260px;"}),
        el("label",{class:"mini"},[
          el("input",{id:"showClosed", type:"checkbox", checked: state.showClosed}),
          " Show closed"
        ]),
        el("label",{class:"mini"},[
          el("input",{id:"showHidden", type:"checkbox", checked: state.showHidden}),
          " Show hidden"
        ])
      ])
    ]),
    el("div",{style:"display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:12px;"},[
      boardColumn("TO DO","todo", by("todo")),
      boardColumn("IN PROGRESS","doing", by("doing")),
      boardColumn("BLOCKED","blocked", by("blocked")),
      boardColumn("DONE","done", by("done")),
    ])
  ]);

  const projectsCard = el("div",{class:"card", style:"padding:12px; border-radius:14px;"},[
    el("div",{class:"split"},[
      el("div",{style:"font-weight:900;"},["Projects"]),
      el("span",{class:"pill"},[el("span",{class:"dot"}),"API"])
    ]),
    el("div",{class:"mini", style:"margin-top:6px;"},[
      visibleProjects().length ? "Click a project to edit. Close/hide is non-destructive." : "No projects yet. Create one."
    ]),
    el("div",{id:"projList", style:"margin-top:10px; display:grid; gap:10px;"})
  ]);

  const wrap = el("div",{class:"wrap"},[
    hdr,
    el("div",{class:"projectGrid"},[
      board,
      projectsCard
    ])
  ]);

  root.innerHTML = "";
  root.appendChild(wrap);

  // populate projects list
  const list = root.querySelector("#projList");
  const projs = visibleProjects().slice().sort((a,b)=>(a.title||"").localeCompare(b.title||""));
  projs.forEach(p=>{
    const row = el("div",{class:"card", style:"padding:10px; border-radius:14px;"},[
      el("div",{style:"display:flex; justify-content:space-between; align-items:center; gap:10px;"},[
        el("div",{},[
          el("div",{style:"font-weight:900;"},[p.title || "(untitled)"]),
          el("div",{class:"mini"},[`${p.id}${p.status==="closed"?" • Closed":""}`])
        ]),
        el("div",{class:"row", style:"gap:8px; flex-wrap:wrap; justify-content:flex-end;"},[
          el("button",{class:"btn", onClick:()=>openProjectEditor(p)},["Edit"]),
          el("button",{class:"btn", onClick: async ()=>{
            await recUpsert({ ...p, fields:{...(p.fields||{}), hidden:true} });
            await refresh(); render();
          }},["Hide"]),
          el("button",{class:"btn", onClick: async ()=>{
            await recUpsert({ ...p, status:"closed" });
            await refresh(); render();
          }},["Close"]),
        ])
      ])
    ]);
    list.appendChild(row);
  });

  // bind header actions
  root.querySelector("#newProject").addEventListener("click", ()=>openProjectEditor(null));
  root.querySelector("#newTask").addEventListener("click", ()=>openTaskEditor(null));
  root.querySelector("#roll").addEventListener("click", ()=>closeDayRollover());

  root.querySelector("#dayPick").addEventListener("change", async (e)=>{
    state.day = e.target.value || todayISO();
    await refresh();
    render();
  });

  root.querySelector("#showHidden").addEventListener("change", async (e)=>{
    state.showHidden = e.target.checked;
    render();
  });
  root.querySelector("#showClosed").addEventListener("change", async (e)=>{
    state.showClosed = e.target.checked;
    render();
  });

  // search filter: simple hide cards
  const q = root.querySelector("#q");
  q.addEventListener("input", ()=>{
    const query = q.value.toLowerCase().trim();
    root.querySelectorAll("[draggable='true']").forEach(card=>{
      const id = card.getAttribute("data-id");
      const t = state.tasks.find(x=>x.id===id);
      const text = ((t?.title||"") + " " + (projectById(t?.fields?.projectId||"")?.title||"") + " " + (t?.fields?.assignee||"")).toLowerCase();
      card.style.display = (!query || text.includes(query)) ? "" : "none";
    });
  });

  bindDnD(root);
  bindClicks(root);
}

async function init(){
  state.mode = await recInitAuto();
  await refresh();
  render();
}

init();