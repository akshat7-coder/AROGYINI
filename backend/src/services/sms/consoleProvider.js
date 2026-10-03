export const name = "console";

let counter = 0;

export async function send({ to, body }) {
  counter += 1;
  console.log(`[sms:console] -> ${to}\n${body}`);
  return { sid: `console-${Date.now()}-${counter}` };
}
