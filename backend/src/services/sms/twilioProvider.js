import twilio from "twilio";
import { env } from "../../config/env.js";

export const name = "twilio";

// Built once. Account SID + auth token is what .env carries; API key/secret is not configured.
const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

// Used by the startup probe so it checks the very client that sends, never a separate one.
export async function verify() {
  const [account, numbers] = await Promise.all([
    client.api.v2010.accounts(env.TWILIO_ACCOUNT_SID).fetch(),
    client.incomingPhoneNumbers.list({ limit: 20 }),
  ]);
  return {
    type: account.type,
    from: env.TWILIO_PHONE_NUMBER,
    owned: numbers.map((row) => row.phoneNumber),
    senderIsOwned: numbers.some((row) => row.phoneNumber === env.TWILIO_PHONE_NUMBER),
  };
}

export async function send({ to, body }) {
  const message = await client.messages.create({ to, body, from: env.TWILIO_PHONE_NUMBER });
  return { sid: message.sid, status: message.status };
}
