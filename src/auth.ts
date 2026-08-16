import { cache } from "react";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { siteDb } from "@/lib/site-db";
import { isRateLimited } from "@/lib/rate-limit";
import { resolveEffectiveResourceRoles } from "@/lib/roles";

// Never matches a real password — used to give a lookup for a nonexistent
// nickname the same bcrypt.compare cost as a real one, so response timing
// can't be used to tell which nicknames are actually registered (without
// this, the `if (!user) return null` early-out below skips bcrypt entirely
// for unknown nicknames, and bcrypt is slow enough — cost 10 — for that gap
// to be measurable).
const DUMMY_PASSWORD_HASH = "$2b$10$gQFBKta7QXMjAc25uuO.Gee/1aSZVLO6rGkm2ZVgZtiYxc/GE0J3C";

const { handlers, auth: uncachedAuth, signIn, signOut } = NextAuth({
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
        select: { id: true, isAdmin: true, roles: { select: { roleId: true } } },
      });
      session.user.id = user ? token.id : "";
      session.user.isAdmin = user?.isAdmin ?? false;
      // Resource-roles aren't held directly — a user holds Roles
      // (admin-composed bundles, /admin/roles), and their effective
      // resource-roles are the union across all of them *and* everything
      // those Roles transitively include (resolveEffectiveResourceRoles,
      // src/lib/roles.ts) — flattened into the same flat session.user.roles
      // shape every requireResourceRole(Id)/hasResourceRole check already
      // expects, so nothing downstream of the session needs to know Roles
      // (or their nesting) exist at all.
      session.user.roles = user?.isAdmin
        ? []
        : [...await resolveEffectiveResourceRoles(user?.roles.map((ur) => ur.roleId) ?? [])];
      return session;
    },
  },
});

// Every call in this app is the zero-arg Server Component form, so a plain
// React cache() is enough to dedupe the session()-callback's DB round trip
// across the many independent auth() calls in a single request (layout.tsx,
// the page itself, requireAdmin, ...) — see node_modules/next/dist/docs's
// data-security guide, which recommends exactly this pattern.
export const auth = cache(uncachedAuth);
export { handlers, signIn, signOut };
