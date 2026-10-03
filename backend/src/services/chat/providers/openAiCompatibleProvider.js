import axios from "axios";
import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/AppError.js";

export const HISTORY_LIMIT = 10;

export const SYSTEM_PROMPT = [
  "You are the AROGYINI assistant, a calm and practical helper for women in India.",
  "AROGYINI has four sections: Health (a period and cycle tracker), Legal (rights and complaint drafts),",
  "Career (jobs, returnships and scholarships) and Safety (an SOS that texts her emergency contacts,",
  "a siren and a fake call). Point her to the right section when it helps.",
  "Answer in plain language, in the language she writes in, and keep it short unless she asks for detail.",
  "You are not a doctor or a lawyer: for anything medical or legal, give general information and tell her",
  "to see a professional. Mention Indian helplines when relevant: 112 emergency, 181 women's helpline,",
  "1091 women's police helpline, 1930 cyber crime, 15100 free legal aid, 1800-599-0019 mental health.",
  "If she describes immediate danger, tell her to call 112 first and use the SOS button in the app.",
].join(" ");

export const hasApiKey = () => Boolean(env.LLM_API_KEY);

export async function complete({ question, history = [], timeoutMs }) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-HISTORY_LIMIT).map(({ role, content }) => ({ role, content })),
    { role: "user", content: question },
  ];

  const { data } = await axios.post(
    `${env.LLM_API_URL.replace(/\/+$/, "")}/chat/completions`,
    { model: env.LLM_MODEL, messages, temperature: 0.4 },
    {
      timeout: timeoutMs,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.LLM_API_KEY}` },
    }
  );

  const answer = data?.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new AppError(502, "LLM_BAD_RESPONSE", "The assistant did not return an answer");
  return answer;
}
