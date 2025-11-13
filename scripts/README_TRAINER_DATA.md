# Скрипт для заполнения данных тренеров

## Описание
Этот скрипт заполняет таблицу `profiles` тестовыми данными для тренеров:
- `short_description` - краткое описание для карточек
- `experience_years` - годы опыта
- `last_seen` - время последней активности (для статуса онлайн)

## Как использовать

### Вариант 1: Через Supabase Dashboard
1. Откройте Supabase Dashboard
2. Перейдите в раздел "SQL Editor"
3. Скопируйте содержимое файла `scripts/fill_trainer_test_data.sql`
4. Вставьте в редактор и нажмите "Run"

### Вариант 2: Через командную строку
```bash
# Если используете Supabase CLI
supabase db reset
# или
psql -h your-db-host -U postgres -d postgres -f scripts/fill_trainer_test_data.sql
```

## Что делает скрипт

1. **Добавляет колонки** (если их еще нет):
   - `short_description` - TEXT
   - `experience_years` - INTEGER
   - `last_seen` - TIMESTAMPTZ

2. **Заполняет краткие описания** на основе специализации тренера:
   - Yoga → "Certified yoga instructor..."
   - Boxing → "Professional boxing coach..."
   - Tennis → "Former professional tennis player..."
   - И т.д.

3. **Устанавливает годы опыта** на основе специализации:
   - От 5 до 15 лет в зависимости от типа тренировок

4. **Создает реалистичные timestamps для `last_seen`**:
   - 30% тренеров - онлайн (активны в последние 5 минут)
   - 30% тренеров - видели 10-60 минут назад
   - 20% тренеров - видели 2-6 часов назад
   - Остальные - видели 1-7 дней назад

5. **Показывает результаты** - последние 20 тренеров с их статусом

## Проверка результатов

После выполнения скрипта проверьте:
```sql
SELECT 
  username,
  specialty,
  short_description,
  experience_years,
  last_seen,
  CASE 
    WHEN last_seen > NOW() - INTERVAL '5 minutes' THEN 'Online'
    ELSE 'Offline'
  END as status
FROM profiles p
INNER JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'trainer'
LIMIT 10;
```



