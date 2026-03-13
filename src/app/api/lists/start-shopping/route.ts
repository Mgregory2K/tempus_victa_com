import { NextRequest, NextResponse } from "next/server"
import { sendShoppingAlert } from "@/lib/sms/sendShoppingAlert"

export async function POST(req: NextRequest) {
  try {
    const { listId, shopperName, collaborators } = await req.json()

    if (!listId) {
      return NextResponse.json({ error: "Missing listId" }, { status: 400 })
    }

    if (!Array.isArray(collaborators)) {
      return NextResponse.json({ error: "Invalid collaborators" }, { status: 400 })
    }

    // In a real app, you would update the DB here to set mode: 'shopping'
    // and shopping_alert_sent: true.
    // Since this is a demo/local-first prototype, we assume the frontend handles state
    // and this API just handles the side effect (SMS).

    for (const user of collaborators) {
      if (!user.phone) continue

      try {
        await sendShoppingAlert(
          user.phone,
          shopperName,
          listId
        )
      } catch (smsError) {
        console.error(`Failed to send SMS to ${user.phone}:`, smsError)
        // Continue to others even if one fails
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Shopping Alert Error:", error)
    return NextResponse.json(
      { error: "Failed to send shopping alerts" },
      { status: 500 }
    )
  }
}
