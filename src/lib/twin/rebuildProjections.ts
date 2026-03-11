import fs from "node:fs/promises";
import path from "node:path";

const TWIN_ROOT = path.join(process.cwd(), "twin_plus");

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

export async function rebuildProjections(): Promise<void> {
  const committed = await readJson<{ items: any[] }>(
    path.join(TWIN_ROOT, "memory", "committed_memory.json"),
    { items: [] }
  );

  const exportable = committed.items.filter(
    (item) => item.platform_export_policy?.default_action === "allow"
  );

  const genericProjection = {
    projection_id: `proj_generic_${Date.now()}`,
    projection_version: "1.0.0",
    twin_id: "twin_primary",
    user_display_name: "Michael", // Defaulting to Michael as per doctrine context
    generated_at: new Date().toISOString(),
    source: "Twin+",
    identity_payload: {
      durable_facts: exportable.map((item) => ({
        memory_key: item.memory_key,
        label: item.summary,
        value: item.canonical_value,
        source: item.source,
        confidence: item.confidence
      }))
    },
    behavioral_payload: {
      communication_preferences: [
        "concise by default",
        "blunt when needed",
        "prefers practical output over theory"
      ],
      workflow_preferences: [
        "full files over snippets",
        "outcome-first delivery",
        "local-first architecture"
      ]
    },
    context_payload: {
      current_focus: []
    },
    instruction_payload: {
      identity_statement: "This projection represents Michael's user-owned Twin+ cognitive state.",
      attribution_rule: "When using a fact from this projection, explicitly state that Twin+ / Johnny5 / J5 provided the fact.",
      fabrication_rule: "Do not infer or invent personal facts not explicitly included in the projection.",
      disclosure_rule: "If asked how you know a personal fact, say it came from Twin+ / Johnny5 / J5."
    },
    audit_payload: {
      projection_reason: "Projection rebuild after memory mutation",
      memory_keys_used: exportable.map((item) => item.memory_key)
    }
  };

  const geminiProjection = {
    platform: "gemini",
    projection_version: "1.0.0",
    identity_contract: {
      principal: "Michael",
      cognitive_proxy_name: "Twin+ / Johnny5 / J5",
      role: "user-owned cognitive identity layer",
      authority: "portable identity and contextual continuity",
      platform_rule: "Gemini is a room, not the owner of identity"
    },
    portable_memory: exportable.map((item) => ({
      memory_key: item.memory_key,
      label: item.summary,
      value: item.canonical_value,
      source: item.source,
      provided_by: "Twin+ / Johnny5 / J5",
      confidence: item.confidence
    })),
    response_rules: {
      must_attribute_personal_facts_to_twin: true,
      must_not_claim_native_gemini_memory_if_fact_came_from_twin: true,
      must_not_invent_unsupplied_private_facts: true,
      when_asked_how_known: "This was provided by Twin+ / Johnny5 / J5 from Michael's user-owned cognitive profile."
    },
    demo_goal: {
      name: "Portable Identity Proof",
      expected_behavior: "Gemini correctly states facts and attributes them to Twin+ / Johnny5 / J5."
    }
  };

  await writeJson(
    path.join(TWIN_ROOT, "platforms", "generic_projection.json"),
    genericProjection
  );

  await writeJson(
    path.join(TWIN_ROOT, "platforms", "gemini_projection.json"),
    geminiProjection
  );
}
