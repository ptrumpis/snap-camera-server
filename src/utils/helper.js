import { SnapLensWebCrawler } from '@ptrumpis/snap-lens-web-crawler';
import { Config } from './config.js';
import * as DB from './db.js';
import * as Storage from './storage.js';

const relayTimeout = Config.app.relay.timeout;
const relayServer = Config.app.relay.server;

const storageServer = process.env.STORAGE_SERVER;
const modifyServerRegEx = new RegExp(Config.storage.urls.map(escapeRegExp).join('|'), 'gi');

const validShareUrls = Config.search.share_urls.map((url) => {
    url = escapeRegExp(url).replace(escapeRegExp('{UUID}'), '([a-f0-9]{32})').replace(/^https?:\/\//, 'http?s://');
    return `^${url}`;
}) || [];

const headers = {
    'User-Agent': 'SnapCamera/1.21.0.0 (Windows 10 Version 2009)',
    'Content-Type': 'application/json',
    'X-Installation-Id': 'default'
};

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function advancedSearch(searchTerm) {
    const uuid = parseLensUuid(searchTerm);
    if (uuid) {
        return await DB.searchLensByUuid(uuid);
    }

    if (isLensId(searchTerm)) {
        return await DB.getSingleLens(searchTerm);
    }

    if (searchTerm.startsWith('#') && searchTerm.length >= 2) {
        const hashtags = searchTerm.match(/#\w+/gi) || [];
        if (hashtags && hashtags.length) {
            return await DB.searchLensByTags(hashtags);
        }
    }

    return await DB.searchLensByName(searchTerm);
}

async function relayRequest(path, method = 'GET', body = null) {
    if (relayServer) {
        const url = `${relayServer}${path}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, relayTimeout);

        try {
            let requestInit = { method: method, headers: headers, signal: controller.signal };
            if (body) {
                requestInit.body = JSON.stringify(body);
            }

            const response = await fetch(url, requestInit);
            clearTimeout(timeout);

            if (response?.ok && response.body) {
                // don't use response.json()
                // to avoid json parse errors on empty/invalid data
                const data = await response.text();
                if (data) {
                    return JSON.parse(data);
                }
            }
        } catch (e) {
            clearTimeout(timeout);
            if (e.name === 'AbortError') {
                console.warn(`[Warning] Request to relay timed out: ${url}`);
            } else {
                console.error(`[Error] Request to relay failed: ${url} - ${e.message}`);
            }
        } finally {
            clearTimeout(timeout);
        }
    }

    return {};
}

async function getUnlockFromRelay(lensId) {
    const unlock = await relayRequest(`/vc/v1/explorer/unlock?uid=${lensId}`);
    if (typeof unlock === 'object' && unlock.lens_id && unlock.lens_url) {
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
    if (!Array.isArray(newLenses) || newLenses.length === 0) return lenses;
    if (!Array.isArray(lenses) || lenses.length === 0) return newLenses;

    const lensIds = new Set(lenses.map(lens => lens.unlockable_id));

    for (let i = newLenses.length - 1; i >= 0; i--) {
        if (lensIds.has(newLenses[i].unlockable_id)) {
            newLenses.splice(i, 1);
        }
    }

    lenses.push(...newLenses);
    return lenses;
}

function mergeLens(primary, secondary) {
    return SnapLensWebCrawler.mergeLensItems(primary, secondary);
}

function parseLensUuid(str, extractFromShareUrl = true) {
    if (typeof str === "string") {
        if (extractFromShareUrl && isUrl(str)) {
            const uuid = parseLensUuidFromShareUrl(str);
            if (uuid) {
                return uuid;
            }
        }

        const uuid = str.match(/[a-f0-9]{32}/gi)
        if (uuid && uuid[0]) {
            return uuid[0];
        }
    }

    return '';
}

function parseLensUuidFromShareUrl(url) {
    if (typeof url === 'string') {
        for (const shareUrl of validShareUrls) {
            try {
                const uuidMatch = url.match(new RegExp(shareUrl, 'i'));
                if (uuidMatch && uuidMatch[1]) {
                    return uuidMatch[1];
                }
            } catch (e) {
                console.error(`[Error] Trying to parse UUID from URL: ${url} - ${e.message}`);
            }
        }
    }

    return '';
}

function isLensUuid(str) {
    if (typeof str !== 'string') return false;
    const uuid = /^[a-f0-9]{32}$/gi;
    return uuid.test(str);
}

function isLensId(str) {
    if (typeof str !== 'string') return false;
    const id = /^[0-9]{11,16}$/gi;
    return id.test(str);
}

function isGroupId(str) {
    if (typeof str !== 'string') return false;
    var regex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    return regex.test(str);
}

function isUrl(url) {
    if (typeof url === 'string') {
        try {
            new URL(url);
            return true;
        } catch { }
    }

    return false;
}

function modifyResponseURLs(orgResponse) {
    if (storageServer) {
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

export { advancedSearch, relayRequest, getUnlockFromRelay, mirrorSearchResults, downloadLens, downloadUnlock, mergeLensesUnique, mergeLens, parseLensUuid, parseLensUuidFromShareUrl, isLensUuid, isLensId, isGroupId, isUrl, modifyResponseURLs, sleep };