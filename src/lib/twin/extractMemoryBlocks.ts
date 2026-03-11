function extractTagBlocks(text: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "g");
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
}

function removeTagBlocks(text: string, tag: string): string {
  const regex = new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, "g");
  return text.replace(regex, "").trim();
}

export interface ExtractedMemoryBlocks {
  cleanReplyText: string;
  memoryUpdateProposals: any[];
  memoryForgetProposals: any[];
  memoryConflicts: any[];
}

function safeJsonParse(raw: string): any | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function extractMemoryBlocks(text: string): ExtractedMemoryBlocks {
  const updateRaw = extractTagBlocks(text, "memory_update_proposal");
  const forgetRaw = extractTagBlocks(text, "memory_forget_proposal");
  const conflictRaw = extractTagBlocks(text, "memory_conflict");

  const cleanReplyText = removeTagBlocks(
    removeTagBlocks(removeTagBlocks(text, "memory_update_proposal"), "memory_forget_proposal"),
    "memory_conflict"
  ).trim();

  return {
    cleanReplyText,
    memoryUpdateProposals: updateRaw.map(safeJsonParse).filter(Boolean),
    memoryForgetProposals: forgetRaw.map(safeJsonParse).filter(Boolean),
    memoryConflicts: conflictRaw.map(safeJsonParse).filter(Boolean)
  };
}
