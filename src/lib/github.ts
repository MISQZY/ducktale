/**
 * GitHub API helpers for fetching commit metadata.
 *
 * We rely on Next.js `fetch` caching (next.revalidate) instead of a manual
 * in-memory Map. The Map approach breaks in serverless / edge environments
 * because each cold-start gets a fresh module scope, so the cache is empty
 * on every request. Next.js fetch-cache persists across invocations correctly.
 */

interface GitHubAuthor {
  date: string;
  name: string;
}

interface GitHubAvatarAuthor {
  login: string;
  avatar_url: string;
}

interface GitHubCommit {
  commit: { author: GitHubAuthor };
  author?: GitHubAvatarAuthor;
}

export interface LastModifiedResult {
  date: Date;
  author: GitHubAvatarAuthor | undefined;
  authorName: string;
}

/** Revalidation window in seconds (1 hour). */
const REVALIDATE_SECONDS = 3_600;

export async function fetchLastModified(
  filePath: string
): Promise<LastModifiedResult | null> {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!repo) {
    console.warn("[github] GITHUB_REPO env var is not set");
    return null;
  }

  const url = `https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(filePath)}&per_page=1`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    // next.revalidate handles caching at the CDN/Next.js level — no manual Map needed.
    const res = await fetch(url, {
      headers,
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      console.warn(`[github] API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data: GitHubCommit[] = await res.json();
    if (!data.length) return null;

    return {
      date:       new Date(data[0].commit.author.date),
      author:     data[0].author,
      authorName: data[0].author?.login ?? data[0].commit.author.name,
    };
  } catch (e) {
    console.warn("[github] fetch failed:", e);
    return null;
  }
}
