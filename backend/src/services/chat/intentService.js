import { escapeRegex } from "../../utils/escapeRegex.js";

// Keyword routing, English plus commonly typed Hindi (Roman script). Deliberately simple and
// readable: the external RAG bots do the real understanding, this only decides where to send it.
const INTENT_KEYWORDS = {
  safety: [
    "unsafe", "safety", "stalking", "stalker", "being followed", "following me", "harassing me",
    "threat", "threatened", "danger", "dangerous", "sos", "scared", "afraid", "suraksha", "khatra",
    "peecha", "dhamki",
  ],
  health: [
    "period", "periods", "menstrual", "menstruation", "cramps", "pms", "pcos", "pcod", "ovulation",
    "fertility", "pregnant", "pregnancy", "contraception", "contraceptive", "abortion", "miscarriage",
    "discharge", "bleeding", "breast", "thyroid", "anemia", "anaemia", "iron deficiency", "uti",
    "infection", "fever", "nausea", "doctor", "medicine", "tablet", "symptom", "symptoms", "vaccine",
    "menopause", "mahavari", "mahina", "dard", "bukhar", "dawa", "garbh", "pet dard",
    // The indexed reference is a general medical encyclopedia, not only women's health.
    "disease", "syndrome", "diagnosis", "treatment", "cure", "rash", "cough", "headache",
    "migraine", "vomiting", "diarrhoea", "diarrhea", "allergy", "allergic", "diabetes",
    "asthma", "cancer", "tumour", "tumor", "ulcer", "kidney", "liver", "lungs", "blood pressure",
    "cholesterol", "antibiotic", "virus", "viral", "bacteria", "bacterial", "swelling",
    "wound", "prescription", "surgery", "insulin", "injection", "pain",
  ],
  legal: [
    "law", "legal", "lawyer", "advocate", "fir", "police complaint", "court", "rights", "harassment",
    "posh", "dowry", "divorce", "maintenance", "alimony", "domestic violence", "complaint", "case",
    "section", "act", "custody", "property rights", "inheritance", "kanoon", "kanooni", "adalat",
    "talaq", "dahej", "shikayat", "muqadma", "vakil",
  ],
  career: [
    "job", "jobs", "career", "resume", "cv", "interview", "salary", "scholarship", "internship",
    "returnship", "employment", "promotion", "appraisal", "hiring", "vacancy", "maternity leave",
    "work from home", "naukri", "vetan", "chhatravritti", "rozgar",
  ],
};

// An emergency is acted on regardless of which intent wins, so this list is separate.
const EMERGENCY_KEYWORDS = [
  "bachao", "bacha o", "madad", "madad karo", "help me", "save me", "being followed",
  "someone is following", "following me", "attacked", "attacking me", "attack", "rape", "raped",
  "molest", "molested", "kidnap", "kidnapped", "abducted", "threatening me", "beating me",
  "hitting me", "hurt me", "maar raha", "maar rahe", "pit raha", "khatre mein", "jaan khatre",
  "emergency", "unsafe right now", "trapped", "locked in", "bleeding heavily",
];

// Clinical words the list above will never enumerate: route anything with a medical ending
// (glomerulonephritis, thrombosis, neuropathy, appendectomy) to the medical bot.
const MEDICAL_MORPHOLOGY = /\b\w{4,}(?:itis|osis|iasis|a?emia|opathy|ectomy|otomy|ostomy|algia|plasia)\b/i;

const ESCAPED = new Map();
function matcher(keyword) {
  if (!ESCAPED.has(keyword)) {
    const escaped = escapeRegex(keyword);
    // Whole-word match for single words; phrases are matched as-is.
    ESCAPED.set(keyword, keyword.includes(" ") ? new RegExp(escaped, "i") : new RegExp(`\\b${escaped}\\b`, "i"));
  }
  return ESCAPED.get(keyword);
}

const countMatches = (text, keywords) => keywords.filter((keyword) => matcher(keyword).test(text)).length;

export function detect(content) {
  const text = String(content ?? "").toLowerCase();
  const emergency = EMERGENCY_KEYWORDS.some((keyword) => matcher(keyword).test(text));

  const scores = Object.entries(INTENT_KEYWORDS)
    .map(([intent, keywords]) => ({
      intent,
      score: countMatches(text, keywords) + (intent === "health" && MEDICAL_MORPHOLOGY.test(text) ? 1 : 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  // An emergency with no clear topic is a safety matter.
  if (scores.length === 0) return { intent: emergency ? "safety" : "general", emergency };
  return { intent: scores[0].intent, emergency };
}

export const BOT_FOR_INTENT = { health: "medical", legal: "legal" };

// `auto` maps health to the medical bot and legal to the legal bot; everything else to general.
export const routeToBot = (intent, requestedBot = "auto") =>
  requestedBot !== "auto" ? requestedBot : (BOT_FOR_INTENT[intent] ?? "general");
