import Twilio from "twilio"

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function sendShoppingAlert(
  phone: string,
  shopperName: string,
  listId: string
) {

  const url = `https://tempusvicta.com/list/${listId}`

  const message = `${shopperName} is at the store.

Need anything?

Add it here:
${url}`

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone
  })
}
