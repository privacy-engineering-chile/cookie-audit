export function getBaseDomain(url: string): string {
  const hostname = new URL(url).hostname;
  return hostname.replace(/^www\./, '');
}

export function isFirstParty(cookieDomain: string, baseDomain: string): boolean {
  return cookieDomain.includes(baseDomain);
}