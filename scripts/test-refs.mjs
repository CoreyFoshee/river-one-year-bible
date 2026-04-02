import fs from 'fs';
import { passageIdsFromCell } from '../netlify/lib/refs.mjs';

const csv = fs.readFileSync(
  new URL('../Assets/One Year Bible Master File.csv', import.meta.url),
  'utf8',
);
const lines = csv.trim().split('\n').slice(1);

function parseLine(line) {
  const cols = [];
  let cur = '';
  let q = false;
  for (const c of line) {
    if (c === '"') {
      q = !q;
      continue;
    }
    if (c === ',' && !q) {
      cols.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  cols.push(cur);
  return cols.map((c) => c.trim());
}

const errs = [];
for (const line of lines) {
  const cols = parseLine(line);
  if (cols.length < 5) continue;
  const date = cols[0];
  for (let i = 1; i <= 4; i++) {
    try {
      passageIdsFromCell(cols[i]);
    } catch (e) {
      errs.push({ date, col: i, cell: cols[i], err: e.message });
    }
  }
}
console.log('errors', errs.length);
errs.slice(0, 20).forEach((e) => console.log(JSON.stringify(e)));
