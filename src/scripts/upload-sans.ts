import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

const ENDPOINT = `${SUPABASE_URL}/functions/v1/submit-scan`;
const SCAN_DIR = process.argv[2] ?? './scans';
const MANIFEST_FILE = join(SCAN_DIR, 'manifest.json');

type Target = {
  name: string;
  sector: string;
  url: string;
};

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function loadManifest(): Map<string, Target> {
  const raw = readFileSync(MANIFEST_FILE, 'utf8');
  const targets = JSON.parse(raw) as Target[];

  const map = new Map<string, Target>();

  for (const target of targets) {
    map.set(normalizeUrl(target.url), target);
  }

  return map;
}

async function uploadOne(filePath: string, target: Target) {
  const scan = JSON.parse(readFileSync(filePath, 'utf8'));

  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({
      name: target.name,
      sector: target.sector,
      scan
    })
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(`${filePath}: ${json.error ?? res.status}`);
  }

  return json.domain as string;
}
async function main() {
  const manifest = loadManifest();

  const files = readdirSync(SCAN_DIR)
    .filter(file => file.endsWith('.json'))
    .filter(file => file !== 'manifest.json');

  console.log(`📦 ${files.length} scan files in ${SCAN_DIR}`);

  let ok = 0;
  let fail = 0;
  let skipped = 0;

  for (const file of files) {
    const fullPath = join(SCAN_DIR, file);

    try {
      const scan = JSON.parse(readFileSync(fullPath, 'utf8'));
      const scanUrl = scan.meta?.url;

      if (!scanUrl) {
        console.warn(`⏭️ Skipped ${file}: missing meta.url`);
        skipped++;
        continue;
      }

      const target = manifest.get(normalizeUrl(scanUrl));

      if (!target) {
        console.warn(`⏭️ Skipped ${file}: URL not found in manifest (${scanUrl})`);
        skipped++;
        continue;
      }

      const domain = await uploadOne(fullPath, target);
      console.log(`✅ ${target.name} / ${domain} ← ${file}`);
      ok++;
    } catch (error) {
      console.error(`❌ ${file}:`, (error as Error).message);
      fail++;
    }

    await new Promise(resolve => setTimeout(resolve, 150));
  }

  console.log(`\nDone. ok=${ok} fail=${fail} skipped=${skipped}`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});