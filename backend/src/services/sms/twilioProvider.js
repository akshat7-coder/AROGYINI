import twilio from "twilio";
import { env } from "../../config/env.js";

export const name = "twilio";

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export async function send({ to, body }) {
  const maskedTo = `***${to.slice(-4)}`;

  console.log(`[sms:twilio] submitting message to ${maskedTo}`);

  try {
    const message = await client.messages.create({
      to,
      body,
      from: env.TWILIO_PHONE_NUMBER,
    });

    console.log("[sms:twilio] Twilio response:", {
      sid: message.sid,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      price: message.price,
    });

    return {
      sid: message.sid,
      status: message.status,
    };
  } catch (error) {
    console.error("[sms:twilio] FAILED:", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      statusCode: error?.statusCode,
      moreInfo: error?.moreInfo,
      details: error?.details,
    });

    throw error;
  }
}