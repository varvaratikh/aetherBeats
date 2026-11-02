# Руководство по запуску AetherBeats на сервере (Production & Security Guide)

Это руководство поможет вам развернуть проект **AetherBeats** на любом сервере (VPS / Ubuntu / Debian / Docker / Coolify / Render / Fly.io / Timeweb / Selectel / Beget) безопасно и с максимальной производительностью.

---

## ⚠️ Важное требование безопасности: HTTPS и Микрофон

В современных браузерах (Google Chrome, Safari, Mozilla Firefox, Yandex, Edge) доступ к микрофону (`navigator.mediaDevices.getUserMedia`) **заблокирован по протоколу HTTP**.
- Исключение: только `http://localhost` или `http://127.0.0.1`.
- Для доступа через домен в интернете (`https://ваш-домен.com`) **обязательно необходим SSL/TLS сертификат (HTTPS)**. Бесплатный сертификат легко выпускается через Let's Encrypt (Certbot).

---

## Способ 1: Запуск через Docker & Docker Compose (Рекомендуемый)

В проекте уже настроен многоэтапный безопасный `Dockerfile` (образ на базе `node:20-alpine`, сборка без лишних файлов, запуск от непривилегированного пользователя `node` без root-прав, автоматический `HEALTHCHECK`).

### Быстрый запуск одной командой:
```bash
docker compose up -d --build
```

### Проверка работы:
```bash
docker compose ps
docker compose logs -f
curl http://localhost:3000/health
```

---

## Способ 2: Запуск через Node.js и PM2 (напрямую на VPS)

### 1. Установка зависимостей и сборка:
```bash
npm install
npm run build
```
Команда `npm run build` скомпилирует:
- Клиентскую часть в директорию `dist/` (с минификацией, оптимизацией Tailwind v4 и Three.js)
- Быстрый производственный сервер в `dist/server.js`

### 2. Запуск сервера:
```bash
# Обычный запуск:
npm start

# Или запуск в фоне через PM2 (с автоперезапуском при сбоях и перезагрузке сервера):
npm install -g pm2
pm2 start dist/server.js --name "aether-beats"
pm2 save
pm2 startup
```

---

## Настройка Nginx и SSL (HTTPS)

Скопируйте и настройте конфигурацию из файла `nginx.conf.example`:

```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/aether-beats
sudo ln -s /etc/nginx/sites-available/aether-beats /etc/nginx/sites-enabled/
```

Замените `your-domain.com` на ваш домен и выпустите бесплатный SSL сертификат:
```bash
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

---

## Реализованные меры безопасности (Security Features)

1. **Защита от XSS и инъекций (Content Security Policy):**
   - Строгая директива CSP ограничивает источники выполнения скриптов, стилей и шрифтов.
2. **Защита от MIME-sniffing:**
   - Заголовок `X-Content-Type-Options: nosniff`.
3. **Защита от кликджекинга:**
   - Заголовок `X-Frame-Options: SAMEORIGIN`.
4. **Контроль разрешений (Permissions-Policy):**
   - Явно разрешен микрофон (`microphone=(self)`) для частотного анализа звука на вашем домене, но заблокированы геолокация и камера.
5. **Маскировка серверного стека:**
   - Отключен заголовок `X-Powered-By: Express` для исключения сканирования версий хакерами.
6. **Контейнер без Root-прав:**
   - В `Dockerfile` процесс запускается из-под пользователя `node:node` (UID/GID 1000).
7. **Кэширование и производительность:**
   - Статические ассеты (`/assets/*.js`, `/assets/*.css`) кэшируются браузером на 1 год (`max-age=31536000, immutable`).
   - `index.html` отдается с заголовками `no-cache`, чтобы пользователи моментально получали обновления после деплоя.
8. **Эндпоинт проверки здоровья:**
   - `GET /health` и `GET /api/health` возвращают HTTP 200 `{ status: "ok" }` для систем мониторинга, Docker и балансировщиков нагрузки.
