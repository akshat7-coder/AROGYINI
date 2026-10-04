import { useCallback, useState } from "react";
import { Bot, CheckCircle2, Plug, XCircle } from "lucide-react";
import Card, { CardHeader } from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import * as adminApi from "../../api/admin.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useToast } from "../../context/toastContext.js";
import { BOT_META } from "../../lib/chat.js";

function BotRow({ bot, onChanged }) {
  const toast = useToast();
  const [url, setUrl] = useState(bot.url ?? "");
  const [timeoutMs, setTimeoutMs] = useState(String(bot.timeoutMs ?? 30000));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const dirty = url !== (bot.url ?? "") || timeoutMs !== String(bot.timeoutMs ?? 30000);
  const meta = BOT_META[bot.key];

  async function patch(payload, setBusy) {
    setBusy(true);
    setErrors({});
    try {
      await adminApi.updateBot(bot.key, payload);
      toast.success(`${meta?.label ?? bot.key} updated.`);
      onChanged();
    } catch (error) {
      const fieldErrors = error.fieldErrors ?? {};
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function onTest() {
    setTesting(true);
    setResult(null);
    try {
      setResult(await adminApi.testBot(bot.key));
    } catch (error) {
      setResult({ ok: false, error: error.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`size-2 rounded-full ${meta?.dot ?? "bg-slate-400"}`} aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-800">{bot.name}</p>
            <Badge tone={bot.enabled ? "success" : "neutral"}>
              {bot.enabled ? "enabled" : "disabled"}
            </Badge>
            <Badge tone={bot.source === "database" ? "info" : "neutral"}>{bot.source}</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {bot.key === "general"
              ? "Uses the OpenAI-compatible LLM. With no API key it falls back to a built-in answer."
              : "External RAG bot, called at POST {url}/ask."}
          </p>
        </div>

        <label className="flex shrink-0 cursor-pointer items-center gap-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={bot.enabled}
            disabled={toggling}
            onChange={(event) => patch({ enabled: event.target.checked }, setToggling)}
            className="accent-brand-600 focus-ring size-4"
          />
          Enabled
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Input
          label="URL"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          error={errors.url}
          placeholder="http://localhost:5000"
        />
        <Input
          label="Timeout (ms)"
          type="number"
          min="1000"
          max="120000"
          value={timeoutMs}
          onChange={(event) => setTimeoutMs(event.target.value)}
          error={errors.timeoutMs}
          className="font-mono sm:w-36"
        />
        <div className="flex gap-2">
          <Button
            size="md"
            disabled={!dirty}
            loading={saving}
            onClick={() => patch({ url: url.trim(), timeoutMs: Number(timeoutMs) }, setSaving)}
          >
            Save
          </Button>
          <Button variant="secondary" size="md" loading={testing} onClick={onTest}>
            <Plug className="size-4" aria-hidden="true" />
            Test
          </Button>
        </div>
      </div>

      {result ? (
        <div
          className={`mt-3 flex items-start gap-2.5 rounded-2xl border p-3.5 text-sm
            ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}
          role="status"
        >
          {result.ok ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
          ) : (
            <XCircle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="font-semibold">
              {/* ready === false means it answered /health but its index is not built yet. */}
              {result.ok ? "Responded" : result.ready === false ? "Responded, but not ready" : "Did not respond"}
              {result.latencyMs === undefined ? null : (
                <span className="tnum font-mono ml-2 font-normal">{result.latencyMs} ms</span>
              )}
            </p>
            {result.preview ? <p className="mt-0.5 truncate">{result.preview}</p> : null}
            {result.error ? <p className="mt-0.5">{result.error}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function BotsPanel() {
  const load = useCallback(() => adminApi.listBots(), []);
  const { data, loading, error, reload } = useAsync(load);
  const bots = data?.bots ?? [];

  return (
    <Card as="section">
      <CardHeader
        title="Assistants"
        description="A disabled bot falls back to the general assistant. Edits here override the deployed configuration."
        icon={Bot}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          {error.message}
        </p>
      ) : (
        <div className="space-y-3">
          {bots.map((bot) => (
            <BotRow key={bot.key} bot={bot} onChanged={reload} />
          ))}
        </div>
      )}
    </Card>
  );
}
