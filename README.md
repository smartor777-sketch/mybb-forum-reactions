# Реакции на посты форума (emoji reactions)

Готовый функционал реакций к постам (как в Xenforo/Invision) для форумов на BestBB/PunBB/mybb.ru. Эмодзи, счётчики, тёмная тема — всё работает.

```
▶ Реакции (5)     ← кликабельный заголовок
     ↓ клик
┌──────────────────────────────────────────────┐
│  👍 1  👎 0  ❤ 2  😂 0  😮 0  😢 0  ...  │
└──────────────────────────────────────────────┘
```

**10 реакций:** 👍 👎 ❤ 😂 😮 😢 😡 🔥 🎯 💡

---

## Схема работы

```
Форум (BestBB)    →  Cloudflare Worker  →  Durable Object (SQLite)
     │                      │                      │
     │  GET /api/reactions  │  stub.fetch('/get')   │
     │  ?post_ids=1,2,3     │ ────────────────────► │
     │  &user_id=456       │                      │ чтение storage
     │ ◄─────────────────── │ ◄──────────────────── │
     │                      │                      │
     │  POST /api/reactions │  stub.fetch('/set')   │
     │  {post_id,user_id,   │  ?user_id=...        │
     │   emoji}             │  &emoji=...          │
     │ ───────────────────► │ ────────────────────► │ toggle + запись
```

---

## Структура репозитория

```
mybb-forum-reactions/
├── worker/                  # Cloudflare Worker + Durable Object
│   ├── wrangler.jsonc       # конфигурация Wrangler
│   ├── package.json
│   └── src/
│       ├── index.js         # API Gateway
│       └── reactions-do.js  # Durable Object (хранилище)
├── widget/
│   └── forum-reactions.js   # виджет для форума (вставка в HTML-верх)
├── yandex-proxy/            # прокси для регионов, где Cloudflare недоступен
│   ├── index.js
│   └── README.md
├── docs/
│   └── ARCHITECTURE.md      # архитектура, проблемы и решения
└── README.md
```

---

## Быстрый старт

### 1. Деплой Cloudflare Worker

```bash
cd worker
npm install -g wrangler
wrangler login
wrangler deploy
```

После деплоя вы получите URL вида `https://mybb-forum-reactions.ваш-аккаунт.workers.dev`.

### 2. Установка виджета на форум

Скопируйте содержимое `widget/forum-reactions.js` и вставьте в HTML-верх форума (Админ-панель → Оформление → HTML-верх).

**Перед вставкой:** замените `YOUR_ACCOUNT` в URL на ваш Cloudflare аккаунт.

> ⚠ **Важно:** Worker не имеет защиты от спама — любой, кто знает URL, может слать POST-запросы. Рекомендуется добавить проверку `Origin` или rate limiting (см. `docs/ARCHITECTURE.md`).

### 3. Прокси через Yandex Cloud (опционально)

Если Cloudflare недоступен в вашем регионе — см. `yandex-proxy/README.md`.

---

## Набор реакций

| Эмодзи | Смысл |
|--------|-------|
| 👍 | Нравится |
| 👎 | Не нравится |
| ❤ | Супер |
| 😂 | Смешно |
| 😮 | Ничего себе |
| 😢 | Грустно |
| 😡 | Бесит |
| 🔥 | Огонь |
| 🎯 | В точку |
| 💡 | Идея |

Набор можно менять — правьте массив `EMOJIS` в `widget/forum-reactions.js`.

---

## Лимиты бесплатного тарифа Cloudflare

| Ресурс | Лимит |
|--------|-------|
| Workers requests | 100 000/день |
| Durable Objects requests | 1 000 000/мес |
| DO storage | 1 ГБ (~1 000 000 постов) |
