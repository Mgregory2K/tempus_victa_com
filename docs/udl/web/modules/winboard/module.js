import { el } from "/ui/shared/ui.js";
import { Records } from "/ui/shared/records.js";
import { openPrompt } from "/ui/shared/modal.js";

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
function parseTags(s){
  return (s||"").split(",").map(x=>x.trim()).filter(Boolean);
}

async function loadWins(){
  await Records.initAuto({ prefer: "server" }); // uses API when available, localStorage fallback
  const all = await Records.allAsync({ type: "win" });
  return Array.isArray(all) ? all : [];
}

function winDate(w){
  return (w?.fields?.date) || (w?.date) || "";
}

function calcWins7d(wins, baseDate){
  const start = addDays(baseDate, -6);
  return wins.filter(w=>{
    const d = winDate(w);
    return d && d >= start && d <= baseDate;
  }).length;
}

function calcStreak(wins, baseDate){
  const byDay = new Set(wins.map(w=>winDate(w)).filter(Boolean));
  let streak = 0;
  let cur = baseDate;
  while(byDay.has(cur)){
    streak++;
    cur = addDays(cur, -1);
  }
  return streak;
}

function impactFromTags(tags){
  if ((tags||[]).some(t=>/high/i.test(t))) return "High";
  if ((tags||[]).some(t=>/med/i.test(t))) return "Med";
  if ((tags||[]).some(t=>/low/i.test(t))) return "Low";
  return "Med";
}

function tile(label, value, tone, sub=""){
  const cls = tone==="good"?"chip good":tone==="warn"?"chip warn":"chip bad";
  return el("div",{class:"card pulse"},[
    el("div",{class:"hd"},[
      el("div",{class:"mini"},[label]),
      el("span",{class:cls},[tone.toUpperCase()])
    ]),
    el("div",{class:"bd"},[
      el("div",{style:"font-size:26px;font-weight:900;"},[String(value)]),
      el("div",{class:"mini"},[sub || ""])
    ])
  ]);
}

async function render(){
  const root = document.getElementById("root");
  root.innerHTML = "";

  let selectedDate = todayISO();
  let wins = await loadWins();

  const hdr = el("div",{class:"hdr"},[
    el("div",{},[
      el("h1",{class:"page-title", style:"margin:0;"},["WinBoard"]),
      el("div",{class:"subtle"},["Local-first • persisted via /api/records (falls back to localStorage)"])
    ]),
    el("div",{class:"row", style:"gap:10px; justify-content:flex-end; align-items:center;"},[
      el("input",{id:"day", type:"date", value:selectedDate, class:"btn", style:"padding:8px 10px;"}),
      el("button",{class:"btn", id:"addWin"},["Add Win"]),
      el("button",{class:"btn primary", id:"logDay"},["Log Day"])
    ])
  ]);

  const tiles = el("div",{class:"tiles", id:"tiles"});

  const listCard = el("div",{class:"card"},[
    el("div",{class:"hd"},[
      el("div",{class:"h3"},["Wins"]),
      el("div",{class:"row", style:"gap:10px; flex:0;"},[
        el("input",{id:"q", type:"text", placeholder:"Search wins…", style:"width:240px;"}),
      ])
    ]),
    el("div",{class:"bd", id:"list"})
  ]);

  const rightCard = el("div",{class:"card"},[
    el("div",{class:"hd"},[
      el("div",{class:"h3"},["Review"]),
      el("span",{class:"chip"},["Today"])
    ]),
    el("div",{class:"bd"},[
      el("div",{class:"mini"},["Wins are stored as records of type \"win\" with date filtering."]),
      el("div",{class:"card", style:"border-radius:14px; padding:12px; background: rgba(0,0,0,0.14); margin-top:12px;"},[
        el("div",{style:"font-weight:850;"},["Tip"]),
        el("div",{class:"subtle", style:"margin-top:6px;"},["Add wins manually now; later you’ll be able to add wins directly from tasks/subtasks."])
      ])
    ])
  ]);

  root.appendChild(hdr);
  root.appendChild(tiles);
  root.appendChild(el("div",{class:"splitGrid"},[listCard,rightCard]));

  function drawTiles(){
    const streak = calcStreak(wins, selectedDate);
    const w7 = calcWins7d(wins, selectedDate);
    tiles.innerHTML = "";
    tiles.appendChild(tile("Streak", streak, streak>=3?"good":streak>=1?"warn":"bad", "consecutive days w/ wins"));
    tiles.appendChild(tile("Wins (7d)", w7, w7>=5?"good":w7>=1?"warn":"bad", "last 7 days"));
    tiles.appendChild(tile("Wins (Today)", wins.filter(w=>winDate(w)===selectedDate).length, "good", selectedDate));
    tiles.appendChild(tile("Mode", Records.mode()==="server"?"API":"Local", Records.mode()==="server"?"good":"warn", "storage"));
  }

  function drawList(){
    const q = (document.getElementById("q")?.value||"").toLowerCase();
    const list = document.getElementById("list");
    const dayWins = wins
      .filter(w=>winDate(w)===selectedDate)
      .sort((a,b)=> (b.updatedAt||"").localeCompare(a.updatedAt||""));

    const filtered = dayWins.filter(w=>{
      const blob = (w.title+" "+(w.fields?.notes||"")+" "+(w.tags||[]).join(" ")).toLowerCase();
      return blob.includes(q);
    });

    list.innerHTML = "";
    if(filtered.length===0){
      list.appendChild(el("div",{class:"mini"},["No wins for this day yet. Add one."]));
      return;
    }

    filtered.forEach(w=>{
      const tags = (w.tags||[]);
      const impact = w.fields?.impact || impactFromTags(tags);
      const row = el("div",{class:"win"},[
        el("div",{},[
          el("div",{class:"t"},[w.title]),
          el("div",{class:"mini"},[`${selectedDate} • Impact: ${impact}`]),
          el("div",{style:"margin-top:6px;"}, tags.map(t=> el("span",{class:"tag", style:"margin-right:6px;"},[t])) ),
          w.fields?.notes ? el("div",{class:"mini", style:"margin-top:6px;"},[w.fields.notes]) : null
        ]),
        el("div",{class:"row", style:"gap:8px; justify-content:flex-end;"},[
          el("button",{class:"btn smallbtn", onClick: async ()=>{
            const title = (await openPrompt({ title:"Edit Win", label:"Win title", defaultValue: w.title })) ?? w.title;
            const notes = (await openPrompt({ title:"Edit Win", label:"Notes (optional)", defaultValue: (w.fields?.notes||"") })) ?? (w.fields?.notes||"");
            const t = (await openPrompt({ title:"Edit Win", label:"Tags (comma)", defaultValue: (w.tags||[]).join(", ") })) ?? (w.tags||[]).join(", ");
            const updated = await Records.upsertAsync({
              ...w,
              title: title.trim() || w.title,
              tags: parseTags(t),
              fields: { ...(w.fields||{}), notes, date: selectedDate }
            });
            // refresh cache
            wins = wins.map(x=>x.id===updated.id?updated:x);
            drawTiles(); drawList();
          }},["Edit"]),
          el("button",{class:"btn smallbtn", onClick: async ()=>{
            if(!confirm("Remove this win from the WinBoard? (It will remain in storage if you cancel.)")) return;
            await Records.removeAsync(w.id);
            wins = wins.filter(x=>x.id!==w.id);
            drawTiles(); drawList();
          }},["Remove"])
        ])
      ]);
      list.appendChild(row);
    });
  }

  async function refresh(){
    wins = await loadWins();
    drawTiles();
    drawList();
  }

  document.getElementById("q").addEventListener("input", drawList);
  document.getElementById("day").addEventListener("change", async (e)=>{
    selectedDate = e.target.value || todayISO();
    await refresh();
  });

  document.getElementById("addWin").addEventListener("click", async ()=>{
    const title = (await openPrompt({ title:"Add Win", label:"Win title", defaultValue:"" }))?.trim();
    if(!title) return;
    const notes = (await openPrompt({ title:"Add Win", label:"Notes (optional)", defaultValue:"" })) || "";
    const tags = parseTags((await openPrompt({ title:"Add Win", label:"Tags (comma, optional)", defaultValue:"udl" })) || "");
    const impact = (await openPrompt({ title:"Add Win", label:"Impact (High/Med/Low)", defaultValue:"Med" })) || "Med";

    const created = await Records.upsertAsync({
      id: `W-${Math.random().toString(16).slice(2,8)}-${Date.now().toString(16)}`,
      type: "win",
      title,
      status: "logged",
      tags,
      ownerId: "local",
      fields: {
        date: selectedDate,
        source: "manual",
        impact,
        notes
      }
    });

    wins.unshift(created);
    drawTiles(); drawList();
  });

  document.getElementById("logDay").addEventListener("click", async ()=>{
    const dayWins = wins.filter(w=>winDate(w)===selectedDate);
    const note = (await openPrompt({ title:"Log Day", label:`Day note for ${selectedDate} (optional)`, defaultValue:"" })) || "";
    await Records.upsertAsync({
      id: `DS-${selectedDate}`,
      type: "day_summary",
      title: `Day Summary: ${selectedDate}`,
      status: "logged",
      ownerId: "local",
      fields: {
        date: selectedDate,
        wins: dayWins.length,
        note
      }
    });
    alert("Day summary saved.");
  });

  await refresh();
}

render();
