/*
Upgrading to version 3.4.0
https://github.com/ptrumpis/snap-camera-server/releases/tag/v3.4.0
*/

ALTER TABLE `lenses` MODIFY COLUMN `lens_name` varchar(96) COLLATE 'utf8mb4_bin' NOT NULL;

ALTER TABLE `lenses` ADD COLUMN `lens_creator_search_tags` json DEFAULT NULL AFTER `lens_name`;
ALTER TABLE `lenses` ADD COLUMN `icon_url_alt` varchar(300) COLLATE utf8_unicode_ci NOT NULL DEFAULT '' AFTER `icon_url`;
ALTER TABLE `lenses` ADD COLUMN `is_third_party` tinyint(1) unsigned NOT NULL DEFAULT 0 AFTER `lens_status`;
ALTER TABLE `lenses` ADD COLUMN `camera_facing_preference` tinyint(1) unsigned NOT NULL DEFAULT 0 AFTER `is_third_party`;

ALTER TABLE `lenses` ADD COLUMN `user_name` varchar(16) COLLATE 'utf8mb4_bin' NOT NULL DEFAULT '' AFTER `user_display_name`,
ADD INDEX `idx_lenses_user_name` (`user_name`);

ALTER TABLE `users` ADD COLUMN `user_name` varchar(16) COLLATE 'utf8mb4_bin' NOT NULL DEFAULT '',
ADD INDEX `idx_users_user_name` (`user_name`);

ALTER TABLE `unlocks` ADD COLUMN `assets` json DEFAULT NULL AFTER `additional_hint_ids`;

CREATE TABLE IF NOT EXISTS `assets` (
  `asset_id` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TEMPORARY TABLE tmp_duplicate_users AS
SELECT user_display_name
FROM users
GROUP BY user_display_name
HAVING COUNT(*) > 1;

UPDATE lenses
SET obfuscated_user_slug = ''
WHERE web_import = 1
AND user_display_name IN (SELECT user_display_name FROM tmp_duplicate_users);

DELETE FROM users
WHERE user_display_name IN (SELECT user_display_name FROM tmp_duplicate_users);

DROP TEMPORARY TABLE tmp_duplicate_users;
