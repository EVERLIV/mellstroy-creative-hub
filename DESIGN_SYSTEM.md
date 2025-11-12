# Design System - Based on ClassDetailPage

## Цветовая палитра

### Основные цвета
- **Белый фон**: `bg-white` - основной фон страниц и карточек
- **Серый фон контейнера**: `bg-gray-50` - фон для контейнеров с карточками
- **Серый фон элементов**: `bg-gray-100` - для вложенных элементов (например, карточка тренера)

### Текст
- **Основной заголовок**: `text-lg font-bold text-gray-900` - заголовки секций
- **Подзаголовок**: `text-sm font-bold text-gray-900` - подзаголовки в карточках
- **Основной текст**: `text-xs text-gray-900` - основной текст
- **Вторичный текст**: `text-xs text-gray-600` - описания, дополнительная информация
- **Метаданные**: `text-xs text-gray-500` - метки полей
- **Заголовок страницы**: `text-base font-bold text-gray-900` - заголовок в хедере

### Кнопки
- **Основная кнопка**: `bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm`
- **Отключенная кнопка**: `bg-gray-200 text-gray-500 cursor-not-allowed`
- **Вторичная кнопка**: `text-xs font-medium text-blue-600 px-2 py-1 hover:text-blue-700`
- **Кнопка назад/иконка**: `p-2` с иконкой `w-5 h-5 text-gray-800`

### Карточки
- **Основная карточка**: `bg-white rounded-lg p-3 mb-3 shadow-sm`
- **Вложенная карточка**: `bg-gray-50 rounded-lg p-2.5` (например, карточка тренера)
- **Ховер эффект**: `hover:bg-gray-100 transition-colors`

### Бейджи и баблы
- **Синий бейдж**: `px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full`
- **Зеленый бейдж**: `px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full`
- **Желтый бейдж**: `px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full`

### Тени
- **Карточки**: `shadow-sm` - мягкая тень для карточек
- **Фиксированные элементы**: `shadow-lg` - более выраженная тень для фиксированных элементов (нижняя кнопка)
- **Хедер**: `shadow-sm` - тень для хедера

### Отступы
- **Контейнер страницы**: `px-4 py-3` - основные отступы страницы
- **Карточки**: `p-3` - внутренние отступы карточек
- **Вложенные элементы**: `p-2.5` - отступы для вложенных карточек
- **Между карточками**: `mb-3` - отступ между карточками
- **Между элементами**: `space-y-1.5`, `space-y-2.5`, `space-y-3` - вертикальные отступы

### Границы
- **Разделители**: `border-t border-gray-100` - разделители между секциями
- **Границы элементов**: `border-b border-gray-100` - границы между элементами списка

### Иконки
- **Размер иконок в хедере**: `w-5 h-5`
- **Размер маленьких иконок**: `w-3.5 h-3.5`
- **Цвет иконок**: `text-gray-800` для основных, `text-gray-600` для вторичных
- **Звезды рейтинга**: `w-2.5 h-2.5` с `text-yellow-400 fill-yellow-400`

### Формы и инпуты
- **Инпуты**: `bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900`
- **Фокус**: `focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
- **Плейсхолдер**: `placeholder:text-gray-400`

### Хедер страницы
- **Контейнер**: `flex items-center justify-between px-4 py-3 bg-white shadow-sm z-20`
- **Кнопки**: `p-2 -ml-2` или `p-2 -mr-2` для крайних кнопок
- **Заголовок**: `text-base font-bold text-gray-900`

### Фиксированные элементы
- **Нижняя кнопка**: `px-4 py-3 bg-white shadow-lg` - контейнер
- **Кнопка**: `w-full font-bold py-3 px-4 rounded-lg transition-all duration-200 text-sm shadow-sm`

### Анимации
- **Ховер кнопок**: `hover:bg-blue-700`
- **Активное состояние**: `active:scale-95`
- **Переходы**: `transition-all duration-200` или `transition-colors`

### Размеры шрифтов
- **Заголовок страницы**: `text-base` (16px)
- **Заголовок секции**: `text-lg` (18px)
- **Подзаголовок**: `text-sm` (14px)
- **Основной текст**: `text-xs` (12px)

### Скругления
- **Карточки**: `rounded-lg` (8px)
- **Бейджи**: `rounded-full`
- **Кнопки**: `rounded-lg`

## Структура страницы

```
<div className="bg-white h-screen flex flex-col overflow-hidden">
  {/* Header */}
  <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm z-20">
    {/* Back button, Title, Action button */}
  </div>

  {/* Scrollable Content */}
  <div className="flex-1 overflow-y-auto">
    <div className="px-4 py-3 bg-gray-50">
      {/* Cards */}
      <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
        {/* Content */}
      </div>
    </div>
  </div>

  {/* Fixed Bottom Button */}
  <div className="px-4 py-3 bg-white shadow-lg">
    <button className="w-full font-bold py-3 px-4 rounded-lg ...">
      {/* Button text */}
    </button>
  </div>
</div>
```

