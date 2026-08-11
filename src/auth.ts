import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { siteDb } from "@/lib/site-db";
import { isRateLimited } from "@/lib/rate-limit";

// Never matches a real password — used to give a lookup for a nonexistent
// nickname the same bcrypt.compare cost as a real one, so response timing
// can't be used to tell which nicknames are actually registered (without
// this, the `if (!user) return null` early-out below skips bcrypt entirely
// for unknown nicknames, and bcrypt is slow enough — cost 10 — for that gap
// to be measurable).
const DUMMY_PASSWORD_HASH = "$2b$10$gQFBKta7QXMjAc25uuO.Gee/1aSZVLO6rGkm2ZVgZtiYxc/GE0J3C";

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
      async authorize(credentials, request) {
        // Rate limit before doing any DB/bcrypt work — this is the one
        // login endpoint in the app and had no throttling at all, unlike
        // every other credential-adjacent route (register, account-link
        // request). Same generic failure (null) either way, so a scripted
        // attacker can't distinguish "rate limited" from "wrong password".
        if (isRateLimited(request, "login", 10, 60_000)) return null;

        const nickname =
          typeof credentials?.nickname === "string" ? credentials.nickname.trim() : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!nickname || !password) return null;

        const user = await siteDb.user.findUnique({ where: { nickname } });
        // Always run bcrypt.compare, even for a nickname that doesn't
        // exist — see DUMMY_PASSWORD_HASH.
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
        if (!user || !valid) return null;

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
      if (!session.user || typeof token.id !== "string") return session;

      // Sessions are stateless JWTs — deleting a user (admin action) doesn't
      // revoke any session already issued to them, since there's no
      // server-side session store to remove it from. Re-checking on every
      // session read instead: once the account is gone, this stops setting
      // `id`, so every `if (!session?.user?.id) redirect(...)` check
      // elsewhere in the app treats them as logged out on their very next
      // request, rather than the old JWT quietly staying "valid" until it
      // expires on its own.
      const user = await siteDb.user.findUnique({
        where: { id: token.id },
        select: { id: true, isAdmin: true },
      });
      session.user.id = user ? token.id : "";
      session.user.isAdmin = user?.isAdmin ?? false;
      return session;
    },
  },
});
