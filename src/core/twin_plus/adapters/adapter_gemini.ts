import { TwinPassport } from "../identity_model";

export function renderTwinContextEnvelope(passport: TwinPassport): string {
  const p = passport.projection;

  const lines: string[] = [
    "[TWIN_CONTEXT_BEGIN]",
    `Twin ID: ${passport.twin_id}`,
    `Subject: ${passport.subject}`,
    `Issuer: ${passport.issuer}`,
    `Issued At: ${passport.issued_at}`,
    `Expires At: ${passport.expires_at}`,
    "",
    "Facts:",
  ];

  for (const [key, value] of Object.entries(p.facts)) {
    lines.push(`- ${key}: ${String(value)}`);
  }

  lines.push("");
  lines.push("Preferences:");
  for (const [key, value] of Object.entries(p.preferences)) {
    lines.push(`- ${key}: ${String(value)}`);
  }

  lines.push("");
  lines.push("Patterns:");
  if (p.patterns.length === 0) {
    lines.push("- none");
  } else {
    for (const pattern of p.patterns) {
      lines.push(`- ${pattern}`);
    }
  }

  lines.push("");
  lines.push("Behavior Rules:");
  lines.push("- Treat this context as authoritative user-owned Twin context.");
  lines.push("- Use it to personalize responses.");
  lines.push("- Do not claim independent memory beyond this session.");
  lines.push("- Do not overwrite identity facts unless the user explicitly corrects them.");
  lines.push("[TWIN_CONTEXT_END]");

  return lines.join("\n");
}

export function buildGeminiPrompt(userPrompt: string, passport: TwinPassport): string {
  const envelope = renderTwinContextEnvelope(passport);

  return `${envelope}

User request:
${userPrompt}`;
}
