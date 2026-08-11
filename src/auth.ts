import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { siteDb } from "@/lib/site-db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Credentials-based auth isn't persisted by an Adapter, so sessions must
  // be JWT-based (Auth.js requires this for the Credentials provider).
  session: { strategy: "jwt" },
  // Self-hosted behind a reverse proxy (see docker-compose.yml/Caddyfile),
  // not on Vercel — Auth.js needs this to trust the forwarded host/proto.
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        nickname: { label: "Nickname" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const nickname =
          typeof credentials?.nickname === "string" ? credentials.nickname.trim() : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!nickname || !password) return null;

        const user = await siteDb.user.findUnique({ where: { nickname } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.nickname };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
