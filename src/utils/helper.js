import fetch from 'node-fetch';
import { Headers } from 'node-fetch';
import { Config } from './config.js';
import * as dotenv from 'dotenv';
import * as DB from './db.js';
import * as Storage from './storage.js';

dotenv.config();

const relayTimeout = Config.app.relay.timeout;
const relayServer = Config.app.relay.server;

const storageServer = process.env.STORAGE_SERVER;
const modifyServerRegEx = new RegExp(Config.storage.urls.map(escapeRegExp).join('|'), 'gi');

const shareUrlUuid = escapeRegExp('{UUID}');
const shareUrls = Config.search.share_urls.map(escapeRegExp);

const headers = new Headers({
    'User-Agent': 'SnapCamera/1.21.0.0 (Windows 10 Version 2009)',
    'Content-Type': 'application/json',
    'X-Installation-Id': 'default'
});

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function advancedSearch(searchTerm) {
    // search lens by 32 character UUID
    const uuid = parseLensUuid(searchTerm);
    if (uuid) {
        return await DB.searchLensByUuid(uuid);
    }

    // lens ID's have 11 to 16 digits
    const regLensId = /^[0-9]{11,16}$/gi;
    if (regLensId.test(searchTerm)) {
        return await DB.getSingleLens(searchTerm);
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

async function relayRequest(path, method = 'GET', body = null) {
    if (relayServer) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, relayTimeout);

        try {
            let requestInit = { method: method, headers, signal: controller.signal };
            if (body) {
                requestInit.body = body;
            }

            const response = await fetch(`${relayServer}${path}`, requestInit);
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
        } catch (e) {
            // catch rare fetch errors
            console.error(e);
        } finally {
            clearTimeout(timeout);
        }
    }
    return {};
}

async function getUnlockFromRelay(lensId) {
    const unlock = await relayRequest(`/vc/v1/explorer/unlock?uid=${lensId}`);
    if (unlock && unlock.lens_id && unlock.lens_url) {
        return unlock;
    }
    return null;
}

async function mirrorSearchResults(relayResults) {
    DB.insertLens(relayResults);
    for (let i = 0; i < relayResults.length; i++) {
        if (relayResults[i].unlockable_id) {
            let unlock = await getUnlockFromRelay(relayResults[i].unlockable_id);
            if (unlock) {
                await DB.insertUnlock(unlock);
            }
        }
    }
    relayResults = null;
}

async function downloadLens(lens) {
    const result = await Storage.saveLens(lens);
    if (result) {
        DB.markLensAsMirrored(lens.unlockable_id);
    }
    return result;
}

async function downloadUnlock(lensId, lensUrl) {
    const result = await Storage.saveUnlock(lensUrl);
    if (result) {
        DB.markUnlockAsMirrored(lensId);
    }
    return result;
}

function mergeLensesUnique(lenses, newLenses) {
    if (newLenses && newLenses.length) {
        if (lenses && lenses.length) {
            let lensIds = [];
            for (let i = 0; i < lenses.length; i++) {
                lensIds.push(lenses[i].unlockable_id);
            }

            for (let j = 0; j < newLenses.length; j++) {
                if (lensIds.indexOf(newLenses[j].unlockable_id) !== -1) {
                    // modify original array
                    newLenses.splice(j, 1);
                    j--;
                }
            }

            lenses = lenses.concat(newLenses);
        } else {
            lenses = newLenses;
        }
    }

    return lenses;
}

function parseLensUuid(str, urlExtraction = true) {
    if (typeof str === "string") {
        if (urlExtraction && isUrl(str)) {
            // try to extract from known share URL's
            // otherwise use global extraction attempt
            for (const url of shareUrls) {
                try {
                    const match = str.match(new RegExp(url.replace(shareUrlUuid, '([a-f0-9]{32})'), 'i'));
                    if (match && match[1]) {
                        return parseLensUuid(match[1], false);
                    }
                } catch (e) {
                    console.error(e, str, url);
                }
            }
        }

        // global extraction attempt
        // valid lens UUID's have 32 hexadecimal characters
        const uuid = str.match(/[a-f0-9]{32}/gi)
        if (uuid && uuid[0]) {
            return uuid[0];
        }
    }

    return '';
}

function isUrl(url) {
    try {
        new URL(url);
    } catch (e) {
        return false;
    }
    return true;
}

function modifyResponseURLs(orgResponse) {
    if (storageServer) {
        // point orignal URL's to our local storage server
        const response = JSON.stringify(orgResponse);
        return JSON.parse(response.replace(modifyServerRegEx, storageServer));
    }
    return orgResponse;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export { advancedSearch, relayRequest, getUnlockFromRelay, mirrorSearchResults, downloadLens, downloadUnlock, mergeLensesUnique, parseLensUuid, modifyResponseURLs, sleep };