/*
Upgrading to version 3.3.1
https://github.com/ptrumpis/snap-camera-server/releases/tag/v3.3.1
*/
UPDATE `unlocks` SET `web_import` = 1 WHERE `lens_url` LIKE 'https://bolt-gcdn.sc-cdn.net/%' AND `custom_import` = 0;
UPDATE `lenses` SET `web_import` = 1 WHERE `unlockable_id` IN (SELECT `lens_id` FROM `unlocks` WHERE `web_import` = 1);

DELETE FROM `unlocks` WHERE `lens_url` = '';
