import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const csvPath = path.join(root, 'Assets', 'One Year Bible Master File.csv');
const outDir = path.join(root, 'public', 'data');
const outFile = path.join(outDir, 'schedule.json');

const MONTHS = {
  January: '01',
  February: '02',
  March: '03',
  April: '04',
  May: '05',
  June: '06',
  July: '07',
  August: '08',
  September: '09',
  October: '10',
  November: '11',
  December: '12',
};

function normalizeDateCol(s) {
  return s.replace(/^Sept\./, 'September').trim();
}

function parseCsvLine(line) {
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

function dateToKey(dateCol) {
  const n = normalizeDateCol(dateCol);
  const parts = n.split(/\s+/);
  if (parts.length < 2) return null;
  const monthName = parts[0];
  const day = parts[1].padStart(2, '0');
  const mm = MONTHS[monthName];
  if (!mm) return null;
  return `${mm}-${day}`;
}

const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.trim().split('\n');
const header = parseCsvLine(lines[0]);
if (header[0] !== 'Date') {
  console.warn('Unexpected CSV header', header);
}

const byDay = {};
for (let i = 1; i < lines.length; i++) {
  const cols = parseCsvLine(lines[i]);
  if (cols.length < 5) continue;
  const key = dateToKey(cols[0]);
  if (!key) continue;
  byDay[key] = {
    label: normalizeDateCol(cols[0]),
    ot: cols[1],
    nt: cols[2],
    ps: cols[3].replace(/^Pslam/i, 'Psalm'),
    pr: cols[4],
  };
}

if (byDay['02-28'] && !byDay['02-29']) {
  byDay['02-29'] = { ...byDay['02-28'], label: 'February 29 (same readings as Feb 28)' };
}

fs.mkdirSync(outDir, { recursive: true });
const payload = {
  meta: {
    source: 'Assets/One Year Bible Master File.csv',
    generated: new Date().toISOString(),
  },
  byDay,
};
fs.writeFileSync(outFile, JSON.stringify(payload, null, 0), 'utf8');
console.log('Wrote', outFile, Object.keys(byDay).length, 'days');
