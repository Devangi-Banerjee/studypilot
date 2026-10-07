"use client";
import { useRouter } from "next/navigation";

export default function TaskActions({ id, done }: { id: string; done: boolean }) {
  const router = useRouter();

  async function call(method: "PATCH" | "DELETE", body?: object) {
    const res = await fetch(`/api/tasks/${id}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Request failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-3 text-sm">
      <button className="text-emerald-700" onClick={() => call("PATCH", { status: done ? "TODO" : "DONE" })}>
        {done ? "Reopen" : "Mark done"}
      </button>
      <button className="text-red-600" onClick={() => confirm("Delete this task?") && call("DELETE")}>
        Delete
      </button>
    </div>
  );
}