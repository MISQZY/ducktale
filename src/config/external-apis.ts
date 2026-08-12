/**
 * Centralized third-party API endpoints and URL builders.
 *
 * These base URLs and link-building helpers were previously duplicated as
 * raw string literals across several unrelated files (github.ts, Authors.tsx,
 * GitHubLastModified.tsx, useModrinth.ts, ResourceCard.tsx, mcsrvstat.ts).
 * Keep every external host/path pattern here so a change only needs one edit.
 */

export const EXTERNAL_APIS = {
  github: {
    apiBase: "https://api.github.com",
    profileUrl: (username: string) => `https://github.com/${username}`,
    avatarUrl: (username: string, size = 64) =>
      `https://github.com/${username}.png?size=${size}`,
  },
  modrinth: {
    apiBase: "https://api.modrinth.com/v2",
    projectUrl: (slug: string) => `https://modrinth.com/project/${slug}`,
  },
  mcsrvstat: {
    pingUrl: (host: string) => `https://api.mcsrvstat.us/3/${host}`,
  },
  uiAvatars: {
    /** Fallback avatar used when a GitHub avatar 404s. */
    fallbackUrl: (name: string) =>
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
  },
  legacy_skin: {
    /** Full 64×64 skin texture for a real Mojang username — swap this one line for a different skin-rendering service (e.g. crafatar) if minotar.net ever needs replacing. */
    skinUrl: (name: string) => `https://minotar.net/skin/${encodeURIComponent(name)}`,
  },
} as const;
