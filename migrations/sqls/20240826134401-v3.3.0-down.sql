/*
Downgrading from version 3.3.0
https://github.com/ptrumpis/snap-camera-server/releases/tag/v3.3.0
*/
ALTER TABLE `lenses` DROP COLUMN `custom_import`;
ALTER TABLE `unlocks` DROP COLUMN `custom_import`;
