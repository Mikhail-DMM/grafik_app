# График сотрудников

Локальное веб-приложение (PWA) для визуального составления и редактирования месячных графиков работы сотрудников. Работает полностью в браузере, без бэкенда. Данные хранятся в `localStorage` и могут экспортироваться в `JSON`/`Excel`/`JPG`.

> **Для кого:** руководитель, HR, администратор смены. Открыл ссылку → выбрал месяц → расставил смены → скачал Excel/JPG.

---

## Содержание

- [1. Назначение и возможности](#1-назначение-и-возможности)
- [2. Как выглядит интерфейс](#2-как-выглядит-интерфейс)
- [3. Системные требования](#3-системные-требования)
- [4. Установка с чистого компьютера](#4-установка-с-чистого-компьютера)
- [5. Виртуальное окружение](#5-виртуальное-окружение)
- [6. Запуск](#6-запуск)
- [7. Структура файлов](#7-структура-файлов)
- [8. Проверка работоспособности](#8-проверка-работоспособности)
- [9. Переменные окружения](#9-переменные-окружения)
- [10. Деплой](#10-деплой)
- [11. Обновление](#11-обновление)
- [12. Резервное копирование](#12-резервное-копирование)
- [13. Известные ограничения](#13-известные-ограничения)
- [14. Если что-то не работает](#14-если-что-то-не-работает)

---

## 1. Назначение и возможности

**Что решает:** заменяет Excel-таблицы для графиков. Не нужно править ячейки вручную — клик по дню → выбор кода смены → готово.

**Основные возможности:**

| Блок | Что делает |
|------|------------|
| **Таблица** | Строки — дни месяца (1–31), столбцы — сотрудники. Выходные (Сб/Вс) — серый фон. |
| **Навигация** | `← Пред.` / `След. →`, заголовок `Месяц Год`. |
| **Ячейки** | Клик → боковая панель → выбор кода (`Д`, `Н`, `В`, `О`, `Б` …). Цвет из легенды. |
| **Сотрудники** | Добавление / удаление / переименование / перетаскивание столбцов мышью. |
| **Легенда** | В `⚙️ Настройки` — любой набор `код → название → цвет` (например `Д — День #4ade80`). |
| **Шаблоны** | Паттерн `Д-Д-Н-Н-В-В` → применить к сотруднику `1 раз` или `До конца месяца`. |
| **Несколько графиков** | Вкладки сверху (`График 1`, `Янв 2026` …). `+` — копия текущего, `+ текущий месяц` — новый месяц, `📋 Перенести` — скопировать расписание из другого графика. |
| **Вертикальные имена** | Переключатель в `Настройках` — имена в шапке вертикально. |
| **Drag & Drop** | `Закрепить столбец` (вкл — едет и столбец смен, выкл — только имя) + `Обмен местами` (вкл — swap, выкл — вставка). |
| **Sticky** | При скролле переключатели и шапка прилипают, заголовки сжимаются до 4 букв вертикально. |
| **Сохранение** | Авто в `localStorage` при любом изменении. |
| **Экспорт** | `📥 JSON` — вся база, `📊 Excel` — текущий график (`.xlsx`), `🖼 JPG` — вся таблица или выделенная область (`html2canvas`), `🖨 Печать` (`window.print`). |
| **Статистика** | Вкладка `📊 Статистика` — по каждому сотруднику `Д/Н/В… → Итого` за месяц. |
| **Тема** | `🌙 Тёмная / ☀️ Светлая` — `darkMode: class`, хранится в `localStorage: grafik-app-theme`, учитывает `prefers-color-scheme`. |

---

## 2. Как выглядит интерфейс

```
Шапка:  График сотрудников [🌙 Тёмная]   [📥 JSON] [📊 Excel] [📤 Загрузить] [🖼 JPG] [🖨 Печать]
Вкладки графиков:  График 1* | График 2 | + | + текущий месяц | 📋 Перенести
Вкладки функций:   📅 График | ⚙️ Настройки | 📊 Статистика
Таблица: День | Иванов И.И. | Петров П.П. | ...
         1 Пн | [Д]        | [В]          | ...  ← клик → боковая панель справа
         2 Вт | ...
Боковая панель (справа): Обозначения (Д Н В ...) | Очистить ячейку | Шаблоны (1 раз / До конца)
```

**Скриншот:** положи файл в `docs/screenshot.png` и добавь в README:
```md
![Скриншот графика](docs/screenshot.png)
```
Если скриншота нет — описание выше достаточно для первого знакомства.

---

## 3. Системные требования

| Компонент | Минимум | Рекомендуется |
|-----------|---------|---------------|
| **OS** | Windows 10, macOS 12, Ubuntu 20.04 | Windows 11 / macOS 14 / Ubuntu 22.04 |
| **Node.js** | `18.0.0` | `20 LTS` (`lts/*`) |
| **npm** | `9.0.0` | `10` (идёт с Node 20) |
| **Браузер** | Chrome 100, Firefox 100, Edge 100, Safari 16 | Последние версии Chrome/Edge |
| **RAM / Диск** | 1 ГБ RAM, 200 МБ свободно | 4 ГБ RAM, 500 МБ |
| **Интернет** | Только для `npm install` и первого деплоя | — |

Проверка версий (должны ответить без ошибки):
```bash
node --version
npm --version
git --version
```

---

## 4. Установка с чистого компьютера

> Все команды — копируй блоком. PowerShell / bash — одинаково.

**1. Установи Node.js (если нет):**
- Скачай LTS с https://nodejs.org/ и установи, **или** через `nvm`:
```bash
# nvm (https://github.com/nvm-sh/nvm)
nvm install 20
nvm use 20
```

**2. Клонируй репозиторий:**
```bash
git clone https://github.com/Mikhail-DMM/grafik_app.git
cd grafik_app
```

Альтернатива GitVerse:
```bash
git clone https://gitverse.ru/soulofright/grafik_app.git
cd grafik_app
```

**3. Установи зависимости (чистая установка):**
```bash
npm ci
```
Если `npm ci` ругается (нет `package-lock.json`), используй:
```bash
npm install
```

---

## 5. Виртуальное окружение

**Для этого Node.js-проекта `venv` как в Python не нужен.** Изоляция — папка `node_modules/` + `package-lock.json`.

| Задача | Команда |
|--------|---------|
| Изолировать зависимости проекта | `npm ci` (ставит ровно версии из `package-lock.json` в `node_modules/`) |
| Изолировать версию Node | `nvm use 20` или `fnm use 20` (опционально, если установлен `nvm`/`fnm`) |
| Полный сброс окружения | `rm -rf node_modules package-lock.json` (или `Remove-Item -Recurse -Force node_modules` в PowerShell) → `npm install` |

> Не коммить `node_modules/`, `dist/`, `.playwright-mcp/`, `*.tsbuildinfo` — они уже в `.gitignore`.

Если в организации требуется Python-venv для других инструментов — он к этому проекту не относится.

---

## 6. Запуск

**Режим разработки (с авто-перезагрузкой и открытием браузера):**
```bash
npm run dev
```
Открой: `http://localhost:5173` (порт указан в терминале).

**Сборка для продакшена:**
```bash
npm run build
```
Результат: `dist/` (`index.html` + `assets/`).

**Превью собранного:**
```bash
npm run preview
```
Открой адрес из терминала (обычно `http://localhost:4173`).

**Быстрый запуск в Windows (двойной клик):**
```bash
grafik_app.bat
```
Содержит:
```bat
@echo off
cd /d "%~dp0"
npm run dev
```

**Смена темы:** кнопка `🌙 Тёмная / ☀️ Светлая` в шапке. Сохраняется в `localStorage: grafik-app-theme`, при первом визите берётся `prefers-color-scheme`.

---

## 7. Структура файлов

```text
grafik_app/
├── index.html                 # HTML-точка входа, скрипт FOUC для темы
├── package.json               # зависимости и скрипты (dev/build/preview)
├── package-lock.json          # точные версии (для npm ci)
├── vite.config.ts             # сборка Vite + @vitejs/plugin-react
├── tailwind.config.js         # Tailwind, darkMode: 'class'
├── postcss.config.js          # autoprefixer
├── tsconfig.json              # TypeScript
├── .gitignore                 # node_modules/, dist/, .playwright-mcp/, *.tsbuildinfo, .env
├── grafik_app.bat             # быстрый запуск на Windows
├── README.md                  # этот файл
├── TECH_SPEC.md               # ТЗ
├── src/
│   ├── main.tsx               # React root
│   ├── App.tsx                # вкладки графиков + шапка + модалки + экспорт JPG
│   ├── index.css              # Tailwind base + html.dark {color-scheme: dark}
│   ├── vite-env.d.ts          # типы Vite
│   ├── hooks/
│   │   └── useTheme.ts        # тема: localStorage + matchMedia, toggle()
│   ├── types/
│   │   └── index.ts           # Employee, LegendItem, Template, ScheduleData, AppData
│   ├── utils/
│   │   ├── storage.ts         # loadData/saveData, exportToJson/importFromJson, createDefaultSchedule
│   │   ├── excel.ts           # exportToExcel (ExcelJS)
│   │   ├── helpers.ts         # getDaysInMonth, getDayOfWeek, isWeekend, generateId
│   │   └── storage.ts         # localStorage ключ: grafik-app-data
│   └── components/
│       ├── ScheduleTable.tsx  # таблица, drag&drop, sticky, выделение для JPG
│       ├── Settings.tsx       # сотрудники + легенда + шаблоны + вертикальные имена
│       ├── SidePanel.tsx      # панель выбора кода/шаблона для ячейки
│       └── Statistics.tsx     # сводка по кодам → Итого
└── dist/                      # сборка (генерируется, не коммитится)
```

Ключи `localStorage`:
- `grafik-app-data` — вся база `AppData` (JSON)
- `grafik-app-theme` — `light` / `dark`

---

## 8. Проверка работоспособности

**1. Запусти dev и открой браузер:**
```bash
npm run dev
```
Ожидаемо: таблица с текущим месяцем, `1 Пн` … `31`, выходные — серые.

**2. Базовый сценарий (2 минуты):**
- `⚙️ Настройки` → добавь сотрудника `Тест Тестов` → `Дневная Д #4ade80`
- `📅 График` → клик по ячейке `1` → выбери `Д` → ячейка окрасилась
- Клик по заголовку сотрудника → перетащи → порядок изменился
- `📊 Статистика` → у `Тест Тестов` `Д:1 Итого:1`
- Кнопка темы `🌙/☀️` → фон сменился с `bg-gray-50` на `bg-gray-900`

**3. Экспорт/импорт:**
```bash
# в браузере нажми 📥 JSON → скачается grafik-YYYY-MM-DD.json
# 📊 Excel → grafik-2026-09.xlsx (открой — таблица на месте)
# 🖼 JPG → Целиком → grafik-2026-09.jpg
```
Проверка JSON:
```bash
# открой скачанный JSON — должен содержать "schedules", "employees", "legend"
```

**4. Сборка без ошибок:**
```bash
npm run build
ls dist
# Windows PowerShell:
# Get-ChildItem dist
```
Ожидаемо: `dist/index.html` + `dist/assets/index-*.js` + `index-*.css`.

**5. Чистый клон (как у заказчика):**
```bash
cd /tmp
git clone https://github.com/Mikhail-DMM/grafik_app.git grafik_app-verify
cd grafik_app-verify
npm ci
npm run build
```
Если все команды отработали без `ERR!` — README корректен.

---

## 9. Переменные окружения

**Для этого проекта `.env` не требуется** — приложение полностью клиентское, ключи не нужны. Все настройки (сотрудники, легенда, шаблоны) — в `localStorage`/`JSON`, тема — в `localStorage: grafik-app-theme`.

Если будешь расширять (например, бэкенд или аналитика), используй префикс `VITE_` (Vite прокидывает только их в браузер):

```bash
# .env (не коммитится, пример — только имена)
VITE_API_URL=
VITE_ANALYTICS_ID=
```

Создай из примера:
```bash
cp .env.example .env
# заполни значения локально, не коммить .env
```

> В репозитории уже есть `.gitignore` с `.env` / `.env.*` / `!.env.example`.

---

## 10. Деплой

**Статика — любой хостинг для `dist/`: GitHub Pages, GitVerse Pages, Netlify, Vercel, Nginx.**

**Вариант A — GitHub Pages (автоматически):**

1. Включи Pages: `Settings → Pages → Source: GitHub Actions`.
2. Workflow `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on: { push: { branches: [main] } }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with: { github_token: ${{ secrets.GITHUB_TOKEN }}, publish_dir: ./dist }
```

**Вариант B — вручную на свой сервер:**

```bash
npm ci
npm run build
# загрузи папку dist/ на сервер
scp -r dist/* user@server:/var/www/grafik_app/
# или скопируй содержимое dist/ в корень сайта
```

**Вариант C — Netlify/Vercel:**

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`

Проверка после деплоя: открой URL → таблица грузится, `localStorage` пуст — добавь тестового сотрудника → перезагрузи — данные остались.

---

## 11. Обновление

**С GitHub/GitVerse на уже установленном компьютере:**

```bash
cd grafik_app
git pull origin main
# если есть конфликты в package-lock.json — удали и переустанови:
# rm package-lock.json && npm install
npm ci
npm run build
# перезапусти dev если был запущен:
npm run dev
```

Если менялась версия Node (см. `package.json: engines`), обнови Node:
```bash
nvm install 20
nvm use 20
```

---

## 12. Резервное копирование

**Что бэкапить:** всю базу графиков. Хранится в браузере + в JSON-файлах.

**Способ 1 — JSON (рекомендуется):**

- В приложении: `📥 JSON` → `grafik-YYYY-MM-DD.json` → положи в `backups/` или облако.
- Восстановить: `📤 Загрузить` → выбери JSON.

Автоматический бэкап из `localStorage` (в консоли браузера `F12 → Console`):
```javascript
copy(localStorage.getItem('grafik-app-data'))
// вставь в файл backup.json
```

**Способ 2 — localStorage напрямую:**

```bash
# Экспорт localStorage в файл (в DevTools Console):
# localStorage.getItem('grafik-app-data') → сохранить
```

**Расписание:** делай `📥 JSON` перед каждым большим изменением (массовое применение шаблона, удаление сотрудника).

**Где лежит:** `localStorage` — в браузере заказчика (не на сервере). При очистке кэша браузера данные пропадут — держи JSON-копию.

---

## 13. Известные ограничения

- **Нет бэкенда и мульти-пользователя.** Каждый браузер — своя база. Синхронизация между устройствами — только через `JSON` (экспорт/импорт).
- **Лимит `localStorage` ~5 МБ** на домен. При ~100 сотрудниках × 12 месяцев × много графиков может упереться. Решение — периодически `📥 JSON` и `Очистить` старые графики.
- **Excel — только текущий график** (активная вкладка). Вся база — только `JSON`.
- **JPG — `html2canvas` + `canvas`:** на очень больших таблицах (50+ сотрудников) может быть медленно и требовать много RAM. Выделяй область `Выделить часть`.
- **Печать — `window.print()`:** печатается оптимизированный вид (без кнопок `.no-print`). Проверяй в `Предпросмотре печати`.
- **Drag & Drop — только мышью** (на тач-экранах перетаскивание заголовков не работает).
- **Тёмная тема — `class` на `<html>`:** briefly может мелькнуть светлая при первом открытии (исправлено inline-скриптом в `index.html:8`, но на очень медленном устройстве возможен FOUC).
- **Браузеры:** тестировалось на Chrome/Edge/Firefox. Safari <16 может некорректно рендерить `vertical-rl`.

---

## 14. Если что-то не работает

| Симптом | Что делать (копируй команду) |
|---------|------------------------------|
| `node: command not found` / `npm: command not found` | Установи Node 20 с https://nodejs.org/ → `node --version` |
| `npm ci` → `ERR! peer dep` / `EBADENGINE` | Обнови Node: `nvm install 20 && nvm use 20` → `rm -rf node_modules package-lock.json` → `npm install` |
| `vite: command not found` | `npm ci` не выполнился — `npm install` → `npm run dev` |
| Порт `5173` занят | `npm run dev -- --port 5174` или убей процесс: `lsof -i :5173` → `kill -9 <PID>` (Windows: `netstat -ano | findstr :5173` → `taskkill /PID <PID> /F`) |
| Пустая таблица / нет сотрудников | `F12 → Application → Local Storage → https://... → grafik-app-data` — если `null`, нажми `+` в графиках или `📤 Загрузить` JSON. Очистить: `localStorage.removeItem('grafik-app-data'); location.reload()` |
| Тема не переключается | `F12 → Application → Local Storage → grafik-app-theme` — удали ключ → перезагрузи. Проверь `index.html:8` скрипт не заблокирован. |
| `Excel` пустой / не качается | Проверь `src/utils/excel.ts` — `ExcelJS` требует современный браузер. Попробуй Chrome. Ошибка в консоли `F12` → скопируй текст. |
| `JPG` чёрный / обрезанный | Уменьши область `Выделить часть`, отключи тёмную тему перед экспортом (экспорт всегда на белом фоне `container.style.background='white'`). |
| `localStorage` переполнен `QuotaExceededError` | `📥 JSON` → сохрани → `localStorage.clear()` → `📤 Загрузить` только нужный график. |
| После `git pull` белый экран | `rm -rf node_modules dist` → `npm ci` → `npm run build` → `npm run dev` |
| Хочу сбросить всё | `localStorage.clear()` в консоли → `location.reload()` → создастся `График 1` по умолчанию |

Если не помогло — приложи к обращению: `node --version`, `npm --version`, скриншот консоли `F12 → Console`, содержимое `localStorage.getItem('grafik-app-data')` (первые 200 символов).

---

## Лицензия

Приватный проект. Передача заказчику — по договору. Не публикуй `node_modules/` и `dist/` — они собираются из исходников.
