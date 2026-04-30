export async function detectTrackers(page: any): Promise<string[]> {
  const requests: string[] = [];

  page.on('request', (req: any) => {
    requests.push(req.url());
  });

  await page.waitForTimeout(3000);

  const patterns = [
    'google-analytics',
    'googletagmanager',
    'doubleclick',
    'facebook',
    'analytics',
    'tracking'
  ];

  return requests.filter(url =>
    patterns.some(p => url.toLowerCase().includes(p))
  );
}