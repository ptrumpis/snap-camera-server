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
        try {
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
        } catch (e) {
            // catch rare fetch errors
            console.error(e);
        }
    }
    return {};
}

async function relayPostRequest(path, body) {
    if (relayServer) {
        try {
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
        } catch (e) {
            // catch rare fetch errors
            console.error(e);
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
            if (str.startsWith("https://lens.snapchat.com/")) {
                let webUrl = new URL(str);
                uuid = webUrl.pathname.replace(/^\/+/, '');
            } else if (str.startsWith("https://www.snapchat.com/unlock/?")) {
                let deeplinkURL = new URL(str);
                uuid = deeplinkURL.searchParams.get('uuid')
            }
        } catch (e) {
            console.error(e, str);
        }

        // UUID's have 32 characters
        const regUuid = /^[a-f0-9]{32}$/gi;
        if (regUuid.test(uuid)) {
            return uuid;
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