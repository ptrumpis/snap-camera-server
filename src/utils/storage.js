import fetch from 'node-fetch';
import path from 'path';
import sharp from 'sharp';
import { Config } from './config.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';

dotenv.config();

const storagePath = process.env.STORAGE_PATH;
const storageServer = process.env.STORAGE_SERVER;
const ignoreAltMedia = Config.app.flag.ignore_alt_media;
const ignoreImgSequence = Config.app.flag.ignore_img_sequence;

async function saveLens(lens) {
    if (!lens) {
        return false;
    }

    if (lens.icon_url) {
        await savePNG(lens.icon_url);
    }
    if (lens.snapcode_url) {
        await savePNG(lens.snapcode_url);
    }
    if (lens.thumbnail_media_url) {
        await savePreviews(lens.thumbnail_media_url);
    }
    if (lens.thumbnail_media_poster_url) {
        await savePreviews(lens.thumbnail_media_poster_url);
    }

    if (!ignoreAltMedia) {
        if (lens.standard_media_url) {
            await savePreviews(lens.standard_media_url);
        }
        if (lens.standard_media_poster_url) {
            await savePreviews(lens.standard_media_poster_url);
        }

        if (!ignoreImgSequence) {
            if (lens.image_sequence && lens.image_sequence?.size) {
                let { url_pattern, size } = lens.image_sequence;
                for (let i = 0; i < size; i++) {
                    await savePreviews(url_pattern.replace('%d', i));
                }
            }
        }
    }

    return true;
}

async function savePreviews(url) {
    if (typeof url !== 'string' || !url.startsWith('http') || url.startsWith(storageServer)) {
        return false;
    }

    try {
        let previewUrl = new URL(url);

        // we need the exact same path to swap the file domain with our local storage domain
        // but we also want some security
        const validExtensions = ['.png', '.jpg', '.jpeg', '.mp4', '.webp'];
        const filePath = path.normalize(path.dirname(previewUrl.pathname));
        const fileName = path.basename(previewUrl.pathname);
        const ext = path.extname(fileName);

        // actually valid files don't need to have an extension in their URL
        // TODO: check mime-type instead
        if (!validExtensions.includes(ext) && !fileName.endsWith('360_640')) {
            console.error("Unsupported Preview file extension", ext, "in URL", url);
            return false;
        }

        // TODO: whitelist all static urls

        if (filePath.includes('/preview-media/thumbnail_seq')) {
            // community-lens.storage.googleapis.com
            await downloadFile(previewUrl.toString(), filePath, fileName);
        } else if (filePath.startsWith('/previewimage')) {
            // lens-storage.storage.googleapis.com
            const file = await downloadFile(previewUrl.toString(), filePath, fileName);
        } else if (filePath.startsWith('/previewvideo')) {
            // lens-storage.storage.googleapis.com
            const file = await downloadFile(previewUrl.toString(), filePath, fileName);
        } else if (filePath.startsWith('/previewmedia')) {
            // lens-preview-storage.storage.googleapis.com
            const file = await downloadFile(previewUrl.toString(), filePath, fileName);
            await convertWebpToPng(file);
        } else if (filePath.endsWith('/preview-media/thumbnail_poster')) {
            // community-lens.storage.googleapis.com
            await downloadFile(previewUrl.toString(), filePath, fileName);
        } else if (filePath.endsWith('/preview-media/thumbnail')) {
            // community-lens.storage.googleapis.com
            await downloadFile(previewUrl.toString(), filePath, fileName);
        } else if (filePath.endsWith('/preview-media/final_poster')) {
            // community-lens.storage.googleapis.com
            await downloadFile(previewUrl.toString(), filePath, fileName);
        } else if (filePath.endsWith('/preview-media/final')) {
            // community-lens.storage.googleapis.com
            await downloadFile(previewUrl.toString(), filePath, fileName);
        } else {
            console.error("Unsupported Preview path", filePath, "in URL", url);
            return false;
        }
    } catch (e) {
        console.error("savePreviews error:", e, url);
        return false;
    }

    return true;
}

// saves snapcodes and icons, supports PNG and WEBP format as of v3.*
async function savePNG(url) {
    if (typeof url !== 'string' || !url.startsWith('http') || url.startsWith(storageServer)) {
        return false;
    }

    try {
        let pngUrl = new URL(url);

        // preserve original filepath
        let filePath = path.normalize(path.dirname(pngUrl.pathname));
        let fileName = path.basename(pngUrl.pathname);

        // TODO: whitelist all static urls

        if (filePath.endsWith("/png")) {
            // snapcodes.storage.googleapis.com
            // lens-storage.storage.googleapis.com
            await downloadFile(pngUrl.toString(), filePath, fileName);
        } else if (filePath.endsWith("/webp")) {
            // lens-storage.storage.googleapis.com
            const file = await downloadFile(pngUrl.toString(), filePath, fileName);
            await convertWebpToPng(file);
        } else if (filePath.endsWith("/3")) {
            // bolt-gcdn.sc-cdn.net
            await downloadFile(pngUrl.toString(), filePath, fileName);
        } else if (filePath.startsWith("/web/deeplink") && fileName === "snapcode" && pngUrl.searchParams.has('data') && pngUrl.searchParams.has('type')) {
            // app.snapchat.com
            filePath = filePath.concat("/snapcode");
            fileName = pngUrl.searchParams.get('data').concat('.png');
            const regUuid = /^[a-f0-9]{32}\.png$/gi;
            if (regUuid.test(fileName)) {
                await downloadFile(pngUrl.toString(), filePath, fileName);
            } else {
                console.error("Dynamic png URL parsing missmtach", url);
                return false;
            }
        } else {
            console.error("Unsupported PNG path", filePath, "in URL", url);
            return false;
        }
    } catch (e) {
        console.error("savePNG error:", e, url);
        return false;
    }

    return true;
}

async function saveUnlock(url) {
    if (typeof url !== 'string' || !url.startsWith('http') || url.startsWith(storageServer)) {
        return false;
    }

    try {
        let lensUrl = new URL(url);
        let filePath = path.normalize(path.dirname(lensUrl.pathname));
        let fileName = path.basename(lensUrl.pathname);

        // whitelist all paths for now
        if (filePath.startsWith("/") && fileName) {
            await downloadFile(lensUrl.toString(), filePath, fileName);
        } else {
            console.error("Unsupported Lens path", filePath, "in URL", url);
            return false;
        }
    } catch (e) {
        console.error("saveUnlock error:", e, url);
        return false;
    }

    return true;
}

async function downloadFile(targetUrl, subDirectory, fileName) {
    const dir = storagePath.concat(path.normalize(subDirectory));
    const newFile = `${dir}/${fileName}`;

    if (await isFile(newFile)) {
        return false;
    }

    const dirExists = await isDirectory(dir);
    if (!dirExists) {
        await fs.mkdir(dir, { recursive: true });
    }

    console.log("Downloading", targetUrl);

    try {
        const response = await fetch(targetUrl);
        const buffer = await response.arrayBuffer();
        await fs.writeFile(newFile, Buffer.from(buffer));
    } catch (e) {
        console.error("downloadFile error:", e, targetUrl);
        return false;
    }

    return newFile;
}

async function convertWebpToPng(file) {
    try {
        if (typeof file === 'string' && file.endsWith('.webp')) {
            const fileAsPng = file.substring(0, file.lastIndexOf('.')).concat('.png');

            console.log("Converting WEBP to PNG", file);

            await sharp(file).toFile(fileAsPng);
            await fs.unlink(file);
            return fileAsPng;
        }
    } catch (e) {
        console.error("convertWebpToPng error:", e, file);
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

export { saveLens, saveUnlock, isFile, isDirectory, fileStat };