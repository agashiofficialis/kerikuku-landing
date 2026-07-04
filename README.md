# kerikuku.com — landing

Статический сайт: галерея артов + донат-цель (Ko-fi) + соцсети + мерч. Хостится на Cloudflare Pages.

## Обновить цифру доната (прямо здесь, в браузере)

1. Откройте файл [`donation-goal.json`](donation-goal.json)
2. Нажмите карандаш ✏️ (Edit this file)
3. Поменяйте `collected` (сколько собрано) и `updated` (сегодняшняя дата)
4. Внизу нажмите **Commit changes**

Сайт обновится автоматически через ~1 минуту.

## Заменить ссылки (Ko-fi / TikTok / Telegram / мерч)

Файл [`script.js`](script.js), блок `LINKS` в самом верху — вставить полные URL с `https://`.

## Тексты

Тэглайн, подписи, мерч-блок — в [`index.html`](index.html). Формулировка цели — в `donation-goal.json` (`goal_text`).
