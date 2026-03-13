import crypto from "crypto";

export function signPayload(payload: object, secret: string): string {
  const json = JSON.stringify(payload);

  return crypto.createHmac("sha256", secret).update(json).digest("base64");
}

export function verifyPayload(
  payload: object,
  signature: string,
  secret: string
): boolean {
  const expected = signPayload(payload, secret);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}
