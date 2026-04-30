export type VendorStat = {
  name: string;
  domains: string[];
  requests: number;
};

const VENDOR_MAP: Record<string, string> = {
  'google-analytics.com': 'google',
  'googletagmanager.com': 'google',
  'doubleclick.net': 'google',
  'gstatic.com': 'google',

  'facebook.net': 'meta',
  'facebook.com': 'meta',

  'tiktok.com': 'tiktok',
  'analytics.tiktok.com': 'tiktok',

  'bing.com': 'microsoft',
  'bat.bing.com': 'microsoft',

  'linkedin.com': 'linkedin',
  'licdn.com': 'linkedin',

  'hotjar.com': 'hotjar',
  'segment.io': 'segment',
  'mixpanel.com': 'mixpanel'
};

function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function matchVendor(domain: string): string | null {
  for (const key of Object.keys(VENDOR_MAP)) {
    if (domain.includes(key)) {
      return VENDOR_MAP[key];
    }
  }
  return null;
}

export function mapVendors(trackers: string[]): VendorStat[] {
  const stats: Record<string, VendorStat> = {};

  for (const url of trackers) {
    const domain = extractDomain(url);
    const vendor = matchVendor(domain);

    if (!vendor) continue;

    if (!stats[vendor]) {
      stats[vendor] = {
        name: vendor,
        domains: [],
        requests: 0
      };
    }

    stats[vendor].requests++;

    if (!stats[vendor].domains.includes(domain)) {
      stats[vendor].domains.push(domain);
    }
  }

  return Object.values(stats);
}

// 🔥 NUEVO
export function diffVendors(
  before: VendorStat[],
  after: VendorStat[]
): VendorStat[] {
  const beforeNames = new Set(before.map(v => v.name));
  return after.filter(v => !beforeNames.has(v.name));
}