export const BOT_META = {
  medical: { label: "Medical", tone: "bg-rose-50 text-rose-700", dot: "bg-health" },
  legal: { label: "Legal", tone: "bg-indigo-50 text-indigo-700", dot: "bg-legal" },
  general: { label: "General", tone: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  fallback: { label: "Offline answer", tone: "bg-amber-50 text-amber-800", dot: "bg-amber-400" },
};

export const STARTERS = [
  {
    pillar: "Health",
    bot: "medical",
    tone: "text-rose-700",
    questions: [
      "My period is ten days late. What could be going on?",
      "What actually helps with bad period cramps?",
      "What are the early signs of PCOS?",
    ],
  },
  {
    pillar: "Legal",
    bot: "legal",
    tone: "text-indigo-700",
    questions: [
      "How do I file a POSH complaint at work?",
      "What is a Zero FIR and when can I ask for one?",
      "My in-laws are demanding dowry. What can I do?",
    ],
  },
  {
    pillar: "Career",
    bot: "general",
    tone: "text-teal-800",
    questions: [
      "How do I explain a two year career break in an interview?",
      "Which returnship programmes take women in tech?",
      "What maternity leave am I entitled to?",
    ],
  },
  {
    pillar: "Safety",
    bot: "general",
    tone: "text-rose-800",
    questions: [
      "Someone is following me home. What should I do?",
      "How do I report online harassment in India?",
      "What should I keep ready in case of an emergency?",
    ],
  },
];

export const MAX_MESSAGE_LENGTH = 2000;

export const formatLatency = (ms) =>
  ms === undefined || ms === null ? null : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
