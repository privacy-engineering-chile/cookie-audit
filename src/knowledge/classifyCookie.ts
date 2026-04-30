import cookiesDb from '../db/cookie.json';
import { normalizeCategory, NormalizedCookieCategory } from '../knowledge/categoryMap';

type CookieRecord = {
  name: string;
  displayName?: string | null;
  description?: string | null;
  category?: string | null;
  service?: {
    name?: string | null;
    vendor?: {
      name?: string | null;
    } | null;
  } | null;
};

export type ClassifiedCookie = {
  vendor: string;
  service: string | null;
  category: NormalizedCookieCategory;
  description: string;
  source: 'database' | 'heuristic' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
};

const db = cookiesDb as CookieRecord[];

const exactMap = new Map<string, CookieRecord>();

for (const record of db) {
  exactMap.set(record.name.toLowerCase(), record);
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

function matchWildcard(name: string): CookieRecord | undefined {
  for (const record of db) {
    const displayName = record.displayName;

    if (!displayName || !displayName.includes('*')) continue;

    const prefix = normalizeName(displayName.replace('*', ''));

    if (name.startsWith(prefix)) {
      return record;
    }
  }

  return undefined;
}

function classifyFromRecord(record: CookieRecord): ClassifiedCookie {
  return {
    vendor: record.service?.vendor?.name || 'Unknown',
    service: record.service?.name || null,
    category: normalizeCategory(record.category ?? undefined),
    description: record.description || '',
    source: 'database',
    confidence: 'high'
  };
}

function classifyByHeuristic(input: {
  name: string;
  domain?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
}): ClassifiedCookie {
  const name = normalizeName(input.name);
  const domain = input.domain?.toLowerCase() ?? '';

  const isThirdPartyLike =
    domain.includes('doubleclick') ||
    domain.includes('facebook') ||
    domain.includes('googleadservices') ||
    domain.includes('googlesyndication') ||
    domain.includes('tiktok') ||
    domain.includes('adnxs') ||
    domain.includes('criteo') ||
    domain.includes('bing') ||
    domain.includes('clarity') ||
    domain.includes('hotjar');

  if (isThirdPartyLike) {
    return {
      vendor: 'Unknown advertising / analytics vendor',
      service: null,
      category: 'advertisement',
      description: 'Classified heuristically because it belongs to a known advertising or analytics domain.',
      source: 'heuristic',
      confidence: 'medium'
    };
  }

  if (
    name.startsWith('_ga') ||
    name.startsWith('_gid') ||
    name.startsWith('_gat') ||
    name.startsWith('_hj') ||
    name.startsWith('_cl') ||
    name.startsWith('_uet') ||
    name.includes('analytics')
  ) {
    return {
      vendor: 'Unknown analytics vendor',
      service: null,
      category: 'analytics',
      description: 'Classified heuristically based on common analytics cookie naming patterns.',
      source: 'heuristic',
      confidence: 'medium'
    };
  }

  if (
    name.includes('fbp') ||
    name.includes('fbc') ||
    name.includes('gcl') ||
    name.includes('ttclid') ||
    name.includes('ttp') ||
    name.includes('ad') ||
    name.includes('pixel') ||
    name.includes('retarget')
  ) {
    return {
      vendor: 'Unknown advertising vendor',
      service: null,
      category: 'advertisement',
      description: 'Classified heuristically based on common advertising or retargeting cookie naming patterns.',
      source: 'heuristic',
      confidence: 'medium'
    };
  }

  if (
    name.includes('csrf') ||
    name.includes('xsrf') ||
    name.includes('token') ||
    name.includes('session') ||
    name.includes('sid') ||
    name.includes('auth') ||
    input.httpOnly
  ) {
    return {
      vendor: 'Site / platform',
      service: null,
      category: 'necessary',
      description: 'Classified heuristically as a likely session, authentication, or security cookie.',
      source: 'heuristic',
      confidence: 'medium'
    };
  }

  if (
    name.includes('cart') ||
    name.includes('basket') ||
    name.includes('checkout') ||
    name.includes('currency') ||
    name.includes('language') ||
    name.includes('locale') ||
    name.includes('preference')
  ) {
    return {
      vendor: 'Site / platform',
      service: null,
      category: 'functional',
      description: 'Classified heuristically as a likely functional or preference cookie.',
      source: 'heuristic',
      confidence: 'medium'
    };
  }

  return {
    vendor: 'Unknown',
    service: null,
    category: 'other',
    description: '',
    source: 'unknown',
    confidence: 'low'
  };
}

export function classifyCookie(input: {
  name: string;
  domain?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
}): ClassifiedCookie {
  const name = normalizeName(input.name);

  const exact = exactMap.get(name);
  if (exact) return classifyFromRecord(exact);

  const wildcard = matchWildcard(name);
  if (wildcard) return classifyFromRecord(wildcard);

  return classifyByHeuristic(input);
}