/**
 * Extract a user-meaningful error message from an axios/HTTP error.
 *
 * Most provider APIs (Kie, WaveSpeed, Topaz, Fal, PiAPI, Runware) put the real
 * cause in the response body — e.g. "Insufficient credits", "Invalid input",
 * field validation messages — but axios surfaces only "Request failed with
 * status code 400" via `error.message`. That generic string then propagates
 * up to the worker and ends up in the user-visible "tokens refunded" notice,
 * making it impossible for users (or operators reading worker logs) to know
 * what actually went wrong.
 *
 * Pass the original error and a short provider prefix; get back a string
 * suitable for `throw new Error(extractProviderError(err, 'WaveSpeed'))`.
 */
export function extractProviderError(error: any, prefix: string): string {
  const body = error?.response?.data;
  let reason: string | undefined;

  if (typeof body === 'string' && body.trim()) {
    reason = body.trim();
  } else if (body && typeof body === 'object') {
    // Common message fields across providers
    reason = body.message || body.error || body.msg || body.detail || body.error_message;
    // Topaz-style: { errors: [{ msg, path }] }
    if (!reason && Array.isArray(body.errors) && body.errors.length) {
      reason = body.errors
        .map((e: any) => e?.msg || e?.message || JSON.stringify(e))
        .filter(Boolean)
        .join('; ');
    }
    // Fallback: short JSON dump so at least something useful surfaces
    if (!reason) {
      reason = JSON.stringify(body).slice(0, 300);
    }
  }

  reason = reason || error?.message || 'Unknown error';
  return `${prefix}: ${reason}`;
}
