const TZ = import.meta.env.VITE_PUBLIC_TIMEZONE || 'America/Indiana/Indianapolis';

const LABELS = {
  ot: 'Old Testament',
  nt: 'New Testament',
  ps: 'Psalms',
  pr: 'Proverbs',
};

function formatDateKeyFromYmd(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: TZ,
  });
}

function todayYmdInTz() {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return s;
}

function ymdToScheduleKey(ymd) {
  const [, m, d] = ymd.split('-');
  return `${m}-${d}`;
}

function addDaysYmd(ymd, delta) {
  const [y, mo, da] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, da, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dt);
}

let scheduleData = null;

async function loadSchedule() {
  const res = await fetch('/data/schedule.json');
  if (!res.ok) throw new Error('Could not load reading schedule.');
  const j = await res.json();
  scheduleData = j.byDay;
}

function getDayRow(ymd) {
  const key = ymdToScheduleKey(ymd);
  return scheduleData[key] || null;
}

function setStatus(msg, isError) {
  const el = document.getElementById('status');
  if (!msg) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.hidden = false;
  el.textContent = msg;
  el.classList.toggle('status--error', !!isError);
}

async function fetchPassage(ref) {
  const u = new URL('/api/passage', window.location.origin);
  u.searchParams.set('ref', ref);
  const res = await fetch(u);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data.error || res.statusText;
    throw new Error(err);
  }
  return data;
}

const SECTION_ORDER = ['ot', 'nt', 'pr', 'ps'];

function buildDetailsShell(key, title, ref) {
  const details = document.createElement('details');
  details.className = 'reading-details card';
  details.dataset.sectionKey = key;
  details.dataset.ref = ref;
  details.dataset.loaded = '0';

  const summary = document.createElement('summary');
  summary.className = 'reading-details__summary';
  summary.innerHTML = `
    <span class="reading-details__summary-text">
      <span class="reading-details__label">${escapeHtml(title)}</span>
      <span class="reading-details__ref">${escapeHtml(ref)}</span>
    </span>
    <span class="reading-details__chevron" aria-hidden="true"></span>
  `;

  const body = document.createElement('div');
  body.className = 'reading-details__body';
  body.innerHTML =
    '<p class="reading-details__placeholder">Open this section to load the reading.</p>';

  details.appendChild(summary);
  details.appendChild(body);
  return details;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function renderDay(ymd) {
  const row = getDayRow(ymd);
  const sectionsEl = document.getElementById('sections');
  const dayLabel = document.getElementById('day-label');
  const copyBlock = document.getElementById('copyright-block');

  sectionsEl.innerHTML = '';
  copyBlock.textContent = '';

  if (!row) {
    setStatus('No readings found for this date.', true);
    dayLabel.textContent = formatDateKeyFromYmd(ymd);
    return;
  }

  setStatus('');
  dayLabel.textContent = row.label || formatDateKeyFromYmd(ymd);

  const copyrights = new Set();

  for (const k of SECTION_ORDER) {
    const ref = row[k];
    if (!ref || !ref.trim()) continue;

    const refTrim = ref.trim();
    const details = buildDetailsShell(k, LABELS[k], refTrim);
    sectionsEl.appendChild(details);

    details.addEventListener('toggle', () => {
      if (!details.open) return;
      sectionsEl.querySelectorAll('details.reading-details').forEach((d) => {
        if (d !== details) d.open = false;
      });
      loadSectionIfNeeded(details, refTrim, copyrights, copyBlock);
    });
  }
}

async function loadSectionIfNeeded(details, refTrim, copyrights, copyBlock) {
  if (details.dataset.loaded === '1') return;

  const body = details.querySelector('.reading-details__body');
  body.innerHTML = '<p class="section__loading">Loading…</p>';

  try {
    const data = await fetchPassage(refTrim);
    const htmlParts = data.parts.map((p) => p.content || '');
    body.innerHTML = `<div class="passage">${htmlParts.join('<hr class="passage__sep" />')}</div>`;
    if (data.copyright) copyrights.add(data.copyright);
    details.dataset.loaded = '1';
    if (copyrights.size) {
      copyBlock.textContent = [...copyrights].join(' ');
    }
  } catch (e) {
    body.innerHTML = `<p class="section__error">${escapeHtml(e.message || String(e))}</p>`;
    details.dataset.loaded = 'error';
  }
}

function readQueryDate() {
  const p = new URLSearchParams(window.location.search);
  const d = p.get('date');
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return null;
}

function writeQueryDate(ymd) {
  const u = new URL(window.location.href);
  u.searchParams.set('date', ymd);
  window.history.replaceState({}, '', u);
}

function init() {
  const input = document.getElementById('date-input');
  let ymd = readQueryDate() || todayYmdInTz();
  input.value = ymd;

  input.addEventListener('change', () => {
    ymd = input.value;
    writeQueryDate(ymd);
    renderDay(ymd);
  });

  document.getElementById('btn-today').addEventListener('click', () => {
    ymd = todayYmdInTz();
    input.value = ymd;
    writeQueryDate(ymd);
    renderDay(ymd);
  });

  document.getElementById('btn-prev').addEventListener('click', () => {
    ymd = addDaysYmd(ymd, -1);
    input.value = ymd;
    writeQueryDate(ymd);
    renderDay(ymd);
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    ymd = addDaysYmd(ymd, 1);
    input.value = ymd;
    writeQueryDate(ymd);
    renderDay(ymd);
  });

  const calBtn = document.getElementById('btn-open-calendar');
  if (calBtn && input) {
    calBtn.addEventListener('click', () => {
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      } else {
        input.focus();
        try {
          input.click();
        } catch {
          /* ignore */
        }
      }
    });
  }

  loadSchedule()
    .then(() => renderDay(ymd))
    .catch((e) => setStatus(e.message || String(e), true));
}

init();
