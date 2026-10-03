import { useState } from "react";
import { Check, Copy, Download, FileText } from "lucide-react";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { useToast } from "../../context/toastContext.js";

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

export default function DraftPreview({ draft, loading }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(draft.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Select the text and copy it manually.");
    }
  }

  function onDownload() {
    const blob = new Blob([draft.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(draft.title)}.txt`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Draft downloaded.");
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!draft) {
    return (
      <EmptyState
        icon={FileText}
        title="Your draft will appear here"
        description="Fill in the form and generate it. You can copy it, download it, or print it to take to the station or committee."
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm font-semibold text-slate-800">{draft.title}</p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={onCopy}>
            {copied ? (
              <>
                <Check className="size-4 text-emerald-600" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4" aria-hidden="true" />
                Copy
              </>
            )}
          </Button>
          <Button variant="secondary" size="sm" onClick={onDownload}>
            <Download className="size-4" aria-hidden="true" />
            Download
          </Button>
        </div>
      </div>

      {/* Document-style panel: white paper, serif-ish mono for the body so it reads as a letter. */}
      <div className="max-h-[32rem] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-inner sm:p-7">
        <pre className="font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-slate-800">
          {draft.text}
        </pre>
      </div>
    </div>
  );
}
