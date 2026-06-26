# Yandex Cloud Proxy for Forum Reactions

Если Cloudflare недоступен в вашем регионе (например, РФ — мобильные операторы с «белыми списками»), запросы от форума можно пропустить через прокси на Yandex Cloud Functions.

## Схема

```
Форум → Yandex Cloud Function → Cloudflare Worker → DO
```

## Установка

### Через веб-консоль

1. Зайдите в [console.cloud.yandex.ru](https://console.cloud.yandex.ru)
2. Cloud Functions → **Создать функцию**
3. Название: `forum-reactions-proxy`
4. Среда выполнения: `Node.js 18`
5. Вставьте код из `index.js` (замените `CF_WORKER` и `ALLOWED_ORIGINS`)
6. **Создать версию**
7. Вкладка **Доступ** → разрешить вызов без авторизации

### Через YC CLI

```bash
yc serverless function create --name forum-reactions-proxy
yc serverless function allow-unauthenticated-invoke forum-reactions-proxy
yc serverless function version create \
  --function-name forum-reactions-proxy \
  --runtime nodejs18 \
  --entrypoint index.handler \
  --memory 128m \
  --execution-timeout 10s \
  --source-path ./index.js
```

После установки подставьте URL функции в виджет вместо `API`.
