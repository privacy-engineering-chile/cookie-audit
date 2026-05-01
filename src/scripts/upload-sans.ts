import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

const ENDPOINT = `${SUPABASE_URL}/functions/v1/submit-scan`;
const SCAN_DIR = process.argv[2] ?? './scans';

async function uploadOne(filePath: string) {
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
    body: JSON.stringify({ scan })
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(`${filePath}: ${json.error ?? res.status}`);
  }

  return json.domain as string;
}

async function main() {
  const files = readdirSync(SCAN_DIR).filter(file => file.endsWith('.json'));

  console.log(`📦 ${files.length} archivos en ${SCAN_DIR}`);

  let ok = 0;
  let fail = 0;

  for (const file of files) {
    const full = join(SCAN_DIR, file);

    try {
      const domain = await uploadOne(full);
      console.log(`✅ ${domain} ← ${file}`);
      ok++;
    } catch (error) {
      console.error(`❌ ${file}:`, (error as Error).message);
      fail++;
    }

    await new Promise(resolve => setTimeout(resolve, 150));
  }

  console.log(`\nListo. ok=${ok} fail=${fail}`);
}

main();