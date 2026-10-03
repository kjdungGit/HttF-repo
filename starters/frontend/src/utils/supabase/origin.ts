/** Next.js may use its bind address in request.url; the Host header is the browser-facing authority. */
export function isSameOrigin(request: Request) {
 const origin = request.headers.get("origin");
 if (!origin) return true;
 try {
  const supplied = new URL(origin);
  const expectedHost = request.headers.get("host") ?? new URL(request.url).host;
  return ["http:", "https:"].includes(supplied.protocol) && supplied.host === expectedHost && supplied.origin === origin;
 } catch { return false; }
}
