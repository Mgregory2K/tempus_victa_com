import fs from "node:fs/promises";
import path from "node:path";

const TWIN_ROOT = path.join(process.cwd(), "twin_plus");

function nowIso(): string {
  return new Date().toISOString();
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function appendJsonl(filePath: string, record: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, JSON.stringify(record) + "\n", "utf8");
}

export async function commitMemoryProposal(proposal: any, twinState: any) {
  const committedPath = path.join(TWIN_ROOT, "memory", "committed_memory.json");
  const durableFactsPath = path.join(TWIN_ROOT, "identity", "durable_facts.json");
  const ledgerPath = path.join(TWIN_ROOT, "memory", "memory_ledger.jsonl");

  const committed = await readJson<{ items: any[] }>(committedPath, { items: [] });

  const existingIndex = committed.items.findIndex(
    (x) => x.memory_key === proposal.memory_key
  );

  const item = {
    id:
      existingIndex >= 0
        ? committed.items[existingIndex].id
        : `mem_${proposal.memory_key.replace(/[^a-zA-Z0-9_.-]/g, "_")}`,
    memory_key: proposal.memory_key,
    summary: proposal.summary,
    canonical_value: proposal.canonical_value,
    memory_class: proposal.memory_class,
    source: proposal.source,
    confidence: proposal.confidence,
    locked: proposal.memory_class === "committed",
    visibility: proposal.visibility || "exportable",
    export_tags: proposal.export_tags ?? [],
    platform_export_policy: {
      default_action:
        proposal.visibility === "exportable" ? "allow" : "deny",
      allowed_platforms:
        proposal.visibility === "exportable"
          ? ["generic", "gemini", "chatgpt", "claude"]
          : [],
      export_reason: proposal.reason
    },
    created_at:
      existingIndex >= 0
        ? committed.items[existingIndex].created_at
        : nowIso(),
    updated_at: nowIso()
  };

  const oldValue =
    existingIndex >= 0 ? committed.items[existingIndex].canonical_value : null;

  if (existingIndex >= 0) {
    committed.items[existingIndex] = item;
  } else {
    committed.items.push(item);
  }

  // 1. Update committed_memory.json
  await writeJson(committedPath, committed);

  // 2. Also update durable_facts.json for searchability if it's committed/durable
  if (proposal.memory_class === "committed" || proposal.memory_class === "durable") {
      const durable = await readJson<{ facts: any[] }>(durableFactsPath, { facts: [] });
      const factIndex = durable.facts.findIndex(f => f.key === proposal.memory_key);
      const factItem = {
          id: item.id.replace('mem_', 'fact_'),
          key: proposal.memory_key,
          value: proposal.canonical_value,
          value_type: typeof proposal.canonical_value,
          memory_class: proposal.memory_class,
          source: proposal.source,
          confidence: proposal.confidence,
          locked: item.locked,
          visibility: item.visibility,
          export_tags: item.export_tags,
          notes: proposal.reason,
          created_at: item.created_at,
          updated_at: item.updated_at
      };
      if (factIndex >= 0) durable.facts[factIndex] = factItem;
      else durable.facts.push(factItem);
      await writeJson(durableFactsPath, durable);
  }

  // 3. Append to ledger
  await appendJsonl(ledgerPath, {
    event_id: `evt_${Date.now()}`,
    ts: nowIso(),
    action: existingIndex >= 0 ? "update" : "create",
    target: "memory.committed",
    memory_key: proposal.memory_key,
    old_value: oldValue,
    new_value: proposal.canonical_value,
    source: proposal.source,
    confidence: proposal.confidence,
    actor: "twin_plus",
    reason: proposal.reason
  });

  return item;
}
