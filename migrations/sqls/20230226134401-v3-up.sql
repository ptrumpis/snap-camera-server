/*
Upgrading to version 3.0.0
https://github.com/ptrumpis/snap-camera-server/releases/tag/v3.0.0
*/
ALTER TABLE `lenses` MODIFY COLUMN `mirrored` tinyint(1) unsigned NOT NULL DEFAULT 0;
ALTER TABLE `unlocks` MODIFY COLUMN `mirrored` tinyint(1) unsigned NOT NULL DEFAULT 0;

ALTER TABLE `lenses` ADD COLUMN `web_import` tinyint(1) unsigned NOT NULL DEFAULT 0;
ALTER TABLE `unlocks` ADD COLUMN `web_import` tinyint(1) unsigned NOT NULL DEFAULT 0;

ALTER TABLE `lenses` MODIFY COLUMN `lens_name` varchar(64) COLLATE 'utf8mb4_bin' NOT NULL;

CREATE TABLE IF NOT EXISTS `users` (
   `obfuscated_user_slug` varchar(32) NOT NULL,
   `user_display_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    PRIMARY KEY (`obfuscated_user_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
