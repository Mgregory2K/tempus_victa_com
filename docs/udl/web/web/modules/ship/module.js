import { el, uid } from "/ui/shared/ui.js";

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

  function draw(){
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

  function move(t, dir){
    const colId = statusToColumn(cfg, t.status);
    const colIdx = cfg.columns.findIndex(c=>c.id===colId);
    const next = cfg.columns[Math.max(0, Math.min(cfg.columns.length-1, colIdx+dir))]?.id;
    const nextStatus = cfg.statuses.find(s=>s.column===next)?.id || t.status;
    t.status = nextStatus;
    save(ticketsKey, tickets);
    draw();
  }

  function quickIssue(colId){
    const status = cfg.statuses.find(s=>s.column===colId)?.id || cfg.statuses[0].id;
    tickets.unshift({ id:`UDL-${Math.floor(100+Math.random()*900)}`, title:"New issue (UI)", status, owner:"Michael", sev:"P3", tags:["new"] });
    save(ticketsKey, tickets);
    draw();
  }

  function open(t){
    alert(`${t.id}\n\n${t.title}\n\n(UI only — next: side panel like ServiceNow record view)`);
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

  draw();
}
render();