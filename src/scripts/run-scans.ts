import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

type Target = {
  name: string;
  sector: string;
  url: string;
};

const URL_FILE = process.argv[2] ?? './scripts/urls.txt';
const OUTPUT_DIR = process.argv[3] ?? './scans';

const MANIFEST_FILE = join(OUTPUT_DIR, 'manifest.json');

mkdirSync(OUTPUT_DIR, { recursive: true });

function parseTargets(filePath: string): Target[] {
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('#'))
    .map((line, index) => {
      const [name, sector, url] = line.split(';').map(value => value?.trim());

      if (!name || !sector || !url) {
        throw new Error(
          `Invalid line ${index + 1}. Expected: name;sector;url. Got: ${line}`
        );
      }

      return { name, sector, url };
    });
}

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        COOKIE_AUDIT_OUTPUT_DIR: OUTPUT_DIR
      }
    });

    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function saveManifest(targets: Target[]) {
  writeFileSync(MANIFEST_FILE, JSON.stringify(targets, null, 2), 'utf8');
  console.log(`🧾 Manifest saved: ${MANIFEST_FILE}`);
}

async function main() {
  const targets = parseTargets(URL_FILE);
  saveManifest(targets);

  console.log(`🔍 Running ${targets.length} scans`);
  console.log(`📁 Output dir: ${OUTPUT_DIR}`);

  let ok = 0;
  let fail = 0;

  for (const target of targets) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏷️  Name  : ${target.name}`);
    console.log(`🏢 Sector: ${target.sector}`);
    console.log(`🔍 URL   : ${target.url}`);

    try {
      await runCommand('cookie-audit', [target.url, '--json']);
      ok++;
    } catch (error) {
      console.error(`❌ Failed: ${target.url}`);
      console.error((error as Error).message);
      fail++;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\nDone. ok=${ok} fail=${fail}`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});