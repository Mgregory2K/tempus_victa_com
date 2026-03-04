import { Records } from "/ui/shared/records.js";
const SEED_KEY = "udl_records_seeded_v1";

export function ensureSeed(){
  try{
    if(localStorage.getItem(SEED_KEY)) return;
    const existing = Records.all();
    if(existing && existing.length){
      localStorage.setItem(SEED_KEY, "1");
      return;
    }

    // Minimal seed to support future integration (doesn't override current module mocks)
    Records.upsert({ type:"project", id:"P-101", title:"Unified Dashboard Lite v2", status:"in_progress", priority:"high", owner:"Michael", tags:["shell","ui"] });
    Records.upsert({ type:"ship_item", id:"UDL-002", title:"Make boards feel Jira-ish", status:"todo", priority:"med", owner:"Michael", tags:["ship","board"] });
    Records.upsert({ type:"win", id:"WIN-001", title:"Shell loads on LAN (phone + laptop)", status:"good", priority:"high", owner:"Michael", tags:["udl","lan"] });
    Records.upsert({ type:"pbj_case", id:"PBJ-001", title:"Operational Health Snapshot — Intake (v1)", status:"draft", priority:"high", owner:"Michael", tags:["pbj"] });

    localStorage.setItem(SEED_KEY, "1");
  }catch(e){}
}
