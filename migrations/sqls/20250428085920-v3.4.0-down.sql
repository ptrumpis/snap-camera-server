/*
Downgrading from version 3.4.0
https://github.com/ptrumpis/snap-camera-server/releases/tag/v3.4.0
*/

ALTER TABLE `lenses` MODIFY COLUMN `lens_name` varchar(64) COLLATE 'utf8mb4_bin' NOT NULL;

ALTER TABLE `lenses` DROP COLUMN `lens_creator_search_tags`;
ALTER TABLE `lenses` DROP COLUMN `icon_url_alt`;
ALTER TABLE `lenses` DROP COLUMN `is_third_party`;
ALTER TABLE `lenses` DROP COLUMN `camera_facing_preference`;

ALTER TABLE `lenses` DROP INDEX `idx_lenses_user_name`, DROP COLUMN `user_name`;
ALTER TABLE `users` DROP INDEX `idx_users_user_name`, DROP COLUMN `user_name`;

ALTER TABLE `unlocks` DROP COLUMN `assets`;

DROP TABLE `assets`;
