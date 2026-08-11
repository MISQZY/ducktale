"use server";

import { revalidatePath } from "next/cache";
import { requireAdminId } from "@/lib/admin";
import { readContentFileIfExists } from "@/lib/admin-content";
import { buildRelPath, isKnownServer, isSafeSlug, isValidLocale } from "@/lib/content-tree";
import { compileMdxPreview, type MdxPreviewResult } from "@/lib/mdx-preview";
import { REPO } from "@/config/site";
import {
  getBranchSha, createBranch, getFileSha, getFileContent, putFileContent, deleteFileContent, createPullRequest,
} from "@/lib/github-content";

export async function previewContent(source: string): Promise<MdxPreviewResult> {
  await requireAdminId();
  return compileMdxPreview(source);
}

/** Structural validation only — save/delete no longer require the file to already exist locally, since GitHub's Contents API handles create-vs-update transparently based on whether a sha is supplied. */
function validateTarget(server: string, locale: string, slug: string): void {
  if (!isKnownServer(server)) throw new Error("Unknown server");
  if (!isValidLocale(locale)) throw new Error("Unknown locale");
  if (!isSafeSlug(slug)) throw new Error("Invalid file path");
}

export interface LoadContentInput {
  server: string;
  locale: string;
  slug: string;
}

export async function loadContentFile(input: LoadContentInput): Promise<{ content: string | null }> {
  await requireAdminId();
  validateTarget(input.server, input.locale, input.slug);

  const relPath = buildRelPath(input.server, input.locale, input.slug);
  const content = await readContentFileIfExists(relPath);
  return { content };
}

// Server Actions are directly callable via POST, not just through this
// app's own UI (see node_modules/next/dist/docs's own server-actions
// guide) — every action below that accepts a `branch` back from the client
// has to treat it as untrusted input, not just "whatever the client
// remembered from a previous response". Without this check, passing
// branch: REPO.branch (e.g. "master") would make save/delete/revert commit
// straight to it, skipping the whole point of the branch+PR flow.
const SESSION_BRANCH_PATTERN = /^admin-content\/\d+$/;

function assertSessionBranch(branch: string): void {
  if (branch === REPO.branch || !SESSION_BRANCH_PATTERN.test(branch)) {
    throw new Error("Invalid session branch");
  }
}

/**
 * Save and "open a PR" are deliberately separate actions (see
 * createContentPullRequest below) — this lets one PR bundle edits across
 * several files: every save reuses the same session branch (passed back as
 * `branch`) instead of opening a new PR each time, so the admin can work
 * through a batch of pages and open a single PR once they're done.
 */
async function ensureBranch(existing: string | undefined): Promise<string> {
  if (existing) {
    assertSessionBranch(existing);
    return existing;
  }
  const baseSha = await getBranchSha(REPO.branch);
  const branch = `admin-content/${Date.now()}`;
  await createBranch(branch, baseSha);
  return branch;
}

export interface SaveContentInput {
  lang: string;
  server: string;
  locale: string;
  slug: string;
  content: string;
  message: string;
  /** Pass back the branch from an earlier save/delete in the same session to commit onto it instead of starting a new one. */
  branch?: string;
}

export interface SaveContentResult {
  branch: string;
}

export async function saveContentFile(input: SaveContentInput): Promise<SaveContentResult> {
  await requireAdminId();
  validateTarget(input.server, input.locale, input.slug);
  const relPath = buildRelPath(input.server, input.locale, input.slug);

  const branch = await ensureBranch(input.branch);
  const message = input.message.trim() || `Update ${relPath}`;
  const sha = await getFileSha(relPath, branch);
  await putFileContent({ filePath: relPath, content: input.content, message, branch, sha });

  revalidatePath(`/${input.lang}/admin/content`);
  return { branch };
}

export interface DeleteContentInput {
  lang: string;
  server: string;
  locale: string;
  slug: string;
  message: string;
  branch?: string;
}

export interface DeleteContentResult {
  branch: string;
}

export async function deleteContentFile(input: DeleteContentInput): Promise<DeleteContentResult> {
  await requireAdminId();
  validateTarget(input.server, input.locale, input.slug);
  const relPath = buildRelPath(input.server, input.locale, input.slug);

  const branch = await ensureBranch(input.branch);
  const message = input.message.trim() || `Delete ${relPath}`;
  const sha = await getFileSha(relPath, branch);
  if (!sha) throw new Error("File does not exist on the target branch");
  await deleteFileContent({ filePath: relPath, message, branch, sha });

  revalidatePath(`/${input.lang}/admin/content`);
  return { branch };
}

export interface RevertContentInput {
  lang: string;
  server: string;
  locale: string;
  slug: string;
  /** The session branch to revert the change on. */
  branch: string;
}

/**
 * Undoes one file's change on the session branch — the "X" next to a
 * changed file in the admin UI. The change is already a real commit, so
 * this can't just drop it from a list client-side: it has to commit the
 * opposite change onto the same branch. If the file existed on the base
 * branch, that restores its original content; if it didn't (the file was
 * created in this session), there's no "original" to restore, so this
 * removes it from the branch instead.
 */
export async function revertContentFile(input: RevertContentInput): Promise<void> {
  await requireAdminId();
  validateTarget(input.server, input.locale, input.slug);
  assertSessionBranch(input.branch);
  const relPath = buildRelPath(input.server, input.locale, input.slug);

  const [base, currentSha] = await Promise.all([
    getFileContent(relPath, REPO.branch),
    getFileSha(relPath, input.branch),
  ]);

  if (base) {
    await putFileContent({
      filePath: relPath,
      content: base.content,
      message: `Revert ${relPath}`,
      branch: input.branch,
      sha: currentSha,
    });
  } else if (currentSha) {
    await deleteFileContent({
      filePath: relPath,
      message: `Revert ${relPath}`,
      branch: input.branch,
      sha: currentSha,
    });
  }

  revalidatePath(`/${input.lang}/admin/content`);
}

export interface CreateContentPullRequestInput {
  lang: string;
  branch: string;
  title: string;
  /** Repo-relative paths changed in this session, listed in the PR body. */
  files: string[];
}

export interface CreateContentPullRequestResult {
  prUrl: string;
}

/** Opens the PR for a session's branch — separate from save/delete so several file changes can land in one PR. Safe to call once per branch (GitHub itself rejects a second PR for the same branch). */
export async function createContentPullRequest(
  input: CreateContentPullRequestInput
): Promise<CreateContentPullRequestResult> {
  await requireAdminId();
  if (!input.branch) throw new Error("No changes to open a PR for yet");
  assertSessionBranch(input.branch);

  const title = input.title.trim() || `Update content (${input.files.length} ${input.files.length === 1 ? "file" : "files"})`;
  const fileList = input.files.map((f) => `- \`${f}\``).join("\n") || "- (see commits)";
  const pr = await createPullRequest({
    title,
    head: input.branch,
    base: REPO.branch,
    body: `Отредактировано через админ-панель сайта.\n\nФайлы:\n${fileList}`,
  });

  revalidatePath(`/${input.lang}/admin/content`);
  return { prUrl: pr.html_url };
}
