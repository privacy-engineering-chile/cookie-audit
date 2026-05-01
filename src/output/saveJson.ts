import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function safeFilename(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .replace(/[^a-zA-Z0-9.-]+/g, '_');
}

export function saveJsonToFile(json: unknown, url: string) {
  const outputDir = process.env.COOKIE_AUDIT_OUTPUT_DIR ?? './scans';

  mkdirSync(outputDir, { recursive: true });

  const filename = `${safeFilename(url)}-${Date.now()}.json`;
  const path = join(outputDir, filename);

  writeFileSync(path, JSON.stringify(json, null, 2), 'utf8');

  console.log(`💾 JSON saved: ${path}`);
}