import fetch from "node-fetch";
import { Headers } from 'node-fetch';
import * as dotenv from 'dotenv';
import * as DB from './db.js';
import * as Storage from './storage.js';

dotenv.config();

const relayServer = process.env.RELAY_SERVER;
const storageServer = process.env.STORAGE_SERVER;

const modifyServer = [
    'https://snapcodes.storage.googleapis.com',
    'https://lens-storage.storage.googleapis.com',
    'https://lens-preview-storage.storage.googleapis.com',
    'https://community-lens.storage.googleapis.com',
    'https://storage.googleapis.com',
    'https://app.snapchat.com',
    'https://bolt-gcdn.sc-cdn.net',
    'https://s3.amazonaws.com',
];

const headers = new Headers({
    'User-Agent': 'SnapCamera/1.21.0.0 (Windows 10 Version 2009)',
    'Content-Type': 'application/json',
    'X-Installation-Id': 'default'
});

async function advancedSearch(searchTerm) {
    try {
        // support search by lens URL
        if (searchTerm.startsWith("https://lens.snapchat.com/")) {
            let myURL = new URL(searchTerm);
            searchTerm = myURL.pathname.replace(/^\/+/, '');
        } else if (searchTerm.startsWith("https://www.snapchat.com/unlock/?")) {
            let myURL = new URL(searchTerm);
            searchTerm = myURL.searchParams.get('uuid')
        }
    } catch (e) {
        console.error(e, searchTerm);
    }

    // UUID's have 32 characters
    const regUuid = /^[a-f0-9]{32}$/gi;
    if (regUuid.test(searchTerm)) {
        return await DB.searchLensByUuid(searchTerm);
    }

    // lens ID's have 11 digits but we support +/- 1
    const regLensId = /^[0-9]{10,12}$/gi;
    if (regLensId.test(searchTerm)) {
        return await DB.searchLensById(searchTerm);
    }

    // search lens by custom hashtags
    if (searchTerm.startsWith('#') && searchTerm.length >= 2) {
        const hashtags = searchTerm.match(/#\w+/gi) || [];
        if (hashtags && hashtags.length) {
            return await DB.searchLensByTags(hashtags);
        }
    }

    // search by lens name and creator name
    return await DB.searchLensByName(searchTerm);
}

async function relayGetRequest(path) {
    if (relayServer) {
        const response = await fetch(`${relayServer}${path}`, { method: 'GET', headers });
        if (response.status === 200) {
            try {
                // avoid json parse errors on empty data
                const data = await response.text();
                if (data) {
                    return JSON.parse(data);
                }
            } catch (e) {
                console.error(e);
            }
        }
    }
    return {};
}

async function relayPostRequest(path, body) {
    if (relayServer) {
        const response = await fetch(`${relayServer}${path}`, { method: 'POST', body: JSON.stringify(body), headers });
        if (response.status === 200) {
            try {
                // avoid json parse errors on empty data
                const data = await response.text();
                if (data) {
                    return JSON.parse(data);
                }
            } catch (e) {
                console.error(e);
            }
        }
    }
    return {};
}

async function mirrorLens(lens) {
    const result = await Storage.saveLens(lens);
    if (result) {
        DB.markLensAsMirrored(lens.unlockable_id);
    }
    return result;
}

async function mirrorUnlock(lensId, lensUrl) {
    const result = await Storage.saveUnlock(lensId, lensUrl);
    if (result) {
        DB.markUnlockAsMirrored(lensId);
    }
    return result;
}

async function getUnlockUrl(unlockable_id, forceMirror = false) {
    let lens = await DB.getLensUnlock(unlockable_id);
    if (lens && lens[0]) {
        return lens[0].lens_url;
    }

    lens = await relayGetRequest(`/vc/v1/explorer/unlock?uid=${unlockable_id}`);
    if (lens && lens['lens_id']) {
        await DB.insertUnlock(lens, forceMirror);
        return lens.lens_url;
    }

    return '';
}

function extractUuidFromDeeplink(deeplink) {
    if (typeof deeplink === "string" && deeplink.startsWith("https://www.snapchat.com/unlock/?")) {
        let deeplinkURL = new URL(deeplink);
        const regexExp = /^[a-f0-9]{32}$/gi;
        if (regexExp.test(deeplinkURL.searchParams.get('uuid'))) {
            return deeplinkURL.searchParams.get('uuid');
        }
    }
    return '';
}

function modifyResponseURLs(orgResponse) {
    if (storageServer) {
        // point all known hosting domains to our local storage server
        const regEx = new RegExp(modifyServer.join('|'), 'gi');
        const response = JSON.stringify(orgResponse);
        return JSON.parse(response.replaceAll(regEx, storageServer));
    }
    return orgResponse;
}

function relay() {
    if (relayServer) {
        return true;
    } else {
        return false;
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export { advancedSearch, relayGetRequest, relayPostRequest, mirrorLens, mirrorUnlock, getUnlockUrl, extractUuidFromDeeplink, modifyResponseURLs, relay, sleep };