import { createReadStream } from "fs";
import { Readable } from "stream";

/**
 * Serves a file from disk with HTTP Range support (206 Partial Content) —
 * required for <video> seeking to work at all, and for Safari/iOS, which
 * probes with a Range request before it will start playback. Shared by every
 * attachment download route (tickets/reports/applications/threads); only the
 * SAFE_CONTENT_TYPES allowlist and access-control checks stay per-route (see
 * those routes' own doc comments for why that part isn't shared too).
 */
export function serveAttachmentFile(
  req: Request,
  filePath: string,
  fileSize: number,
  contentType: string,
  disposition: "inline" | "attachment",
  filename: string
): Response {
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Content-Disposition", `${disposition}; filename="${encodeURIComponent(filename)}"`);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Accept-Ranges", "bytes");

  const range = req.headers.get("range")?.trim();
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;

  if (!match || (!match[1] && !match[2])) {
    headers.set("Content-Length", fileSize.toString());
    return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, { status: 200, headers });
  }

  // A suffix range (`bytes=-500`, last 500 bytes) has no start; everything
  // else clamps a missing/out-of-bounds end to the last byte of the file.
  const start = match[1] ? parseInt(match[1], 10) : Math.max(0, fileSize - parseInt(match[2], 10));
  const end = match[1] && match[2] ? Math.min(parseInt(match[2], 10), fileSize - 1) : fileSize - 1;

  if (start >= fileSize || start > end) {
    headers.set("Content-Range", `bytes */${fileSize}`);
    return new Response(null, { status: 416, headers });
  }

  headers.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
  headers.set("Content-Length", (end - start + 1).toString());
  return new Response(Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream, {
    status: 206,
    headers,
  });
}
