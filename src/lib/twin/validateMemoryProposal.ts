export function validateMemoryProposal(proposal: any, twinState: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!proposal || typeof proposal !== "object") {
    errors.push("Proposal must be an object.");
  }

  if (!proposal.memory_key || typeof proposal.memory_key !== "string") {
    errors.push("memory_key is required.");
  }

  if (!proposal.summary || typeof proposal.summary !== "string") {
    errors.push("summary is required.");
  }

  if (!proposal.memory_class) {
    errors.push("memory_class is required.");
  }

  if (typeof proposal.confidence !== "number") {
    errors.push("confidence must be numeric.");
  }

  if (
    proposal.source === "inferred" &&
    proposal.memory_class === "committed"
  ) {
    errors.push("Inferred memories cannot become committed automatically.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
