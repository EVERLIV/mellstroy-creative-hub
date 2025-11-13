-- Скрипт для проверки и добавления колонки last_seen в таблицу profiles
-- Запустите этот скрипт в Supabase SQL Editor

-- Шаг 1: Проверка существования колонки
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'last_seen';

-- Шаг 2: Если колонка не существует, выполните следующие команды:

-- Добавить колонку last_seen (если не существует)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Установить значение для существующих пользователей
UPDATE profiles
SET last_seen = NOW()
WHERE last_seen IS NULL;

-- Создать индекс для производительности
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

-- Добавить комментарий
COMMENT ON COLUMN profiles.last_seen IS 'Last activity timestamp for online status';

-- Шаг 3: Проверка результата
SELECT 
    id,
    username,
    last_seen,
    CASE 
        WHEN last_seen > NOW() - INTERVAL '5 minutes' THEN '🟢 Online'
        WHEN last_seen > NOW() - INTERVAL '1 hour' THEN '🟡 Seen recently'
        WHEN last_seen > NOW() - INTERVAL '1 day' THEN '🟠 Seen today'
        ELSE '⚪ Seen long ago'
    END as status
FROM profiles
ORDER BY last_seen DESC NULLS LAST
LIMIT 10;


