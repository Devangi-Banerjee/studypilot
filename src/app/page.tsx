import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-bold">StudyPilot</h1>
      <p className="text-slate-600">
        Drop in a syllabus. Get a realistic study plan that adapts when life happens.
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("demo", {
            password: process.env.DEMO_PASSWORD,
            redirectTo: "/dashboard",
          });
        }}
      >
        <button className="rounded bg-indigo-600 px-5 py-2.5 text-white">Try the demo account</button>
      </form>
    </main>
  );
}