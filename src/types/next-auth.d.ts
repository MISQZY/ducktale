import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      /** Resource-role keys (e.g. "tickets-edit") held by this user — see src/config/resource-roles.ts. Ignored when isAdmin is true, which bypasses every resource-role check. */
      roles: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
