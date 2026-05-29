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

const cache = new Map<string, { data: LastModifiedResult | null; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 час

export async function fetchLastModified(filePath: string): Promise<LastModifiedResult | null> {
  const cached = cache.get(filePath);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!repo) {
    console.warn("[GitHubLastModified] GITHUB_REPO env var is not set");
    cache.set(filePath, { data: null, timestamp: Date.now() });
    return null;
  }

  const url = `https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(filePath)}&per_page=1`;

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!res.ok) {
      console.warn(`[GitHubLastModified] GitHub API error: ${res.status} ${res.statusText}`);
      cache.set(filePath, { data: null, timestamp: Date.now() });
      return null;
    }
    const data: GitHubCommit[] = await res.json();
    if (!data.length) {
      cache.set(filePath, { data: null, timestamp: Date.now() });
      return null;
    }
    
    const result: LastModifiedResult = {
      date: new Date(data[0].commit.author.date),
      author: data[0].author,
      authorName: data[0].author?.login || data[0].commit.author.name,
    };

    cache.set(filePath, { data: result, timestamp: Date.now() });
    return result;
  } catch (e) {
    console.warn("[GitHubLastModified] fetch failed:", e);
    cache.set(filePath, { data: null, timestamp: Date.now() });
    return null;
  }
}
