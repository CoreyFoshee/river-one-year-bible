import { passageIdsFromCell } from '../lib/refs.mjs';

const API_BASE = 'https://api.scripture.api.bible/v1';

/** New International Version (NIV) 2011 — use GET /v1/bibles?abbreviation=NIV to confirm the id for your API key. */
const DEFAULT_BIBLE_ID_NIV = '78a9f6124f344018-01';

/** These API.Bible ids are KJV (common copy-paste mistake for “NIV”). Never use them when we want NIV. */
const KJV_BIBLE_IDS = new Set(['de4e12af7f28f599-01', 'de4e12af7f28f599-02']);

function resolveBibleId() {
  const fromEnv = (process.env.BIBLE_ID || '').trim();
  if (fromEnv && KJV_BIBLE_IDS.has(fromEnv)) {
    return DEFAULT_BIBLE_ID_NIV;
  }
  return fromEnv || DEFAULT_BIBLE_ID_NIV;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const ref = (event.queryStringParameters?.ref || '').trim();
  if (!ref) {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing ref query parameter' }) };
  }

  const apiKey = process.env.API_BIBLE_KEY;
  const bibleId = resolveBibleId();

  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'API_BIBLE_KEY is not configured. Add it in Netlify environment variables.',
      }),
    };
  }

  let passageIds;
  try {
    passageIds = passageIdsFromCell(ref);
  } catch (e) {
    return {
      statusCode: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message || String(e) }),
    };
  }

  const parts = [];
  const copyrights = new Set();

  for (const passageId of passageIds) {
    const url = `${API_BASE}/bibles/${encodeURIComponent(bibleId)}/passages/${encodeURIComponent(passageId)}?content-type=html&include-notes=false`;
    const res = await fetch(url, { headers: { 'api-key': apiKey } });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        statusCode: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unexpected response from scripture API', detail: text.slice(0, 200) }),
      };
    }

    if (!res.ok) {
      const msg = json?.message || json?.error || res.statusText;
      return {
        statusCode: res.status === 404 ? 404 : 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: msg || 'Passage request failed',
          passageId,
          bibleId,
          hint:
            res.status === 403 || res.status === 401
              ? 'Check that your API key is valid and includes the selected Bible (NIV).'
              : undefined,
        }),
      };
    }

    const data = json.data;
    if (data?.copyright) copyrights.add(data.copyright.trim());
    parts.push({
      reference: data?.reference || passageId,
      content: data?.content || '',
    });
  }

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference: ref,
      bibleId,
      parts,
      copyright: [...copyrights].join(' '),
    }),
  };
}
