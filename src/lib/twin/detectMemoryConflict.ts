/**
 * Detects if a memory proposal conflicts with existing committed memory.
 */
export function detectMemoryConflict(proposal: any, committedItems: any[]) {
  const existing = committedItems.find(
    (x) => x.memory_key === proposal.memory_key
  );

  if (!existing) return null;

  const same =
    JSON.stringify(existing.canonical_value) ===
    JSON.stringify(proposal.canonical_value);

  if (same) return null;

  return {
    memory_key: proposal.memory_key,
    existing_value: existing.canonical_value,
    proposed_value: proposal.canonical_value,
    source: proposal.source,
    strategy: proposal.conflict_strategy ?? "ask",
    reason: "Existing committed value differs from proposed value."
  };
}
