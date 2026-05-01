import { mkdirSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const URL_FILE = process.argv[2] ?? './scripts/urls.txt';
const OUTPUT_DIR = process.argv[3] ?? './scans';

mkdirSync(OUTPUT_DIR, { recursive: true });

const urls = readFileSync(URL_FILE, 'utf8')
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean)
  .filter(line => !line.startsWith('#'));

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

async function main() {
  console.log(`🔍 Running ${urls.length} scans`);
  console.log(`📁 Output dir: ${OUTPUT_DIR}`);

  let ok = 0;
  let fail = 0;

  for (const url of urls) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔍 Scanning: ${url}`);

    try {
      await runCommand('cookie-audit', [url, '--json']);
      ok++;
    } catch (error) {
      console.error(`❌ Failed: ${url}`);
      console.error((error as Error).message);
      fail++;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\nDone. ok=${ok} fail=${fail}`);
}

main();