export const name = "memory";

// Mirrors Twilio's magic test numbers so the per-contact failure path is reachable.
export const ALWAYS_FAILS = "+15005550001";

const sent = [];

export async function send({ to, body }) {
  if (to === ALWAYS_FAILS) throw new Error("Invalid recipient (magic test number)");
  const sid = `memory-${sent.length + 1}`;
  sent.push({ to, body, sid, sentAt: new Date() });
  console.log(`Sent SMS to ${to}: ${body}`);
  return { sid };
}

export const getSentMessages = () => [...sent];
export const clearSentMessages = () => sent.splice(0, sent.length);
