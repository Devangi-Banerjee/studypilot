import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  return (
    <div className="mx-auto max-w-6xl p-4">
      <nav className="mb-6 flex items-center gap-5 border-b pb-3 text-sm">
        <span className="font-bold">StudyPilot</span>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/import">Import</Link>
        <Link href="/tasks">Tasks</Link>
        <Link href="/schedule">Schedule</Link>
        <form
          className="ml-auto"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="text-slate-500">Sign out</button>
        </form>
      </nav>
      {children}
    </div>
  );
}