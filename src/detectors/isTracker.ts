const TRACKER_KEYWORDS = [
  'analytics',
  'track',
  'tracking',
  'pixel',
  'collect',
  'ads',
  'doubleclick',
  'facebook',
  'tiktok',
  'googletag',
  'hotjar',
  'segment',
  'mixpanel',
  'bing',
  'linkedin'
];

export function isTracker(url: string): boolean {
  const lower = url.toLowerCase();

  return TRACKER_KEYWORDS.some(keyword => lower.includes(keyword));
}