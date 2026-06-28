const CF_WORKER = 'https://ВАШ_ВОРКЕР.ВАШ_АККАУНТ.workers.dev';

const ALLOWED_ORIGINS = [
  'https://forum1.mybb.ru',
  'https://forum2.mybb.ru',
];

function getCorsOrigin(origin) {
  if (!origin) return 'null';
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return origin;
  return 'null';
}

async function handler(event) {
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};
  const headers = event.headers || {};
  const origin = headers['origin'] || headers['Origin'] || '';
  const corsOrigin = getCorsOrigin(origin);

  const cors = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }

  if (origin && corsOrigin === 'null') {
    return { statusCode: 403, headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Forbidden', origin }) };
  }

  const qs = new URLSearchParams(params).toString();
  const cfUrl = CF_WORKER + '/api/reactions' + (qs ? '?' + qs : '');
  const cfHeaders = {};
  if (headers['origin']) cfHeaders['Origin'] = headers['origin'];
  else if (headers['Origin']) cfHeaders['Origin'] = headers['Origin'];
  if (headers['content-type']) cfHeaders['Content-Type'] = headers['content-type'];
  const cfOptions = { method, headers: cfHeaders };
  if (method === 'POST' && event.body) cfOptions.body = event.body;
  try {
    const cfResp = await fetch(cfUrl, cfOptions);
    const body = await cfResp.text();
    return { statusCode: cfResp.status, headers: { ...cors,
      'Content-Type': cfResp.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }, body };
  } catch (err) {
    return { statusCode: 502, headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Proxy error: ' + err.message }) };
  }
}

module.exports.handler = handler;
