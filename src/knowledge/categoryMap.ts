export type NormalizedCookieCategory =
  | 'necessary'
  | 'functional'
  | 'analytics'
  | 'advertisement'
  | 'security'
  | 'other';

export function normalizeCategory(category?: string): NormalizedCookieCategory {
  const c = category?.toLowerCase();

  if (!c) return 'other';

  if (c.includes('necessary')) return 'necessary';
  if (c.includes('analytics')) return 'analytics';
  if (c.includes('marketing')) return 'advertisement';
  if (c.includes('advertisement')) return 'advertisement';
  if (c.includes('preference')) return 'functional';
  if (c.includes('security')) return 'security';

  return 'other';
}