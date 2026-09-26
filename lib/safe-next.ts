/** Validates in-app redirect paths to prevent open redirects after sign-in. */
export function safeNext(raw: string | null | undefined): string {
  if (typeof raw !== 'string' || raw === '') return '/';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return '/';
  try {
    const probe = new URL(raw, 'http://digestive-diary.invalid');
    if (probe.origin !== 'http://digestive-diary.invalid') return '/';
  } catch {
    return '/';
  }
  return raw;
}
