/*
Downgrading from version 3.0.0
https://github.com/ptrumpis/snap-camera-server/releases/tag/v3.0.0
*/
ALTER TABLE `lenses` MODIFY COLUMN `mirrored` tinyint(1) unsigned NOT NULL DEFAULT '0';
ALTER TABLE `unlocks` MODIFY COLUMN `mirrored` tinyint(1) unsigned NOT NULL DEFAULT '0';

ALTER TABLE `lenses` DROP COLUMN `web_import`;
ALTER TABLE `unlocks` DROP COLUMN `web_import`;

ALTER TABLE `lenses` MODIFY COLUMN `lens_name` varchar(64) COLLATE 'utf8_unicode_ci' NOT NULL;

ALTER TABLE `lenses` MODIFY COLUMN `unlockable_id` varchar(14) NOT NULL;
ALTER TABLE `unlocks` MODIFY COLUMN `lens_id` bigint(14) NOT NULL;

DROP TABLE `users`;