import { MessageCircleHeart } from "lucide-react";
import { STARTERS } from "../../lib/chat.js";

export default function Starters({ onPick }) {
  return (
    <div className="px-1 py-6">
      <div className="mb-6 text-center">
        <span className="bg-brand-50 text-brand-600 mx-auto mb-3 grid size-14 place-items-center rounded-3xl">
          <MessageCircleHeart className="size-7" aria-hidden="true" />
        </span>
        <h2 className="font-display text-xl font-semibold text-slate-900">What can I help with?</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
          Ask in your own words, in English or Hindi. Health and legal questions go to specialist
          assistants automatically.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {STARTERS.map(({ pillar, bot, tone, questions }) => (
          <div key={pillar} className="glass p-4">
            <p className={`mb-2.5 text-xs font-bold tracking-wide uppercase ${tone}`}>{pillar}</p>
            <ul className="space-y-1.5">
              {questions.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    onClick={() => onPick(question, bot)}
                    className="focus-ring w-full rounded-xl px-2.5 py-2 text-left text-sm text-slate-700 transition hover:bg-white/80"
                  >
                    {question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
