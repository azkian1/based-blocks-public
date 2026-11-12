# Figma UI Guide - Block Puzzle Neon Theme

Пошаговая инструкция по импорту SVG в Figma и экспорту PNG @2x.

---

## 1. Параметры стилей (Design Tokens)

### Цвета
| Название | HEX | Использование |
|----------|-----|---------------|
| Accent (Cyan) | `#00FFFF` | Рамки, кнопки, активные иконки |
| Inactive | `#888888` | Неактивные иконки, вторичный текст |
| Background | `#0A0A0F` | Основной фон игры |
| Frame Fill | `#0D1B2A` | Заливка рамок и модалок |
| Button Text | `#00FFFF` | Текст кнопок (normal) |
| Button Text Hover | `#FFFFFF` | Текст кнопок (hover) |

### Размеры
| Элемент | Размер (px) | Примечание |
|---------|-------------|------------|
| Button Large | 200 × 50 | Основные кнопки меню |
| Button Medium | 150 × 38 | Кнопки в модалках |
| Button Small | 100 × 32 | Компактные кнопки |
| Frame Menu | 260 × 160 | Рамка главного меню |
| Frame Modal | 220 × 200 | Стандартная модалка |
| Frame Modal Large | 280 × 320 | Большая модалка (Daily Check-in) |
| Corner Decoration | 40 × 40 | Угловые акценты |
| Icon | 24 × 24 | Иконки TabBar |
| Mute Button | 40 × 40 | Круглая кнопка звука |

### Параметры стиля
| Параметр | Значение |
|----------|----------|
| Corner Radius (большие) | 8px |
| Corner Radius (малые) | 6px |
| Border Width | 2px |
| Glow Blur | 4-8px |
| Glow Opacity | 15-40% |

---

## 2. Импорт SVG в Figma

### Шаг 2.1: Открыть Figma
1. Открой [figma.com](https://figma.com) или desktop app
2. Создай новый файл: **File → New design file**
3. Переименуй: `Block Puzzle UI Kit`

### Шаг 2.2: Настроить Canvas
1. Нажми на пустое место на canvas
2. В правой панели (Design) установи:
   - Background: `#0A0A0F` (чтобы видеть glow)

### Шаг 2.3: Импортировать SVG файлы
1. **File → Place image** (или `Ctrl+Shift+K` / `Cmd+Shift+K`)
2. Перейди в папку: `assets/ui/svg/`
3. Выбери все файлы из подпапок:
   - `buttons/*.svg` (11 файлов)
   - `frames/*.svg` (3 файла)
   - `decorations/*.svg` (4 файла)
   - `icons/*.svg` (8 файлов)
4. Кликни на canvas чтобы разместить

### Шаг 2.4: Организовать элементы
1. Создай страницы (Pages) в левой панели:
   - `Buttons`
   - `Frames`
   - `Decorations`
   - `Icons`
2. Перемести элементы на соответствующие страницы
3. Выровняй элементы (используй `Shift+A` для Auto Layout)

---

## 3. Улучшение эффектов в Figma

SVG фильтры могут отображаться не идеально. Добавь эффекты вручную:

### Шаг 3.1: Drop Shadow для Glow эффекта
1. Выбери элемент (например, `btn_large_normal`)
2. В правой панели → **Effects** → нажми `+`
3. Выбери **Drop Shadow**
4. Настройки:
   ```
   Color: #00FFFF
   Opacity: 30%
   X: 0
   Y: 0
   Blur: 8
   Spread: 2
   ```

### Шаг 3.2: Настройки для разных состояний

**Normal state:**
```
Drop Shadow:
  Color: #00FFFF, 20%
  Blur: 6, Spread: 1
```

**Hover state:**
```
Drop Shadow:
  Color: #00FFFF, 40%
  Blur: 10, Spread: 3
```

**Pressed state:**
```
Drop Shadow:
  Color: #00FFFF, 50%
  Blur: 12, Spread: 4
Inner Shadow (дополнительно):
  Color: #FFFFFF, 20%
  Blur: 4
```

### Шаг 3.3: Применить стили ко всем элементам
1. Настрой один элемент
2. Выбери его эффект в панели Effects
3. Нажми иконку `⋮` → **Create style**
4. Назови: `Neon Glow Normal`
5. Примени к остальным элементам того же типа

---

## 4. Создание компонентов (опционально)

Для удобства создай компоненты с вариантами:

### Шаг 4.1: Создать Component Set для кнопок
1. Выбери все 3 состояния одной кнопки (normal, hover, pressed)
2. Правый клик → **Create component set**
3. В правой панели добавь Property:
   - Name: `State`
   - Values: `Normal`, `Hover`, `Pressed`

### Шаг 4.2: Повтори для всех размеров
- `Button/Large` (3 варианта)
- `Button/Medium` (3 варианта)
- `Button/Small` (3 варианта)

### Шаг 4.3: Создать компоненты для иконок
- `Icon/Home` (Active, Inactive)
- `Icon/Trophy` (Active, Inactive)
- `Icon/Profile` (Active, Inactive)
- `Icon/Sound` (On, Off)

### Шаг 4.4: Создать Component Set для Mute Button
1. Выбери оба состояния кнопки (normal, hover)
2. Правый клик → **Create component set**
3. В правой панели добавь Property:
   - Name: `State`
   - Values: `Normal`, `Hover`
4. Для каждого состояния добавь иконку sound_on или sound_off по центру

---

## 5. Экспорт PNG @2x

### Шаг 5.1: Настроить экспорт
1. Выбери элемент для экспорта
2. В правой панели внизу найди секцию **Export**
3. Нажми `+` чтобы добавить экспорт
4. Настройки:
   ```
   Format: PNG
   Scale: 2x
   Suffix: (оставь пустым или @2x)
   ```

### Шаг 5.2: Экспортировать все элементы

**Способ 1: По одному**
1. Выбери элемент
2. Нажми **Export** (или `Ctrl+Shift+E`)
3. Сохрани в `assets/ui/`

**Способ 2: Массовый экспорт**
1. Выбери все элементы для экспорта (`Ctrl+A` на странице)
2. Настрой Export для каждого (можно копировать настройки)
3. **File → Export** (`Ctrl+Shift+E`)
4. Выбери папку `assets/ui/`
5. Нажми **Export**

### Шаг 5.3: Структура файлов после экспорта
```
assets/ui/
├── btn_large_normal.png
├── btn_large_hover.png
├── btn_large_pressed.png
├── btn_medium_normal.png
├── btn_medium_hover.png
├── btn_medium_pressed.png
├── btn_small_normal.png
├── btn_small_hover.png
├── btn_small_pressed.png
├── btn_mute_normal.png
├── btn_mute_hover.png
├── frame_menu.png
├── frame_modal.png
├── frame_modal_large.png
├── corner_tl.png
├── corner_tr.png
├── corner_bl.png
├── corner_br.png
├── icon_home_active.png
├── icon_home_inactive.png
├── icon_trophy_active.png
├── icon_trophy_inactive.png
├── icon_profile_active.png
├── icon_profile_inactive.png
├── icon_sound_on.png
└── icon_sound_off.png
```

---

## 6. Чеклист перед передачей разработчику

- [ ] Все элементы экспортированы в PNG @2x
- [ ] Glow эффекты видны на экспорте
- [ ] Имена файлов соответствуют структуре выше
- [ ] Файлы сохранены в `assets/ui/`
- [ ] Проверены на HiDPI экране (должны быть чёткими)

---

## 7. После экспорта

Когда PNG файлы готовы, сообщи Claude:

> "PNG экспортированы в assets/ui/, обнови код компонентов"

Claude обновит:
1. `src/scenes/PreloadScene.js` — загрузка спрайтов
2. `src/presentation/components/Button.js` — использование image вместо graphics
3. `src/presentation/components/NeonFrame.js` — использование image/9-slice
4. `src/presentation/components/BackgroundDecorations.js` — использование спрайтов

---

## Быстрые команды Figma

| Действие | Windows | Mac |
|----------|---------|-----|
| Import | `Ctrl+Shift+K` | `Cmd+Shift+K` |
| Export | `Ctrl+Shift+E` | `Cmd+Shift+E` |
| Create Component | `Ctrl+Alt+K` | `Cmd+Option+K` |
| Auto Layout | `Shift+A` | `Shift+A` |
| Zoom to Fit | `Shift+1` | `Shift+1` |
| Zoom to 100% | `Ctrl+0` | `Cmd+0` |

---

## 8. Mute Button - Спецификации

Круглая кнопка для управления звуком в неоновом стиле.

### Параметры
| Параметр | Значение |
|----------|----------|
| Размер | 40 × 40 px |
| Форма | Круг (radius 20px) |
| Фон | `#0d1b2a` @ 60% opacity |
| Рамка | `#00ffff`, 2px |
| Glow | `#00ffff`, blur 4-8px |
| Иконка | 24 × 24 px, по центру |

### Состояния

**Normal (`btn_mute_normal.svg`):**
- Outer glow: stroke 1.5px, opacity 0.15
- Border: stroke 2px, opacity 0.7
- Background: fill-opacity 0.6

**Hover (`btn_mute_hover.svg`):**
- Outer glow: stroke 1.5px, opacity 0.4
- Border: stroke 2px, opacity 1.0
- Background: fill-opacity 0.8

### Иконки звука

**Sound On (`icon_sound_on.svg`):**
- Динамик + 2 звуковые волны
- Stroke: `#00ffff`, 2px
- Glow: stdDeviation 1

**Sound Off (`icon_sound_off.svg`):**
- Динамик + крестик (X)
- Stroke: `#00ffff`, 2px
- Glow: stdDeviation 1

### Сборка в Figma
1. Создай круглую кнопку (btn_mute_normal/hover)
2. Разместь иконку (icon_sound_on/off) по центру
3. Группируй для экспорта как единый компонент

---

## Troubleshooting

### SVG не импортируется
- Попробуй Copy-Paste: открой SVG в браузере → `Ctrl+A` → `Ctrl+C` → вставь в Figma

### Glow не видно
- Canvas должен быть тёмным (#0A0A0F)
- Проверь opacity эффекта (минимум 20%)

### Экспорт размытый
- Убедись что Scale = 2x
- Проверь что элемент не масштабирован в Figma

### Размеры не совпадают
- После импорта SVG, проверь размер в правой панели (W × H)
- При необходимости сбрось масштаб: правый клик → **Reset all overrides**
