(function () {
  'use strict';

  var API = 'https://functions.yandexcloud.net/d4ee6f70vp5h5c796jju';
  var EMOJIS = [
    '\u{1F44D}', // 👍
    '\u{1F44E}', // 👎
    '\u2764\uFE0F',   // ❤
    '\u{1F602}', // 😂
    '\u{1F62E}', // 😮
    '\u{1F622}', // 😢
    '\u{1F621}', // 😡
    '\u{1F525}', // 🔥
    '\u{1F3AF}', // 🎯
    '\u{1F4A1}', // 💡
  ];

  var CACHE = {};
  var SEQ = {};
  var TRACK = {};

  function injectCSS() {
    if (document.getElementById('rx-css')) return;
    var s = document.createElement('style');
    s.id = 'rx-css';
    s.textContent =
      '.post-reactions-wrap{margin-top:8px}' +
      '.post-reactions-hdr{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border:1px solid #c5d0e6;border-radius:6px;cursor:pointer;font-size:12px;color:#426B9A;background:#f5f5ff;transition:background .15s;user-select:none}' +
      '.post-reactions-hdr:hover{background:#e0d8f2}' +
      '.pr-arrow{font-size:10px;transition:transform .2s;display:inline-block}' +
      '.pr-arrow.open{transform:rotate(90deg)}' +
      '.pr-count{color:#888}' +
      '.post-reactions{display:flex;flex-wrap:wrap;gap:3px;padding:5px 7px;margin-top:5px;border:1px solid #c5d0e6;border-radius:8px;background:#f8f8ff;align-items:center}' +
      '.reaction-btn{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border:1px solid #d1d1e1;border-radius:5px;cursor:pointer;font-size:13px;line-height:22px;background:#f5f5ff;transition:background .15s;user-select:none}' +
      '.reaction-btn:hover{background:#e0d8f2;border-color:#a0b0d0}' +
      '.reaction-btn.active{background:#3e779d;border-color:#3e779d;color:#fff}' +
      '.reaction-btn.loading{opacity:.5;cursor:wait}' +
      '.reaction-btn .emoji{font-size:15px}' +
      '.reaction-btn .count{font-size:11px;font-weight:bold;min-width:10px;text-align:center}' +
      'body.dark-theme .post-reactions-hdr{background:#2d3748;border-color:#4a5b70;color:#7a9cc6}' +
      'body.dark-theme .post-reactions-hdr:hover{background:#3a4a5e}' +
      'body.dark-theme .post-reactions{border-color:#4a5b70;background:#262f40}' +
      'body.dark-theme .reaction-btn{background:#2d3748;border-color:#4a5b70;color:#e2e8f0}' +
      'body.dark-theme .reaction-btn:hover{background:#3a4a5e;border-color:#5a6b80}' +
      'body.dark-theme .reaction-btn.active{background:#426B9A;border-color:#426B9A;color:#fff}' +
      'body.dark-theme .pr-count{color:#8899aa}';
    document.head.appendChild(s);
  }

  function uid() {
    var x;
    if (typeof FORUM !== 'undefined' && FORUM.get) x = FORUM.get('UserID');
    if (!x && typeof UserID !== 'undefined') x = UserID;
    return x || 0;
  }

  function isGuest() {
    var g;
    if (typeof FORUM !== 'undefined' && FORUM.get) g = FORUM.get('GroupID');
    if (!g && typeof GroupID !== 'undefined') g = GroupID;
    return String(g || 3) === '3';
  }

  function postIds() {
    return Array.from(document.querySelectorAll('.post[id^="p"]'))
      .map(function (e) { return e.id.slice(1); });
  }

  function totalCount(counts) {
    var t = 0;
    EMOJIS.forEach(function (e) { t += counts[e] || 0; });
    return t;
  }

  function fetchAll(ids, uid) {
    if (!ids.length) return Promise.resolve({});
    return fetch(API + '?post_ids=' + ids.join(',') + '&user_id=' + uid)
      .then(function (r) { return r.json(); })
      .catch(function () { return {}; });
  }

  function toggle(pid, uid, emoji) {
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: pid, user_id: uid, emoji: emoji }),
    })
      .then(function (r) { return r.json(); })
      .catch(function () { return null; });
  }

  function render(pid, counts, mine) {
    var post = document.getElementById('p' + pid);
    if (!post) return;

    var isOwn = post.dataset.userId && String(post.dataset.userId) === String(uid());

    var box = post.querySelector('.post-box');
    if (!box || box.querySelector('.post-reactions-wrap')) return;

    var t = totalCount(counts);

    var wrap = document.createElement('div');
    wrap.className = 'post-reactions-wrap';

    var hdr = document.createElement('div');
    hdr.className = 'post-reactions-hdr';
    hdr.innerHTML = '<span class="pr-arrow">\u25B6</span>' +
      ' \u0420\u0435\u0430\u043A\u0446\u0438\u0438' +
      ' <span class="pr-count">' + (t > 0 ? '(' + t + ')' : '') + '</span>';

    hdr.addEventListener('click', function () {
      var panel = this.nextElementSibling;
      var isOpen = panel.style.display !== 'none';
      panel.style.display = isOpen ? 'none' : '';
      this.querySelector('.pr-arrow').classList.toggle('open', !isOpen);
    });
    wrap.appendChild(hdr);

    var panel = document.createElement('div');
    panel.className = 'post-reactions';
    panel.style.display = 'none';

    EMOJIS.forEach(function (emoji) {
      var count = counts[emoji] || 0;
      var active = (mine === emoji) ? ' active' : '';

      var btn = document.createElement('span');
      btn.className = 'reaction-btn' + active;
      btn.dataset.post = pid;
      btn.dataset.emoji = emoji;
      btn.innerHTML = '<span class="emoji">' + emoji + '</span>' +
        '<span class="count">' + count + '</span>';
      if (!isOwn) btn.addEventListener('click', onClick);
      panel.appendChild(btn);
    });

    wrap.appendChild(panel);
    box.appendChild(wrap);
  }

  function updateUI(pid, counts, mine) {
    var wrap = document.querySelector('#p' + pid + ' .post-reactions-wrap');
    if (!wrap) return;

    var panel = wrap.querySelector('.post-reactions');
    if (panel) {
      panel.querySelectorAll('.reaction-btn').forEach(function (btn) {
        var e = btn.dataset.emoji;
        btn.querySelector('.count').textContent = counts[e] || 0;
        btn.classList.toggle('active', mine === e);
      });
    }

    var hdr = wrap.querySelector('.post-reactions-hdr');
    if (hdr) {
      var t = totalCount(counts);
      hdr.querySelector('.pr-count').textContent = t > 0 ? '(' + t + ')' : '';
    }
  }

  function onClick(e) {
    var btn = e.currentTarget;
    var pid = btn.dataset.post;
    var emoji = btn.dataset.emoji;
    var userId = uid();

    if (isGuest() || !userId) return;

    var post = document.getElementById('p' + pid);
    if (post && post.dataset.userId && String(post.dataset.userId) === String(userId)) return;

    if (!SEQ[pid]) SEQ[pid] = 0;
    var seq = ++SEQ[pid];
    var prevEmoji = TRACK[pid] || null;
    TRACK[pid] = emoji;
    btn.classList.add('loading');

    var prevReaction = CACHE[pid] || prevEmoji || null;
    var newCounts = optimisticUpdate(pid, emoji, prevReaction);
    updateUI(pid, newCounts, emoji);
    btn.classList.remove('loading');

    var onDone = function (data) {
      if (SEQ[pid] !== seq) return;
      TRACK[pid] = false;
      CACHE[pid] = (data && data.user_reaction) || null;
      updateUI(pid, (data && data.counts) || {}, (data && data.user_reaction) || null);
    };

    toggle(pid, userId, emoji)
      .then(onDone)
      .catch(function () {
        fetch(API + '?post_ids=' + pid + '&user_id=' + userId)
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data && data[pid]) onDone(data[pid]);
          });
      });
  }

  function optimisticUpdate(pid, newEmoji, prevEmoji) {
    var panel = document.querySelector('#p' + pid + ' .post-reactions');
    if (!panel) return {};

    var counts = {};
    panel.querySelectorAll('.reaction-btn').forEach(function (btn) {
      counts[btn.dataset.emoji] = parseInt(btn.querySelector('.count').textContent) || 0;
    });

    if (prevEmoji && counts[prevEmoji] > 0) {
      counts[prevEmoji]--;
    }
    if (newEmoji !== prevEmoji) {
      counts[newEmoji] = (counts[newEmoji] || 0) + 1;
    }
    return counts;
  }

  function init() {
    if (!document.getElementById('pun-viewtopic')) return;

    var ids = postIds();
    if (!ids.length) return;

    var userId = uid();

    var newIds = ids.filter(function (id) {
      return !document.querySelector('#p' + id + ' .post-reactions-wrap');
    });
    if (!newIds.length) return;

    fetchAll(newIds, userId).then(function (data) {
      newIds.forEach(function (pid) {
        var info = data[pid] || { counts: {}, user_reaction: null };
        CACHE[pid] = info.user_reaction;
        render(pid, info.counts, info.user_reaction);
      });
    });
  }

  injectCSS();

  if (typeof $ !== 'undefined') {
    $(document).on('pun_mainReady', init);
    $(document).on('pun_post', function () { setTimeout(init, 0); });
    $(document).on('ajaxSuccess', function () { setTimeout(init, 0); });
  }

  var observer = new MutationObserver(function () {
    if (!document.getElementById('pun-viewtopic')) return;
    var unprocessed = document.querySelectorAll('.post[id^="p"]:not(.rx-init)');
    if (!unprocessed.length) return;
    unprocessed.forEach(function (el) { el.classList.add('rx-init'); });
    setTimeout(init, 0);
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
