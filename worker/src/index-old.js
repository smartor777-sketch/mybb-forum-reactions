import { ReactionsDO } from './reactions-do.js';

const ALLOWED_ORIGINS_DEFAULT = [];

function getAllowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || ALLOWED_ORIGINS_DEFAULT;
  if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
  return raw;
}

function getCorsOrigin(request, allowed) {
  if (!allowed.length) return '*';
  const origin = request.headers.get('Origin');
  if (!origin || origin === 'null') return 'null';
  return allowed.includes(origin) ? origin : 'null';
}

function corsHeaders(corsOrigin) {
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== '/' && url.pathname !== '/api/reactions') {
      return new Response('Not found', { status: 404 });
    }

    const allowed = getAllowedOrigins(env);
    const corsOrigin = getCorsOrigin(request, allowed);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(corsOrigin) });
    }

    // Block requests from disallowed origins (unless all origins allowed)
    if (corsOrigin === 'null' && allowed.length) {
      return new Response(JSON.stringify({ error: 'Forbidden origin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(corsOrigin) },
      });
    }

    if (request.method === 'GET') {
      const postIds = (url.searchParams.get('post_ids') || '').split(',').filter(Boolean);
      const userId = url.searchParams.get('user_id') || '0';

      const entries = [];
      for (let i = 0; i < postIds.length; i += 5) {
        const batch = postIds.slice(i, i + 5);
        const batchResults = await Promise.all(
          batch.map(async (pid) => {
            const id = env.REACTIONS_DO.idFromName(`post:${pid}`);
            const stub = env.REACTIONS_DO.get(id);
            const resp = await stub.fetch(`http://do/get?user_id=${userId}`);
            return [pid, await resp.json()];
          }),
        );
        entries.push(...batchResults);
      }

      return new Response(JSON.stringify(Object.fromEntries(entries)), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders(corsOrigin) },
      });
    }

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        const { post_id, user_id, emoji } = body;

        const id = env.REACTIONS_DO.idFromName(`post:${post_id}`);
        const stub = env.REACTIONS_DO.get(id);

        const setResp = await stub.fetch(
          `http://do/set?user_id=${encodeURIComponent(user_id)}&emoji=${encodeURIComponent(emoji)}`,
        );

        return new Response(await setResp.text(), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(corsOrigin),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      } catch (postError) {
        return new Response(JSON.stringify({ counts: {}, user_reaction: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(corsOrigin) },
        });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  },
};

export { ReactionsDO };
