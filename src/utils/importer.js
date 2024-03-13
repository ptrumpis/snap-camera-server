import JSZip from 'jszip';
import LensFileParser from '../lib/parser.js';
import { Config } from './config.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as zstd from 'fzstd';
import * as Storage from './storage.js';

dotenv.config();

const storageServer = process.env.STORAGE_SERVER;
const storagePath = process.env.STORAGE_PATH;
const mediaDir = process.env.MEDIA_DIR.replace(/^\/+/, '');
const mediaDirAlt = process.env.MEDIA_DIR_ALT.replace(/^\/+/, '');
const importDir = process.env.IMPORT_DIR.replace(/^\/+/, '');

const allowOverwrite = Config.import.allow_overwrite;
const zipArchive = Config.import.zip_archive;

async function importLens(lensFile, lensId, createMediaFiles = true) {
    let result = false;

    try {
        const destDirectory = storagePath.concat('/', importDir, '/', lensId);
        if (!(await Storage.isDirectory(destDirectory))) {
            await fs.mkdir(destDirectory, { recursive: true });
        }

        if (zipArchive) {
            const destFile = destDirectory.concat('/lens.zip');
            result = await storeLensAsZip(lensFile, destFile);
        } else {
            const destFile = destDirectory.concat('/lens.lns');
            result = await copyFile(lensFile, destFile);
        }

        if (result && createMediaFiles) {
            await copyDefaultMediaFiles(lensId);
        }
    } catch (e) {
        console.error(e);
    }

    return result;
}

async function copyFile(srcFile, destFile) {
    try {
        if (allowOverwrite || !(await Storage.isFile(destFile))) {
            await fs.copyFile(srcFile, destFile);
            return true;
        }
    } catch (e) {
        console.error(e);
    }

    return false;
}

async function storeLensAsZip(lensFile, destFile) {
    try {
        const lensFileParser = new LensFileParser();

        let data = await fs.readFile(lensFile);
        const compressedBuffer = data.buffer.slice(data.byteOffset, data.byteLength + data.byteOffset);
        lensFileParser.parseArrayBuffer(compressedBuffer, zstd);

        let zip = new JSZip();
        lensFileParser.files.forEach(function (file) {
            if (file.rawData.length > 0) {
                zip.file(file.fileName.replace(/^\/+/, ''), file.rawData, { createFolders: true });
            }
        });

        if (allowOverwrite || !(await Storage.isFile(destFile))) {
            const lensZip = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", platform: "UNIX" });
            await fs.writeFile(destFile, lensZip, { flag: 'w' });

            return true;
        }
    } catch (e) {
        console.error(e);
    }

    return false;
}

async function copyDefaultMediaFiles(lensId) {
    const srcDirectory = storagePath.concat('/', mediaDir);
    const destDirectory = storagePath.concat('/', importDir, '/', lensId);

    try {
        if (!(await Storage.isDirectory(destDirectory))) {
            await fs.mkdir(destDirectory, { recursive: true });
        }

        // copy all files inside default media directory to import sub directory
        const files = await fs.readdir(srcDirectory);
        for (const file of files) {
            const destFile = destDirectory.concat('/', file);
            if (!(await Storage.isFile(destFile))) {
                await fs.copyFile(srcDirectory.concat('/', file), destFile);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function exportFromAppSettings(settingsJson, lensIds = [], updateExisting = false) {
    let lenses = [];
    let unlocks = [];

    try {
        if (settingsJson?.lenses?.cache?.cachedInfo?.length) {
            // extract lens ID and signature
            const info = settingsJson.lenses.cache.cachedInfo;
            for (let i = 0; i < info.length; i++) {
                if (!info[i].lensId || typeof info[i].signature !== 'string') {
                    console.error("Unexpected JSON structure at index", i, info[i]);
                    return false;
                }

                // only import specified lens ids if passed as second argument
                let lensId = parseInt(info[i].lensId);
                if (!lensId || (lensIds && !lensIds.includes(lensId))) {
                    continue;
                }

                // icon, snapcode and thumbnail will point to a private copy of the default media
                // the copy is created for each lens with copyDefaultMediaFiles during import
                const basePath = storageServer.concat('/', importDir, '/', lensId, '/');

                // zip or lns archive
                const lensFile = zipArchive ? basePath.concat('lens.zip') : basePath.concat('lens.lns');

                // other (unused?) media files will point to default alt media placeholders
                const defaultMediaPath = storageServer.concat('/', mediaDirAlt, '/');

                let lens = updateExisting ? {
                    unlockable_id: lensId,
                    web_import: 0,
                    custom_import: 0,
                } : {
                    unlockable_id: lensId,
                    snapcode_url: basePath.concat('snapcode.png'),
                    user_display_name: "Import",
                    lens_name: lensId,
                    lens_tags: "",
                    lens_status: "Live",
                    deeplink: "",
                    icon_url: basePath.concat('icon.png'),
                    thumbnail_media_url: basePath.concat('thumbnail.jpg'),
                    // other media files
                    thumbnail_media_poster_url: defaultMediaPath.concat('thumbnail_poster.jpg'),
                    standard_media_url: defaultMediaPath.concat('standard.jpg'),
                    standard_media_poster_url: defaultMediaPath.concat('standard_poster.jpg'),
                    obfuscated_user_slug: "",
                    image_sequence: {},
                    web_import: 0,
                    custom_import: 0,
                };
                lenses.push(lens);

                let unlock = updateExisting ? {
                    lens_id: lensId,
                    lens_url: lensFile,
                    signature: info[i].signature,
                    web_import: 0,
                    custom_import: 0,
                } : {
                    lens_id: lensId,
                    lens_url: lensFile,
                    signature: info[i].signature,
                    hint_id: "",
                    additional_hint_ids: {},
                    web_import: 0,
                    custom_import: 0,
                };
                unlocks.push(unlock);
            }
        } else {
            console.log("No cached lenses inside settings.json");
            return false;
        }
    } catch (e) {
        console.error(e);
        return false;
    }

    // return database compatible array of objects
    return { lenses, unlocks };
}

export { importLens, exportFromAppSettings };