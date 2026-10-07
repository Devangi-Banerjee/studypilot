"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReplanButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/plan", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(data.error ?? "Replan failed");
    setMsg(
      data.unscheduled.length
        ? `⚠ ${data.unscheduled.length} task(s) don't fit before their deadlines. Consider more daily hours or fewer tasks.`
        : `Planned ${data.scheduledBlocks} study blocks.`,
    );
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={busy}
        className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {busy ? "Replanning…" : "Replan now"}
      </button>
      {msg && <span className="text-sm text-slate-600">{msg}</span>}
    </div>
  );
}