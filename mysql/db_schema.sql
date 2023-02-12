-- Database name provided in .env file
USE snapcamera;

CREATE TABLE IF NOT EXISTS `lenses` (
  `unlockable_id` varchar(14) NOT NULL,
  `uuid` varchar(32) NOT NULL DEFAULT '',
  `snapcode_url` varchar(300) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `user_display_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `lens_name` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `lens_status` varchar(32) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Live',
  `deeplink` varchar(300) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `icon_url` varchar(300) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `thumbnail_media_url` varchar(300) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `standard_media_url` varchar(300) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `obfuscated_user_slug` varchar(32) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `image_sequence` json DEFAULT NULL,
  `thumbnail_media_poster_url` varchar(300) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `standard_media_poster_url` varchar(300) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `mirrored` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`unlockable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `unlocks` (
  `lens_id` bigint(14) NOT NULL,
  `lens_url` varchar(300) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `signature` varchar(300) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `hint_id` varchar(200) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `additional_hint_ids` json DEFAULT NULL,
  `mirrored` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`lens_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
