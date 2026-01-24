-- 🔍 בדיקה מהירה של נושא מרכזי
-- הרץ את הסקריפט הזה כדי לראות את המצב הנוכחי

-- ===== בדיקה 1: האם השדות קיימים? =====
SELECT 
  'בדיקת עמודות' as test_name,
  COUNT(*) as columns_count,
  CASE 
    WHEN COUNT(*) = 9 THEN '✅ כל השדות קיימים'
    ELSE '❌ חסרים שדות!'
  END as status
FROM information_schema.columns 
WHERE table_name = 'app_config' 
  AND column_name LIKE 'featured%';

-- ===== בדיקה 2: מה ההגדרות הנוכחיות? =====
SELECT 
  'הגדרות נוכחיות' as test_name,
  featured_topic_enabled as enabled,
  CASE 
    WHEN featured_topic_enabled THEN '✅ מופעל'
    ELSE '❌ כבוי'
  END as enabled_status,
  featured_topic_title as title,
  featured_topic_type as type,
  CASE 
    WHEN featured_topic_type = 'youtube' THEN featured_topic_youtube_id
    WHEN featured_topic_type = 'image' THEN featured_topic_image_url
    WHEN featured_topic_type = 'live_video' THEN featured_topic_video_url
    ELSE 'N/A'
  END as content_url
FROM app_config 
WHERE id = 'config';

-- ===== בדיקה 3: האם המזהה של יוטיוב תקין? =====
SELECT 
  'בדיקת מזהה יוטיוב' as test_name,
  featured_topic_youtube_id as youtube_id,
  LENGTH(featured_topic_youtube_id) as id_length,
  CASE 
    WHEN featured_topic_type = 'youtube' AND LENGTH(featured_topic_youtube_id) = 11 
      THEN '✅ מזהה תקין (11 תווים)'
    WHEN featured_topic_type = 'youtube' AND LENGTH(featured_topic_youtube_id) != 11 
      THEN '⚠️ מזהה לא תקין - צריך להיות 11 תווים'
    WHEN featured_topic_type != 'youtube' 
      THEN 'ℹ️ לא רלוונטי (סוג תוכן אחר)'
    ELSE '❓ לא ברור'
  END as validation_status,
  CASE 
    WHEN featured_topic_type = 'youtube' 
      THEN 'https://youtube.com/watch?v=' || featured_topic_youtube_id
    ELSE NULL
  END as full_youtube_url
FROM app_config 
WHERE id = 'config';

-- ===== בדיקה 4: סיכום מלא =====
SELECT 
  '📊 סיכום מצב' as summary,
  CASE 
    WHEN featured_topic_enabled = true 
      AND featured_topic_title IS NOT NULL 
      AND featured_topic_title != ''
      AND (
        (featured_topic_type = 'image' AND featured_topic_image_url IS NOT NULL AND featured_topic_image_url != '')
        OR (featured_topic_type = 'youtube' AND featured_topic_youtube_id IS NOT NULL AND LENGTH(featured_topic_youtube_id) = 11)
        OR (featured_topic_type = 'live_video' AND featured_topic_video_url IS NOT NULL AND featured_topic_video_url != '')
      )
    THEN '✅ הכל תקין - אמור להופיע במסך הבית!'
    WHEN featured_topic_enabled = false 
    THEN '⚠️ התכונה כבויה - לא יופיע במסך הבית'
    WHEN featured_topic_title IS NULL OR featured_topic_title = ''
    THEN '❌ חסרה כותרת'
    ELSE '❌ חסר תוכן (תמונה/יוטיוב/וידאו)'
  END as overall_status,
  featured_topic_enabled,
  featured_topic_title,
  featured_topic_type,
  featured_topic_description
FROM app_config 
WHERE id = 'config';

-- ===== תיקון מהיר אם צריך =====
-- הסר את ההערה (--) מהשורות הבאות כדי להפעיל תיקון אוטומטי:

-- UPDATE app_config 
-- SET featured_topic_enabled = true
-- WHERE id = 'config' AND featured_topic_enabled = false;

-- ===== בדיקת preview תמונת יוטיוב =====
SELECT 
  'תמונת preview יוטיוב' as info,
  'https://img.youtube.com/vi/' || featured_topic_youtube_id || '/maxresdefault.jpg' as preview_image_url,
  'פתח את הקישור הזה בדפדפן כדי לראות את התמונה' as instructions
FROM app_config 
WHERE id = 'config' 
  AND featured_topic_type = 'youtube'
  AND featured_topic_youtube_id IS NOT NULL;

