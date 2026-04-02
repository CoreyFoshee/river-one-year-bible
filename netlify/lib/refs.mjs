/**
 * Split a CSV cell into individual passage strings for API.Bible.
 * Handles: commas between refs, and " - " between two books (e.g. Lev–Num).
 */
export function splitReferenceSegments(cell) {
  if (!cell || typeof cell !== 'string') return [];
  const trimmed = cell.trim().replace(/\s+/g, ' ');
  const commaParts = splitCsvCommaParts(trimmed);
  const out = [];
  for (const cp of commaParts) {
    for (const dashPart of cp.split(/\s+-\s+/)) {
      const p = normalizeSegment(dashPart.trim());
      if (p) out.push(p);
    }
  }
  return out;
}

function splitCsvCommaParts(s) {
  const parts = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      q = !q;
      continue;
    }
    if (c === ',' && !q) {
      parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  parts.push(cur.trim());
  return parts.filter(Boolean);
}

function normalizeSegment(seg) {
  if (!seg) return '';
  let s = seg;
  if (/^Pslam\b/i.test(s)) s = s.replace(/^Pslam\b/i, 'Psalm');
  return s.trim();
}

/** Longest-first book name / alias → API.Bible passage book prefix (USFX-style) */
const BOOK_ENTRIES = [
  ['2 Thessalonians', '2TH'],
  ['1 Thessalonians', '1TH'],
  ['2 Corinthians', '2CO'],
  ['1 Corinthians', '1CO'],
  ['2 Chronicles', '2CH'],
  ['1 Chronicles', '1CH'],
  ['2 Peter', '2PE'],
  ['1 Peter', '1PE'],
  ['2 Timothy', '2TI'],
  ['1 Timothy', '1TI'],
  ['2 Samuel', '2SA'],
  ['1 Samuel', '1SA'],
  ['2 Kings', '2KI'],
  ['1 Kings', '1KI'],
  ['3 John', '3JN'],
  ['2 John', '2JN'],
  ['1 John', '1JN'],
  ['Song of Solomon', 'SNG'],
  ['Song of Songs', 'SNG'],
  ['Deuteronomy', 'DEU'],
  ['Ecclesiastes', 'ECC'],
  ['Lamentations', 'LAM'],
  ['Philippians', 'PHP'],
  ['Colossians', 'COL'],
  ['Galatians', 'GAL'],
  ['Ephesians', 'EPH'],
  ['Jeremiah', 'JER'],
  ['Zechariah', 'ZEC'],
  ['Joshua', 'JOS'],
  ['Judges', 'JDG'],
  ['Genesis', 'GEN'],
  ['Exodus', 'EXO'],
  ['Leviticus', 'LEV'],
  ['Numbers', 'NUM'],
  ['Nehemiah', 'NEH'],
  ['Esther', 'EST'],
  ['Psalms', 'PSA'],
  ['Psalm', 'PSA'],
  ['Proverbs', 'PRO'],
  ['Isaiah', 'ISA'],
  ['Ezekiel', 'EZK'],
  ['Matthew', 'MAT'],
  ['Mark', 'MRK'],
  ['Luke', 'LUK'],
  ['John', 'JHN'],
  ['Acts', 'ACT'],
  ['Romans', 'ROM'],
  ['Titus', 'TIT'],
  ['Philemon', 'PHM'],
  ['Hebrews', 'HEB'],
  ['James', 'JAS'],
  ['Jude', 'JUD'],
  ['Revelation', 'REV'],
  ['Habakkuk', 'HAB'],
  ['Zephaniah', 'ZEP'],
  ['Haggai', 'HAG'],
  ['Obadiah', 'OBA'],
  ['Jonah', 'JON'],
  ['Micah', 'MIC'],
  ['Nahum', 'NAM'],
  ['Hosea', 'HOS'],
  ['Joel', 'JOL'],
  ['Amos', 'AMO'],
  ['Malachi', 'MAL'],
  ['Daniel', 'DAN'],
  ['Ezra', 'EZR'],
  ['Ruth', 'RUT'],
  ['Job', 'JOB'],
  ['Jdgs', 'JDG'],
  ['Deu', 'DEU'],
  ['SoS', 'SNG'],
  ['Ru', 'RUT'],
  ['Jos', 'JOS'],
  ['Gen', 'GEN'],
  ['Ex', 'EXO'],
  ['Lev', 'LEV'],
  ['Num', 'NUM'],
  ['1 Thess', '1TH'],
  ['2 Thess', '2TH'],
  ['1 Tim', '1TI'],
  ['2 Tim', '2TI'],
  ['1 Pet', '1PE'],
  ['2 Pet', '2PE'],
  ['1 Chr', '1CH'],
  ['2 Chr', '2CH'],
  ['1 Kin', '1KI'],
  ['2 Kin', '2KI'],
  ['1 Sam', '1SA'],
  ['2 Sam', '2SA'],
  ['Matt', 'MAT'],
  ['Mk', 'MRK'],
  ['Lk', 'LUK'],
  ['Jn', 'JHN'],
  ['Rom', 'ROM'],
  ['Heb', 'HEB'],
  ['Jas', 'JAS'],
  ['Rev', 'REV'],
  ['Ps', 'PSA'],
];

function bookMapSorted() {
  const seen = new Set();
  const rows = [];
  for (const [name, code] of BOOK_ENTRIES) {
    const k = `${name}|${code}`;
    if (seen.has(k)) continue;
    seen.add(k);
    rows.push([name, code]);
  }
  rows.sort((a, b) => b[0].length - a[0].length);
  return rows;
}

const SORTED_BOOKS = bookMapSorted();

export function passageIdFromSegment(segment) {
  const s = normalizeSegment(segment);
  if (!s) throw new Error('Empty reference');
  let rest = s;
  let code = null;
  for (const [name, c] of SORTED_BOOKS) {
    if (rest === name) {
      throw new Error(`Missing chapter:verse after book name: ${segment}`);
    }
    const prefix = `${name} `;
    if (rest.startsWith(prefix)) {
      code = c;
      rest = rest.slice(prefix.length).trim();
      break;
    }
  }
  if (!code || !rest) throw new Error(`Could not parse book name in: ${segment}`);

  const cross = rest.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
  if (cross) {
    const a = `${code}.${cross[1]}.${cross[2]}`;
    const b = `${code}.${cross[3]}.${cross[4]}`;
    return `${a}-${b}`;
  }
  const same = rest.match(/^(\d+):(\d+)-(\d+)$/);
  if (same) {
    const a = `${code}.${same[1]}.${same[2]}`;
    const b = `${code}.${same[1]}.${same[3]}`;
    return `${a}-${b}`;
  }
  const single = rest.match(/^(\d+):(\d+)$/);
  if (single) {
    const id = `${code}.${single[1]}.${single[2]}`;
    return `${id}-${id}`;
  }
  throw new Error(`Could not parse verse range in: ${segment} (rest: ${rest})`);
}

export function passageIdsFromCell(cell) {
  return splitReferenceSegments(cell).map(passageIdFromSegment);
}
