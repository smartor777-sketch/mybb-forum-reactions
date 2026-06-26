export class ReactionsDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/get') {
        const userId = url.searchParams.get('user_id') || '0';
        const reactions = (await this.state.storage.get('reactions')) || {};
        return this._response(reactions, userId);
      }

      if (url.pathname === '/set') {
        const user_id = url.searchParams.get('user_id');
        const emoji = url.searchParams.get('emoji');
        if (!user_id || !emoji) {
          return new Response('Missing params', { status: 400 });
        }

        const reactions = (await this.state.storage.get('reactions')) || {};

        if (reactions[user_id] === emoji) {
          delete reactions[user_id];
        } else {
          reactions[user_id] = emoji;
        }

        await this.state.storage.put('reactions', reactions);
        return this._response(reactions, user_id);
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  _response(reactions, userId) {
    const counts = {};
    let userReaction = null;
    for (const [uid, emoji] of Object.entries(reactions)) {
      counts[emoji] = (counts[emoji] || 0) + 1;
      if (String(uid) === String(userId)) userReaction = emoji;
    }
    return new Response(JSON.stringify({ counts, user_reaction: userReaction }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
