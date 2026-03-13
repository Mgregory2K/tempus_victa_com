import fs from "fs";
import path from "path";
import {
  BehavioralPatterns,
  DurableFacts,
  Preferences,
  TwinMemoryBundle,
} from "./identity_model";

const TWIN_DIR = path.join(process.cwd(), "twin_plus");
const DURABLE_FACTS_PATH = path.join(TWIN_DIR, "durable_facts.json");
const PREFERENCES_PATH = path.join(TWIN_DIR, "preferences.json");
const PATTERNS_PATH = path.join(TWIN_DIR, "behavioral_patterns.json");

function ensureJsonFile<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export function loadTwinMemory(): TwinMemoryBundle {
  const durable_facts = ensureJsonFile<DurableFacts>(DURABLE_FACTS_PATH, {
    dog_name: "Rocky",
  });

  const preferences = ensureJsonFile<Preferences>(PREFERENCES_PATH, {
    response_style: "concise",
    humor: true,
  });

  const behavioral_patterns = ensureJsonFile<BehavioralPatterns>(PATTERNS_PATH, [
    {
      pattern: "system_builder",
      confidence: 0.95,
      updated_at: new Date().toISOString(),
    },
    {
      pattern: "autonomy_focused",
      confidence: 0.92,
      updated_at: new Date().toISOString(),
    },
    {
      pattern: "dislikes_fluff",
      confidence: 0.93,
      updated_at: new Date().toISOString(),
    },
  ]);

  return {
    durable_facts,
    preferences,
    behavioral_patterns,
  };
}
