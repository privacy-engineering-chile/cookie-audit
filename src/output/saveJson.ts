import fs from 'fs';
import path from 'path';

export function saveJsonToFile(data: any, url: string) {
  const safeName = url.replace(/https?:\/\//, '').replace(/[^\w]/g, '_');
  const fileName = `cookie-audit-${safeName}.json`;

  const filePath = path.join(process.cwd(), fileName);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`\n📄 JSON report saved: ${filePath}`);
}