import fetch from 'node-fetch';
import { Headers } from 'node-fetch';
import { Config } from './config.js';
import * as dotenv from 'dotenv';
import * as DB from './db.js';
import * as Storage from './storage.js';

dotenv.config();

const relayTimeout = process.env.RELAY_TIMEOUT || 6000;
const relayServer = process.env.RELAY_SERVER;
const storageServer = process.env.STORAGE_SERVER;

const modifyServer = Config?.storage?.urls || [
    'https://app.snapchat.com',
    'https://bolt-gcdn.sc-cdn.net',
    'https://community-lens.storage.googleapis.com',
    'https://lens-preview-storage.storage.googleapis.com',
    'https://lens-storage.storage.googleapis.com',
    'https://snapcodes.storage.googleapis.com',
    'https://storage.googleapis.com',
];

const headers = new Headers({
    'User-Agent': 'SnapCamera/1.21.0.0 (Windows 10 Version 2009)',
    'Content-Type': 'application/json',
    'X-Installation-Id': 'default'
});

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

async function relayGetRequest(path) {
    if (relayServer) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, relayTimeout);

        try {
            const response = await fetch(`${relayServer}${path}`, { method: 'GET', headers, signal: controller.signal });
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

async function relayPostRequest(path, body) {
    if (relayServer) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, relayTimeout);

        try {
            const response = await fetch(`${relayServer}${path}`, { method: 'POST', body: JSON.stringify(body), headers, signal: controller.signal });
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
    const unlock = await relayGetRequest(`/vc/v1/explorer/unlock?uid=${lensId}`);
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

function parseLensUuid(str) {
    if (typeof str === "string") {
        let uuid = '';
        try {
            // try to extract from known urls
            // otherwise use global extraction attempt below
            if (str.startsWith("https://lens.snapchat.com/")) {
                let webUrl = new URL(str);
                uuid = webUrl.pathname.replace(/^\/+/, '');
            } else if (str.startsWith("https://www.snapchat.com/unlock/?")) {
                let deeplinkURL = new URL(str.replace(/\u0026/g, '&')); // json encoding fix
                if (deeplinkURL.searchParams.has('uuid')) {
                    uuid = deeplinkURL.searchParams.get('uuid')
                }
            }

            if (uuid) {
                return parseLensUuid(uuid);
            }
        } catch (e) {
            console.error(e, str);
        }

        // global extraction attempt
        // UUID's have 32 hexadecimal characters
        uuid = str.match(/[a-f0-9]{32}/gi)
        if (uuid && uuid[0]) {
            return uuid[0];
        }
    }

    return '';
}

// convert URL array to regular expression string and escape dots
const modifyServerRegEx = new RegExp(modifyServer.join('|').replace(/\./g, '\\.'), 'gi');

function modifyResponseURLs(orgResponse) {
    if (storageServer) {
        // point all orignal URL's to our local storage server
        const response = JSON.stringify(orgResponse);
        return JSON.parse(response.replace(modifyServerRegEx, storageServer));
    }
    return orgResponse;
}

function relay() {
    if (relayServer && relayServer.toUpperCase() !== 'FALSE') {
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

function isOptionTrue(envOptionName) {
    if (process.env[envOptionName] && (process.env[envOptionName].toUpperCase() === 'TRUE' || process.env[envOptionName] == '1')) {
        return true;
    }
    return false;
}

export { advancedSearch, relayGetRequest, relayPostRequest, getUnlockFromRelay, mirrorSearchResults, downloadLens, downloadUnlock, mergeLensesUnique, parseLensUuid, modifyResponseURLs, relay, sleep, isOptionTrue };