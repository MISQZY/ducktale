/**
 * Write-capable GitHub API helpers, used only by the admin content editor to
 * commit documentation edits as a branch + pull request. Kept separate from
 * the read-only, gracefully-degrading helpers in github.ts — a missing
 * GITHUB_TOKEN here is a hard error (there's no sensible fallback for a
 * write), not a silent "skip this widget" like fetchLastModified().
 */

import { REPO } from "@/config/site";
import { EXTERNAL_APIS } from "@/config/external-apis";

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is not set — add a GitHub personal access token with " +
        "Contents + Pull requests write access to this repo in .env to enable saving from the admin panel."
    );
  }
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubApi<T>(apiPath: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${EXTERNAL_APIS.github.apiBase}${apiPath}`, {
    ...init,
    headers: { ...authHeaders(), "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

export async function getBranchSha(branch: string): Promise<string> {
  const data = await githubApi<{ object: { sha: string } }>(
    `/repos/${REPO.slug}/git/ref/heads/${encodeURIComponent(branch)}`
  );
  return data.object.sha;
}

export async function createBranch(branch: string, fromSha: string): Promise<void> {
  await githubApi(`/repos/${REPO.slug}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: fromSha }),
  });
}

/** undefined if the file doesn't exist yet on this ref (a brand-new page). */
export async function getFileSha(filePath: string, ref: string): Promise<string | undefined> {
  try {
    const data = await githubApi<{ sha: string }>(
      `/repos/${REPO.slug}/contents/${filePath}?ref=${encodeURIComponent(ref)}`
    );
    return data.sha;
  } catch {
    return undefined;
  }
}

/** Content + sha as they exist on a given ref — used to restore a file's original content when reverting a session change. undefined if the file doesn't exist on that ref. */
export async function getFileContent(filePath: string, ref: string): Promise<{ content: string; sha: string } | undefined> {
  try {
    const data = await githubApi<{ sha: string; content: string; encoding: string }>(
      `/repos/${REPO.slug}/contents/${filePath}?ref=${encodeURIComponent(ref)}`
    );
    return { content: Buffer.from(data.content, data.encoding as BufferEncoding).toString("utf8"), sha: data.sha };
  } catch {
    return undefined;
  }
}

export async function putFileContent(params: {
  filePath: string;
  content: string;
  message: string;
  branch: string;
  sha?: string;
}): Promise<void> {
  await githubApi(`/repos/${REPO.slug}/contents/${params.filePath}`, {
    method: "PUT",
    body: JSON.stringify({
      message: params.message,
      content: Buffer.from(params.content, "utf8").toString("base64"),
      branch: params.branch,
      sha: params.sha,
    }),
  });
}

export async function deleteFileContent(params: {
  filePath: string;
  message: string;
  branch: string;
  sha: string;
}): Promise<void> {
  await githubApi(`/repos/${REPO.slug}/contents/${params.filePath}`, {
    method: "DELETE",
    body: JSON.stringify({
      message: params.message,
      sha: params.sha,
      branch: params.branch,
    }),
  });
}

export async function createPullRequest(params: {
  title: string;
  head: string;
  base: string;
  body: string;
}): Promise<{ html_url: string }> {
  return githubApi(`/repos/${REPO.slug}/pulls`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}
