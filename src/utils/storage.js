import path from "path"
import fetch from "node-fetch";
import * as dotenv from 'dotenv';
import * as fs from "fs/promises";
import * as DB from './db.js';

dotenv.config()

const storagePath = process.env.STORAGE_PATH;

async function savePreviews(url) {
    if (typeof url !== 'string' || !url.startsWith('http')) {
        return;
    }

    try {
        let previewUrl = new URL(url);

        // we need the exact same path to swap the file domain with our local storage domain
        // but we also want some security
        const validExtensions = ['.png', '.jpg', '.jpeg', '.mp4'];
        const filePath = path.normalize(path.dirname(previewUrl.pathname));
        const fileName = path.basename(previewUrl.pathname);
        const ext = path.extname(fileName);

        // actually valid files don't need to have an extension in their URL
        // TODO: check mime-type instead
        if (!validExtensions.includes(ext)) {
            console.error("Unsupported Preview file extension", ext, "in URL", url);
            return;
        }

        if (filePath.includes("/preview-media/thumbnail_seq")) {
            await downloadFile(previewUrl.toString(), filePath, fileName);
        } else if (filePath.endsWith('/preview-media/thumbnail_poster')) {
            await downloadFile(previewUrl.toString(), filePath, fileName);
        } else if (filePath.endsWith('/preview-media/thumbnail')) {
            await downloadFile(previewUrl.toString(), filePath, fileName);
        } else if (filePath.endsWith('/preview-media/final_poster')) {
            await downloadFile(previewUrl.toString(), filePath, fileName);
        } else if (filePath.endsWith('/preview-media/final')) {
            await downloadFile(previewUrl.toString(), filePath, fileName);
        } else {
            console.error("Unsupported Preview path", filePath, "in URL", url);
        }
    } catch (e) {
        console.error("savePreviews error:", e, url);
    }
}

async function savePNG(url) {
    if (typeof url !== 'string' || !url.startsWith('http')) {
        return;
    }

    try {
        let pngUrl = new URL(url);
        let filePath = path.normalize(path.dirname(pngUrl.pathname));
        let fileName = path.basename(pngUrl.pathname);

        // preserve original filepath
        if (filePath.endsWith("/png")) {
            await downloadFile(pngUrl.toString(), filePath, fileName);
        } else if (filePath.startsWith("/web/deeplink") && fileName === "snapcode" && pngUrl.searchParams.has('data') && pngUrl.searchParams.has('type')) {
            filePath = filePath.concat("/snapcode");
            fileName = pngUrl.searchParams.get('data').concat('.png');
            const regUuid = /^[a-f0-9]{32}\.png$/gi;
            if (regUuid.test(fileName)) {
                await downloadFile(pngUrl.toString(), filePath, fileName);
            } else {
                console.error("Dynamic png URL parsing missmtach", url);
            }
        } else {
            console.error("Unsupported PNG path", filePath, "in URL", url);
        }
    } catch (e) {
        console.error("savePNG error:", e, url);
    }
}

async function saveLens(id, url) {
    if (typeof url !== 'string' || !url.startsWith('http')) {
        return;
    }

    try {
        let lensUrl = new URL(url);
        let filePath = path.normalize(path.dirname(lensUrl.pathname));
        let fileName = path.basename(lensUrl.pathname);

        // whitelist all paths for now
        if (filePath.startsWith("/") && fileName) {
            await downloadFile(lensUrl.toString(), filePath, fileName);
            DB.markUnlockAsMirrored(id);
        } else {
            console.error("Unsupported Lens path", filePath, "in URL", url);
        }
    } catch (e) {
        console.error("saveLens error:", e, url);
    }
}

async function downloadFile(targetUrl, subDirectory, fileName) {
    const dir = storagePath.concat(path.normalize(subDirectory));
    const newFile = `${dir}/${fileName}`;

    const dirExists = await isDirectory(dir);
    if (!dirExists) {
        await fs.mkdir(dir, { recursive: true });
    }

    //console.log("Downloading", targetUrl);

    const response = await fetch(targetUrl);
    const buffer = await response.buffer();
    return await fs.writeFile(newFile, buffer);
}

async function isDirectory(path) {
    const result = await fs.stat(path).catch(err => {
        if (err) {
            return false;
        }
    });
    return !result ? result : result.isDirectory();
}

export { saveLens, savePNG, savePreviews };