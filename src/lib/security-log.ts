/** Never pass raw exceptions, provider response bodies, URLs, emails or tokens here. */
export function securityLog(
  code:
    | 'request_failed'
    | 'email_failed'
    | 'cms_failed'
    | 'mdx_failed'
    | 'lease_cleanup_failed',
) {
  console.warn(JSON.stringify({ code }));
}
const sensitive =
  /authorization|cookie|password|secret|token|email|body|query_string|data|user/i;
export function redactTelemetry<T>(value: T): T {
  const walk = (v: unknown, depth: number): unknown => {
    if (depth > 12) return '[Truncated]';
    if (typeof v === 'string')
      return v
        .replace(/(?:postgres(?:ql)?|rediss?):\/\/[^\s"<>]+/gi, '[connection]')
        .replace(
          /\b(password|secret|token|api[_-]?key|session)\s*[:=]\s*[^\s,;&]+/gi,
          '$1=[Redacted]',
        )
        .replace(/https?:\/\/[^\s"<>]+/g, (url) => url.split(/[?#]/)[0])
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
        .replace(/\b(Bearer\s+)[^\s]+/gi, '$1[redacted]');
    if (Array.isArray(v)) return v.map((x) => walk(x, depth + 1));
    if (v && typeof v === 'object')
      return Object.fromEntries(
        Object.entries(v).map(([k, x]) => [
          k,
          sensitive.test(k) ? '[Redacted]' : walk(x, depth + 1),
        ]),
      );
    return v;
  };
  return walk(value, 0) as T;
}
