# Инструкция по применению миграции для колонки `last_seen`

## Проверка существования колонки

Колонка `last_seen` должна быть добавлена в таблицу `profiles` через миграцию.

## Как применить миграцию в Supabase

### Вариант 1: Через Supabase Dashboard (Рекомендуется)

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в раздел **SQL Editor** (в левом меню)
4. Откройте файл `scripts/check_and_add_last_seen.sql`
5. Скопируйте содержимое файла в SQL Editor
6. Нажмите **Run** (или `Ctrl+Enter`)

### Вариант 2: Через миграцию напрямую

1. Откройте Supabase Dashboard → SQL Editor
2. Откройте файл `supabase/migrations/20251114000001_add_trainer_fields_and_test_data.sql`
3. Скопируйте первые 18 строк (до комментария "Update existing trainers"):
   ```sql
   -- Add new fields to profiles table for trainers (if not exists)
   ALTER TABLE profiles
   ADD COLUMN IF NOT EXISTS short_description TEXT,
   ADD COLUMN IF NOT EXISTS experience_years INTEGER,
   ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

   -- Set default last_seen for existing users
   UPDATE profiles
   SET last_seen = NOW()
   WHERE last_seen IS NULL;

   -- Create index on last_seen for faster queries
   CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

   -- Add comment to columns
   COMMENT ON COLUMN profiles.short_description IS 'Short description for trainer cards (max 150 characters)';
   COMMENT ON COLUMN profiles.experience_years IS 'Years of experience as a trainer';
   COMMENT ON COLUMN profiles.last_seen IS 'Last activity timestamp for online status';
   ```
4. Нажмите **Run**

### Вариант 3: Минимальная миграция (только last_seen)

Если вам нужна только колонка `last_seen`, выполните:

```sql
-- Добавить колонку last_seen
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Установить значение для существующих пользователей
UPDATE profiles
SET last_seen = NOW()
WHERE last_seen IS NULL;

-- Создать индекс
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);
```

## Проверка успешности миграции

После выполнения миграции выполните этот запрос для проверки:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'last_seen';
```

Вы должны увидеть:
- `column_name`: `last_seen`
- `data_type`: `timestamp with time zone`
- `is_nullable`: `YES`
- `column_default`: `now()`

## Заполнение тестовыми данными (опционально)

Если вы хотите заполнить `last_seen` реалистичными данными для тестирования, выполните:

```sql
-- Заполнить last_seen для всех тренеров
UPDATE profiles
SET last_seen = COALESCE(
  last_seen,
  NOW() - (RANDOM() * INTERVAL '7 days')
)
WHERE id IN (
  SELECT p.id 
  FROM profiles p
  INNER JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.role = 'trainer'
)
AND last_seen IS NULL;
```

Или используйте полный скрипт из `scripts/fill_trainer_test_data_simple.sql` для заполнения всех полей тренеров.

## Важно

- Миграция использует `IF NOT EXISTS`, поэтому её можно запускать несколько раз без ошибок
- После миграции перезапустите приложение, чтобы изменения вступили в силу
- Проверьте консоль браузера на наличие ошибок после применения миграции



