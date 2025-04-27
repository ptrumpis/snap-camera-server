import { SnapLensWebCrawler } from '@ptrumpis/snap-lens-web-crawler';
import * as fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { Config } from './config.js';

const storagePath = process.env.STORAGE_PATH;
const storageServer = process.env.STORAGE_SERVER;
const ignoreAltMedia = Config.app.flag.ignore_alt_media;
const ignoreImgSequence = Config.app.flag.ignore_img_sequence;
const validStorageUrls = Config.storage.urls || [];

const Crawler = new SnapLensWebCrawler(Config.storage.crawler);

async function saveLens(lens) {
    if (!lens) {
        return false;
    }

    let hasThumbnail = false;

    if (lens.icon_url) {
        await saveRemoteFile(lens.icon_url);
    }
    if (lens.snapcode_url) {
        await saveRemoteFile(lens.snapcode_url);
    }
    if (lens.thumbnail_media_url) {
        hasThumbnail = await saveRemoteFile(lens.thumbnail_media_url)
    }
    if (lens.thumbnail_media_poster_url) {
        hasThumbnail = await saveRemoteFile(lens.thumbnail_media_poster_url) || hasThumbnail;
    }

    if (!hasThumbnail && lens.image_sequence?.url_pattern) {
        hasThumbnail = await saveRemoteFile(lens.image_sequence.url_pattern.replace('%d', 1));
    }

    if ((!ignoreAltMedia || !hasThumbnail) && lens.standard_media_poster_url) {
        hasThumbnail = await saveRemoteFile(lens.standard_media_poster_url) || hasThumbnail;
    }
    if ((!ignoreAltMedia || !hasThumbnail) && lens.standard_media_url) {
        hasThumbnail = await saveRemoteFile(lens.standard_media_url) || hasThumbnail;
    }

    if (!ignoreAltMedia && !ignoreImgSequence) {
        if (lens.image_sequence?.url_pattern && lens.image_sequence?.size) {
            for (let i = 0; i < lens.image_sequence.size; i++) {
                await saveRemoteFile(lens.image_sequence.url_pattern.replace('%d', i));
            }
        }
    }

    return true;
}

async function saveUnlock(url) {
    if (!validateRemoteOrigin(url)) {
        return false;
    }

    try {
        let lensUrl = new URL(url);
        let filePath = path.normalize(path.dirname(lensUrl.pathname));
        let fileName = path.basename(lensUrl.pathname);

        return await downloadFile(lensUrl.toString(), filePath, fileName);
    } catch (e) {
        console.error(`[Error] Saving unlock failed: ${url} - ${e.message}`);
    }

    return false;
}

async function saveRemoteFile(url) {
    if (!validateRemoteOrigin(url)) {
        return false;
    }

    try {
        const fileUrl = new URL(url);

        let filePath = path.normalize(path.dirname(fileUrl.pathname));
        let fileName = path.basename(fileUrl.pathname);

        // special dynamic url search param handling
        if (filePath.startsWith("/web/deeplink") && fileName === "snapcode" && fileUrl.searchParams.has('data') && fileUrl.searchParams.has('type')) {
            const regUuid = /^[a-f0-9]{32}\.png$/gi;
            const dataParam = fileUrl.searchParams.get('data');
            if (!regUuid.test(dataParam)) {
                return false;
            }

            // enforce png file type
            fileUrl.searchParams.set('type', 'png');
            filePath = path.join(filePath, 'snapcode');
            fileName = dataParam.concat('.png');
        }

        const file = await downloadFile(fileUrl.toString(), filePath, fileName);
        if (typeof file === 'string') {
            await convertWebpToPng(file);
            return true;
        }
    } catch (e) {
        console.error(`[Error] Saving remote file failed: ${url} - ${e.message}`);
    }

    return false;
}

function validateRemoteOrigin(url) {
    if (typeof url !== 'string' || !url.startsWith('http') || url.startsWith(storageServer)) {
        return false;
    }

    for (const storageUrl of validStorageUrls) {
        if (url.startsWith(storageUrl)) {
            return true;
        }
    }

    return false;
}

async function downloadFile(targetUrl, subDirectory, fileName) {
    try {
        const subFilePath = path.join(subDirectory, fileName);
        if (await isSubFilePathPresent(subFilePath)) {
            return false;
        }

        console.info(`[Downloading] ${targetUrl}`);

        const storageFilePath = path.join(storagePath, 'storage', subFilePath);
        const result = await Crawler.downloadFile(targetUrl, storageFilePath);
        if (result === true) {
            return storageFilePath;
        }
    } catch (e) {
        console.error(`[Error] File download failed: ${targetUrl} - ${e.message}`);
    }

    return false;
}

async function convertWebpToPng(file) {
    try {
        if (typeof file === 'string' && file.endsWith('.webp')) {
            const fileAsPng = file.replace(/\.webp$/, '.png');

            console.info(`[Info] Converting .webp to .png: ${fileAsPng}`);

            await sharp(file).toFile(fileAsPng);
            await fs.unlink(file);
            return fileAsPng;
        }
    } catch (e) {
        console.error(`[Error] Converting .webp to .png failed: ${file} - ${e.message}`);
    }
    return false;
}

async function isSubFilePathPresent(subFilePath) {
    try {
        // check current storage location and legacy location before v3.4.0
        // also check if .webp files are present as .png
        const tryFiles = new Set([
            path.join(storagePath, 'storage', path.normalize(subFilePath)).replace(/\.webp$/, '.png'),
            path.join(storagePath, path.normalize(subFilePath)).replace(/\.webp$/, '.png'),
            path.join(storagePath, 'storage', path.normalize(subFilePath)),
            path.join(storagePath, path.normalize(subFilePath)),
        ]);

        for (const file of tryFiles) {
            if (await isFile(file)) {
                return true;
            }
        }
    } catch (e) {
        console.error(`[Error] Sub file path check failed: ${subFilePath} - ${e.message}`);
    }

    return false;
}

async function isFile(filePath) {
    const result = await fileStat(filePath);
    return !result ? result : result.isFile();
}

async function isDirectory(filePath) {
    const result = await fileStat(filePath);
    return !result ? result : result.isDirectory();
}

async function fileStat(filePath) {
    const result = await fs.stat(filePath).catch(err => {
        if (err) {
            return false;
        }
    });
    return result;
}

export { saveLens, saveUnlock, isFile, isDirectory };