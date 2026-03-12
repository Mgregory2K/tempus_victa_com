import { NextRequest, NextResponse } from "next/server";
import { loadTwinState } from "@/lib/twin/loadTwinState";
import { callReadyRoomModel } from "@/lib/readyroom/callReadyRoomModel";
import { extractMemoryBlocks } from "@/lib/twin/extractMemoryBlocks";
import { validateMemoryProposal } from "@/lib/twin/validateMemoryProposal";
import { commitMemoryProposal } from "@/lib/twin/commitMemoryProposal";
import { rebuildProjections } from "@/lib/twin/rebuildProjections";
import { detectMemoryConflict } from "@/lib/twin/detectMemoryConflict";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "");
    const apiKey = String(body.apiKey ?? "");
    const autoCommit = Boolean(body.autoCommit ?? false);
    const protocolParams = body.protocolParams ?? null;

    console.log(`[READY ROOM] Request: "${message}" | Mode: ${protocolParams?.mode} | Step: ${protocolParams?.holodeckStep}`);

    if (!message) {
        return NextResponse.json({ ok: false, error: "Message is required" }, { status: 400 });
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    let calendarEvents = [];

    if (token) {
        try {
            const protocol = req.nextUrl.protocol;
            const host = req.nextUrl.host;
            const calRes = await fetch(`${protocol}//${host}/api/calendar`, {
                headers: { Cookie: req.headers.get('cookie') || '' }
            });
            if (calRes.ok) {
                calendarEvents = await calRes.json();
            }
        } catch (e) {
            console.error("Failed to fetch calendar for Ready Room context:", e);
        }
    }

    const twinState = await loadTwinState();

    const modelOutput = await callReadyRoomModel({
      userMessage: message,
      twinState,
      calendarEvents,
      apiKey,
      protocolParams
    });

    let rawText = modelOutput.rawText;
    console.log(`[READY ROOM] Raw model output length: ${rawText.length} chars`);

    // --- HOLODECK STATE INTERCEPTION ---
    let holodeckStateUpdate = null;
    const stateMatch = rawText.match(/<holodeck_state_update>([\s\S]*?)<\/holodeck_state_update>/);
    if (stateMatch) {
      try {
        holodeckStateUpdate = JSON.parse(stateMatch[1]);
        rawText = rawText.replace(/<holodeck_state_update>[\s\S]*?<\/holodeck_state_update>/, "").trim();
        console.log("[READY ROOM] Parsed holodeck_state_update");
      } catch (e) {
        console.error("Failed to parse holodeck state update", e);
      }
    }

    // --- HOLODECK MULTI-SPEAKER PARSING & GHOST CARD SUPPRESSION ---
    const messages: any[] = [];

    // Extract all segments in appearance order
    const segmentRegex = /<(moderator_preamble|participant_turn)(?: participant_id="([^"]+)")?>([\s\S]*?)<\/\1>/g;
    const matches = Array.from(rawText.matchAll(segmentRegex));

    if (matches.length > 0) {
      console.log(`[READY ROOM] Found ${matches.length} holodeck segments`);
      for (const match of matches) {
        const tag = match[1];
        const participantId = match[2];
        const rawContent = match[3];
        const content = rawContent.trim().replace(/^J5:\s*/i, "");

        if (!content) {
            console.warn(`[READY ROOM] Suppressing empty ghost card from tag: <${tag}${participantId ? ` id="${participantId}"` : ''}>. Raw content: "${rawContent}"`);
            continue;
        }

        if (tag === 'moderator_preamble') {
          console.log(`[READY ROOM] Appending Moderator Preamble (${content.length} chars)`);
          messages.push({
            role: 'assistant',
            content: content,
            sourceLayer: 'J5 (Moderator)',
            timestamp: new Date().toISOString()
          });
        } else if (tag === 'participant_turn') {
          const profile = protocolParams?.holodeckProfiles?.find((p: any) => p.id === participantId);
          const displayName = profile?.display_name || participantId || "Unknown Participant";

          console.log(`[READY ROOM] Appending Participant Turn: ${displayName} (${content.length} chars)`);
          messages.push({
            role: 'assistant',
            content: content,
            sourceLayer: displayName,
            participantId: participantId,
            timestamp: new Date().toISOString()
          });
        }
      }

      // DIAGNOSTICS LOGGING
      if (protocolParams?.mode === "HOLODECK") {
          const participants = protocolParams.holodeckConfig?.members || [];
          const matchedIds = messages.filter(m => m.participantId).map(m => m.participantId);
          console.log(`[READY ROOM DIAGNOSTICS] Participants in config: ${JSON.stringify(participants)}`);
          console.log(`[READY ROOM DIAGNOSTICS] Participants rendered: ${JSON.stringify(matchedIds)}`);
          if (matchedIds.length < participants.length) {
              console.warn(`[READY ROOM DIAGNOSTICS] QUEUE STALL DETECTED: Expected ${participants.length} turns, got ${matchedIds.length}.`);
          }
      }

    } else {
      // Fallback for standard messages or non-compliant holodeck responses
      const trimmedText = rawText.trim();
      if (trimmedText) {
        console.log(`[READY ROOM] No segments found, using fallback (${trimmedText.length} chars)`);
        messages.push({
          role: 'assistant',
          content: trimmedText,
          sourceLayer: protocolParams?.mode === "HOLODECK" ? "J5 (Moderator)" : "Twin+ Ready Room Kernel",
          timestamp: new Date().toISOString()
        });
      } else {
        console.warn("[READY ROOM] No content found in model output after processing.");
      }
    }

    // Process memory blocks from the *entire* raw text (including dialogue)
    const parsed = extractMemoryBlocks(modelOutput.rawText);
    const acceptedProposals = [];
    const conflictsFound = [...parsed.memoryConflicts];

    for (const proposal of parsed.memoryUpdateProposals) {
      const validation = validateMemoryProposal(proposal, twinState);
      if (!validation.valid) continue;
      const conflict = detectMemoryConflict(proposal, twinState.committedMemory.items);
      if (conflict) {
        conflictsFound.push(conflict);
        if (proposal.conflict_strategy !== 'replace') continue;
      }
      const shouldCommit = !proposal.requires_confirmation || autoCommit;
      if (shouldCommit) {
        const commitResult = await commitMemoryProposal(proposal, twinState);
        acceptedProposals.push(commitResult);
      }
    }

    if (acceptedProposals.length > 0) {
      await rebuildProjections();
    }

    return NextResponse.json({
      ok: true,
      messages,
      proposals: parsed.memoryUpdateProposals,
      committed: acceptedProposals,
      conflicts: conflictsFound,
      forgetProposals: parsed.memoryForgetProposals,
      holodeckStateUpdate,
      sourceLayer: protocolParams?.mode === "HOLODECK" ? "Holodeck Simulation Engine" : "Twin+ Ready Room Kernel"
    });

  } catch (error) {
    console.error("[READY ROOM ERROR]", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
