#!/usr/bin/env node

import { scan } from '../core/scanner';
import { printReport } from '../output/formatter';
import { computeRisk } from '../risk/riskEngine';
import { computeLegalCompliance } from '../compliance/complianceEngine';
import { buildJsonOutput } from '../output/jsonBuilder';
import { saveJsonToFile } from '../output/saveJson';

function shouldFail(riskLevel: string, failOn: string): boolean {
  const order = ['low', 'medium', 'high'];

  return order.indexOf(riskLevel) >= order.indexOf(failOn);
}

async function main() {
  const url = process.argv[2];
  const isJson = process.argv.includes('--json');

  const failArg = process.argv.find(arg =>
    arg.startsWith('--fail-on-risk=')
  );

  const failOn = failArg ? failArg.split('=')[1] : null;

  if (!url) {
    console.error('Usage: cookie-audit <url> [--json] [--fail-on-risk=medium|high]');
    process.exit(1);
  }

  const start = Date.now();

  const result = await scan(url);
  const risk = computeRisk(result);
  const compliance = computeLegalCompliance(result);

  const durationMs = Date.now() - start;

  if (isJson) {
    const json = buildJsonOutput({
      url,
      result,
      risk,
      compliance,
      durationMs
    });

    saveJsonToFile(json, url);
  } else {
    printReport(result, risk, compliance);
  }

  // 🔥 FAIL MODE (CI/CD)
  if (failOn && shouldFail(risk.level, failOn)) {
    console.error(
      `\n❌ Build failed: risk level ${risk.level} (threshold: ${failOn})`
    );
    process.exit(1);
  }
}

main();