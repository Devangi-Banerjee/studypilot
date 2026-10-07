"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExtractedTask } from "@/lib/schemas";

type Draft = {
  title: string;
  course: string;
  deadline: string; // "YYYY-MM-DDTHH:mm" local time, matches <input type="datetime-local">
  estimatedMinutes: number;
  weight: number;
  notes: string;
};

export default function ImportForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, patch: Partial<Draft>) =>
    setDrafts((d) => d.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  async function extract() {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("text", text);
      if (file) fd.append("file", file); // don't set Content-Type; the browser adds it
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      setDrafts(
        (data.tasks as ExtractedTask[]).map((t) => ({
          title: t.title,
          course: t.course ?? "",
          deadline: t.deadline ?? "",
          estimatedMinutes: t.estimatedMinutes,
          weight: t.weight,
          notes: t.notes ?? "",
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const invalid = drafts.some(
    (d) => !d.title.trim() || !d.deadline || isNaN(new Date(d.deadline).getTime()),
  );

  async function confirmTasks() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: drafts.map((d) => ({
            title: d.title.trim(),
            course: d.course.trim() || null,
            deadline: new Date(d.deadline).toISOString(), // browser local time to UTC
            estimatedMinutes: Number(d.estimatedMinutes),
            weight: Number(d.weight),
            notes: d.notes || null,
            source: file ? "syllabus" : "text",
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save tasks");
      router.push("/schedule");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  const input = "rounded border border-slate-300 px-2 py-1 text-sm w-full";

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">1. Add your source material</h2>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <textarea
          className={`${input} h-40`}
          placeholder="…or paste a syllabus section, assignment email, or schedule"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={extract}
          disabled={busy || (!file && text.trim().length < 20)}
          className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy && drafts.length === 0 ? "Extracting…" : "Extract tasks"}
        </button>
      </section>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {drafts.length > 0 && (
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">2. Review and edit ({drafts.length} tasks found)</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th>Title</th>
                  <th>Course</th>
                  <th>Deadline</th>
                  <th>Minutes</th>
                  <th>Weight</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {drafts.map((d, i) => (
                  <tr key={i} className="align-top">
                    <td className="p-1">
                      <input className={input} value={d.title} onChange={(e) => update(i, { title: e.target.value })} />
                    </td>
                    <td className="p-1">
                      <input className={input} value={d.course} onChange={(e) => update(i, { course: e.target.value })} />
                    </td>
                    <td className="p-1">
                      <input
                        type="datetime-local"
                        className={`${input} ${!d.deadline ? "border-red-400" : ""}`}
                        value={d.deadline}
                        onChange={(e) => update(i, { deadline: e.target.value })}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        min={15}
                        max={1200}
                        className={input}
                        value={d.estimatedMinutes}
                        onChange={(e) => update(i, { estimatedMinutes: Number(e.target.value) })}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        className={input}
                        value={d.weight}
                        onChange={(e) => update(i, { weight: Number(e.target.value) })}
                      />
                    </td>
                    <td className="p-1">
                      <button className="text-red-600" onClick={() => setDrafts((x) => x.filter((_, k) => k !== i))}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invalid && (
            <p className="text-sm text-amber-700">
              Fill in every title and deadline (red boxes) to continue.
            </p>
          )}
          <button
            onClick={confirmTasks}
            disabled={busy || invalid}
            className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Confirm & build my plan"}
          </button>
        </section>
      )}
    </div>
  );
}