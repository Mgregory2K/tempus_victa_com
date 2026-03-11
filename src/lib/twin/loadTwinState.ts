import fs from "node:fs/promises";
import path from "node:path";

export interface TwinState {
  committedMemory: { items: any[] };
  durableFacts: { facts: any[] };
  genericProjection: Record<string, unknown>;
  geminiProjection: Record<string, unknown>;
}

const TWIN_ROOT = path.join(process.cwd(), "twin_plus");

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadTwinState(): Promise<TwinState> {
  return {
    committedMemory: await readJson(
      path.join(TWIN_ROOT, "memory", "committed_memory.json"),
      { items: [] }
    ),
    durableFacts: await readJson(
      path.join(TWIN_ROOT, "identity", "durable_facts.json"),
      { facts: [] }
    ),
    genericProjection: await readJson(
      path.join(TWIN_ROOT, "platforms", "generic_projection.json"),
      {}
    ),
    geminiProjection: await readJson(
      path.join(TWIN_ROOT, "platforms", "gemini_projection.json"),
      {}
    )
  };
}
