/** Append UTM params to external URLs for outbound link tracking. */
export function appendUtmParams(url: string, campaign = 'outbound'): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return url;
    if (parsed.hostname === 'localhost' || parsed.hostname.endsWith('.local')) return url;
    if (!parsed.searchParams.has('utm_source')) {
      parsed.searchParams.set('utm_source', 'digestive-diary');
    }
    if (!parsed.searchParams.has('utm_medium')) {
      parsed.searchParams.set('utm_medium', 'app');
    }
    if (!parsed.searchParams.has('utm_campaign')) {
      parsed.searchParams.set('utm_campaign', campaign);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
