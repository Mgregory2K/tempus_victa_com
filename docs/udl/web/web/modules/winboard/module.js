import { el } from "/ui/shared/ui.js";
import { openPrompt } from "/ui/shared/modal.js";

// WinBoard v2: still renders via the existing UI helper + uses shared modal prompt.

async function apiList(type){
  const r = await fetch(`/api/records?type=${encodeURIComponent(type)}`);
  if(!r.ok) return [];
  const j = await r.json();
  return j.records || [];
}

async function apiUpsert(rec){
  const r = await fetch(`/api/records`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify(rec)
  });
  if(!r.ok) throw new Error("save failed");
  return await r.json();
}

function iso(d=new Date()){ return d.toISOString().slice(0,10); }

async function render(){
  const root = document.getElementById("root");
  root.innerHTML = "";

  const hdr = el("div",{class:"hdr"},[
    el("div",{},[
      el("h1",{class:"page-title", style:"margin:0;"},["WinBoard"]),
      el("div",{class:"subtle"},["Local-first • persisted via /api/records"])
    ]),
    el("div",{class:"row", style:"gap:10px; justify-content:flex-end;"},[
      el("input",{id:"wbDate", type:"date", value: iso(), style:"width:160px;"}),
      el("button",{class:"btn", id:"addWin"},["Add Win"])
    ])
  ]);

  const listCard = el("div",{class:"card"},[
    el("div",{class:"hd"},[
      el("div",{class:"h3"},["Wins"]),
      el("div",{class:"row", style:"gap:10px; flex:0;"},[
        el("input",{id:"q", type:"text", placeholder:"Search wins…", style:"width:240px;"}),
      ])
    ]),
    el("div",{class:"bd", id:"list"})
  ]);

  root.appendChild(hdr);
  root.appendChild(listCard);

  let allWins = await apiList("win");

  function draw(){
    const day = document.getElementById("wbDate")?.value || iso();
    const q = (document.getElementById("q")?.value || "").toLowerCase();
    const list = document.getElementById("list");

    const wins = (allWins||[])
      .map(w => ({...w, fields: w.fields || {}}))
      .filter(w => (w.fields.date || "") === day)
      .filter(w => !q || (w.fields.title || "").toLowerCase().includes(q));

    list.innerHTML = "";
    if(!wins.length){
      list.appendChild(el("div",{class:"mini"},["No wins for this day yet. Add one."]));
      return;
    }

    wins.forEach(w => {
      list.appendChild(el("div",{class:"win"},[
        el("div",{},[
          el("div",{class:"t"},[w.fields.title || "(untitled)"]),
          el("div",{class:"mini"},[(w.fields.source || "manual")])
        ])
      ]));
    });
  }

  document.getElementById("q")?.addEventListener("input", draw);
  document.getElementById("wbDate")?.addEventListener("change", draw);

  document.getElementById("addWin")?.addEventListener("click", async () => {
    const title = await openPrompt("Add Win", "Win title:", "");
    if(title === null) return;
    await apiUpsert({ type:"win", fields:{ ownerId:"local", date: (document.getElementById('wbDate')?.value||iso()), title, source:"manual" } });
    allWins = await apiList("win");
    draw();
  });

  draw();
}

render();
