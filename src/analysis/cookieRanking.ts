import { CookieDTO } from '../types';

export type CookieDuration = {
  name: string;
  domain: string;
  days: number;
};

function getDaysUntilExpiry(expires: number): number {
  if (expires === -1) return 0;

  const now = Date.now();
  const expiryMs = expires * 1000;

  const diff = expiryMs - now;
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function getTopPersistentCookies(
  cookies: CookieDTO[],
  limit: number = 5
): CookieDuration[] {
  return cookies
    .filter(c => c.expires !== -1) // ❌ excluir session cookies
    .map(c => ({
      name: c.name,
      domain: c.domain,
      days: getDaysUntilExpiry(c.expires)
    }))
    .filter(c => c.days > 0)
    .sort((a, b) => b.days - a.days)
    .slice(0, limit);
}