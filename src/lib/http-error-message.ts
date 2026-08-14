/**
 * Turns an HTTP status (or a failed fetch with no response at all) into a
 * translation key under the shared `Common.errors` namespace — callers
 * still own how/where they show it, this just picks the right reason.
 * `status: 0` stands in for "the request never got a response" (offline,
 * DNS, CORS, etc.), which never comes from a real HTTP status code.
 */
export function httpErrorKey(status: number): string {
  if (status === 0) return "errors.network";
  if (status === 429) return "errors.rateLimited";
  if (status >= 500) return "errors.serverError";
  if (status === 404) return "errors.notFound";
  return "errors.generic";
}
