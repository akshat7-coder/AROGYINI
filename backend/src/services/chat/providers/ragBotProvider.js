import axios from "axios";
import { AppError } from "../../../utils/AppError.js";

// The external medical and legal bots both expose POST {url}/ask { question } -> { answer }.
export async function ask({ url, timeoutMs, question }) {
  const { data } = await axios.post(
    `${url.replace(/\/+$/, "")}/ask`,
    { question },
    { timeout: timeoutMs, headers: { "Content-Type": "application/json" } }
  );

  const answer = typeof data?.answer === "string" ? data.answer.trim() : "";
  if (!answer) throw new AppError(502, "BOT_BAD_RESPONSE", "The bot did not return an answer");
  return answer;
}
