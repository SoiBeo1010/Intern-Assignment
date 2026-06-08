// Placeholder TypeScript script: implement CSV -> DB importer here.
// Use a CSV parser and your chosen ORM (TypeORM / knex) to insert records.

import fs from 'fs';
import path from 'path';

const csvPath = path.resolve(__dirname, '../../../../dataset/diem_thi_thpt_2024.csv');

async function previewCsv() {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split(/\r?\n/).slice(0, 10);
  console.log('CSV preview (first 10 lines):');
  console.log(lines.join('\n'));
}

previewCsv().catch(err => console.error(err));
