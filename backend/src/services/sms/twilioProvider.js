import twilio from "twilio";
import { env } from "../../config/env.js";

export const name = "twilio";

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export async function send({ to, body }) {
  const message = await client.messages.create({ to, body, from: env.TWILIO_PHONE_NUMBER });
  return { sid: message.sid };
}
