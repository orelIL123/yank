-- Initialize featured topic in app_config
-- This script ensures the app_config table has the featured topic fields initialized

-- Update the existing config row with default featured topic values
UPDATE app_config 
SET 
  featured_topic_enabled = COALESCE(featured_topic_enabled, false),
  featured_topic_title = COALESCE(featured_topic_title, ''),
  featured_topic_description = COALESCE(featured_topic_description, ''),
  featured_topic_type = COALESCE(featured_topic_type, 'image'),
  featured_topic_image_url = COALESCE(featured_topic_image_url, ''),
  featured_topic_youtube_id = COALESCE(featured_topic_youtube_id, ''),
  featured_topic_video_url = COALESCE(featured_topic_video_url, ''),
  featured_topic_link_url = COALESCE(featured_topic_link_url, ''),
  featured_topic_button_text = COALESCE(featured_topic_button_text, 'למידע נוסף')
WHERE id = 'config';

-- Verify the update
SELECT 
  id,
  featured_topic_enabled,
  featured_topic_title,
  featured_topic_type
FROM app_config 
WHERE id = 'config';

