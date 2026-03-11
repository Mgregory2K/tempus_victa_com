import { NextRequest, NextResponse } from "next/server";
import { loadTwinState } from "@/lib/twin/loadTwinState";
import { callReadyRoomModel } from "@/lib/readyroom/callReadyRoomModel";
import { extractMemoryBlocks } from "@/lib/twin/extractMemoryBlocks";
import { validateMemoryProposal } from "@/lib/twin/validateMemoryProposal";
import { commitMemoryProposal } from "@/lib/twin/commitMemoryProposal";
import { rebuildProjections } from "@/lib/twin/rebuildProjections";
import { detectMemoryConflict } from "@/lib/twin/detectMemoryConflict";
import { getToken } from "next-auth/jwt";

/**
 * J5 READY ROOM API - PROPOSAL & COMMIT FLOW
 * Now includes Calendar & Tasks context integration.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "");
    const apiKey = String(body.apiKey ?? "");
    const autoCommit = Boolean(body.autoCommit ?? false);

    if (!message) {
        return NextResponse.json({ ok: false, error: "Message is required" }, { status: 400 });
    }

    // 0. Fetch Calendar Context (internal fetch to our own API)
    // We use the same token as the current request
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    let calendarEvents = [];

    if (token) {
        try {
            // Use absolute URL for internal fetch in Next.js API routes if needed,
            // but here we can try a direct fetch if we have the base URL
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

    // 1. Load current Twin state
    const twinState = await loadTwinState();

    // 2. Call the Ready Room model (J5)
    const modelOutput = await callReadyRoomModel({
      userMessage: message,
      twinState,
      calendarEvents,
      apiKey
    });

    // 3. Extract structured memory blocks from the response
    const parsed = extractMemoryBlocks(modelOutput.rawText);

    const acceptedProposals = [];
    const conflictsFound = [...parsed.memoryConflicts];

    // 4. Process Proposals
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
      role: 'assistant',
      content: parsed.cleanReplyText,
      proposals: parsed.memoryUpdateProposals,
      committed: acceptedProposals,
      conflicts: conflictsFound,
      forgetProposals: parsed.memoryForgetProposals,
      sourceLayer: "Twin+ Ready Room Kernel"
    });

  } catch (error) {
    console.error("[READY ROOM ERROR]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
