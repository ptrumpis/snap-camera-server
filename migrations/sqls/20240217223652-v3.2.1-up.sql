/*
Upgrading to version 3.2.1
https://github.com/ptrumpis/snap-camera-server/releases/tag/v3.2.1
*/

UPDATE `lenses` SET `icon_url` = '' WHERE `icon_url` LIKE '%/snap-camera-media/icon.png';
UPDATE `lenses` SET `snapcode_url` = '' WHERE `snapcode_url` LIKE '%/snap-camera-media/snapcode.png';
UPDATE `lenses` SET `thumbnail_media_url` = '' WHERE `thumbnail_media_url` LIKE '%/snap-camera-media/thumbnail.jpg';
