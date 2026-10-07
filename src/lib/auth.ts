import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { redirect } from "next/navigation";
import { db } from "./db";

export const DEMO_EMAIL = "demo@studypilot.app";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: { password: { type: "password" } },
      async authorize(creds) {
        const pw = process.env.DEMO_PASSWORD;
        if (!pw || creds?.password !== pw) return null;
        return db.user.upsert({
          where: { email: DEMO_EMAIL },
          update: {},
          create: { email: DEMO_EMAIL, name: "Demo Student" },
        });
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
  pages: { signIn: "/" },
});

/** For server pages: returns the user id, or sends the visitor to "/". */
export async function currentUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  return session.user.id;
}