import mysql from 'mysql2';
import { Config } from './config.js';
import * as dotenv from 'dotenv';
import * as Util from './helper.js';

dotenv.config();

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const storageServer = process.env.STORAGE_SERVER;
const mediaDir = process.env.MEDIA_DIR.replace(/^\/+/, '');
const defaultMediaPath = storageServer.concat('/', mediaDir, '/');

const enableWebSource = Config.app.flag.enable_web_source;
const ignoreAltMedia = Config.app.flag.ignore_alt_media;
const ignoreImgSequence = Config.app.flag.ignore_img_sequence;

const placeholderThumbnail = Config.media.placeholder.thumbnail;
const placeholderSnapcode = Config.media.placeholder.snapcode;
const placeholderIcon = Config.media.placeholder.icon;

function webImportFilter(arr) {
    if (!enableWebSource) {
        return arr.filter(element => (!element.web_import));
    }
    return arr;
}

function lensesMediaFilter(lenses) {
    return lenses.map(lens => {
        // filter out ignored media files according to config.yml
        if (ignoreAltMedia) {
            lens.standard_media_url = '';
            lens.standard_media_poster_url = '';
            lens.image_sequence = {};
        } else if (ignoreImgSequence) {
            lens.image_sequence = {};
        }

        // generic thumbnail fix
        if (!lens.thumbnail_media_url) {
            lens.thumbnail_media_url = lens.thumbnail_media_poster_url || lens.standard_media_poster_url;
        }

        // show placeholder media files for missing images
        if (placeholderThumbnail && !lens.thumbnail_media_url) {
            lens.thumbnail_media_url = defaultMediaPath.concat('thumbnail.jpg');
        }
        if (placeholderSnapcode && !lens.snapcode_url) {
            lens.snapcode_url = defaultMediaPath.concat('snapcode.png')
        }
        if (placeholderIcon && !lens.icon_url) {
            lens.icon_url = defaultMediaPath.concat('icon.png')
        }

        return lens;
    });
}

function searchLensByName(term) {
    const wildcardSearch = '%' + term + '%';
    return new Promise(resolve => {
        connection.query(`SELECT * FROM lenses WHERE lens_name LIKE ? OR user_display_name LIKE ? LIMIT 250;`, [
            wildcardSearch,
            wildcardSearch
        ], async function (err, results) {
            if (results && results[0]) {
                resolve(
                    lensesMediaFilter(
                        webImportFilter(results)
                    )
                );
            } else {
                if (err) {
                    console.error(err, wildcardSearch);
                }
                resolve([]);
            }
        });
    });
}

function searchLensByTags(hashtags) {
    const regSearch = hashtags.join('|');
    return new Promise(resolve => {
        connection.query(`SELECT * FROM lenses WHERE lens_tags REGEXP (?) LIMIT 250;`, [
            regSearch
        ], async function (err, results) {
            if (results && results[0]) {
                resolve(
                    lensesMediaFilter(
                        webImportFilter(results)
                    )
                );
            } else {
                if (err) {
                    console.error(err, regSearch);
                }
                resolve([]);
            }
        });
    });
}

function searchLensByUuid(uuid) {
    return new Promise(resolve => {
        connection.query(`SELECT * FROM lenses WHERE uuid=? LIMIT 1;`, [
            uuid
        ], async function (err, results) {
            if (results && results[0]) {
                resolve(
                    lensesMediaFilter(
                        webImportFilter(results)
                    )
                );
            } else {
                if (err) {
                    console.error(err, uuid);
                }
                resolve([]);
            }
        });
    });
}

function getDuplicatedLensIds(lensIds) {
    return new Promise(resolve => {
        connection.query(`SELECT web_import, unlockable_id as id FROM lenses WHERE unlockable_id IN (?);`, [
            lensIds
        ], async function (err, results) {
            if (results && results[0]) {
                resolve(
                    webImportFilter(results).map(obj => {
                        return parseInt(obj.id);
                    })
                );
            } else {
                if (err) {
                    console.error(err, lensIds);
                }
                resolve([]);
            }
        })
    });
}

function getMultipleLenses(lenses) {
    return new Promise(resolve => {
        connection.query(`SELECT * FROM lenses WHERE unlockable_id IN (?);`, [
            lenses
        ], async function (err, results) {
            if (results && results[0]) {
                resolve(
                    lensesMediaFilter(
                        webImportFilter(results)
                    )
                );
            } else {
                if (err) {
                    console.error(err, lenses);
                }
                resolve([]);
            }
        })
    });
}

function getSingleLens(lensId) {
    return new Promise(resolve => {
        connection.query(`SELECT * FROM lenses WHERE unlockable_id=? LIMIT 1;`, [
            lensId
        ], async function (err, results) {
            if (results && results[0]) {
                resolve(
                    lensesMediaFilter(
                        webImportFilter(results)
                    )
                );
            } else {
                if (err) {
                    console.error(err, lensId);
                }
                resolve([]);
            }
        });
    });
}

function getLensUnlock(lensId) {
    return new Promise(resolve => {
        connection.query(`SELECT * FROM unlocks WHERE lens_id=? LIMIT 1;`, [
            lensId
        ], async function (err, results) {
            if (results && results[0]) {
                resolve(webImportFilter(results));
            } else {
                if (err) {
                    console.error(err, lensId);
                }
                resolve([]);
            }
        });
    });
}

function getObfuscatedSlugByDisplayName(userDisplayName) {
    return new Promise(resolve => {
        connection.query(`SELECT obfuscated_user_slug as slug FROM users WHERE user_display_name=? LIMIT 1;`, [
            userDisplayName
        ], async function (err, results) {
            if (results && results[0]) {
                resolve(results[0].slug);
            } else {
                if (err) {
                    console.error(err, userDisplayName);
                }
                resolve('');
            }
        });
    });
}

async function insertLens(lenses, forceDownload = false) {
    if (!Array.isArray(lenses)) {
        lenses = [lenses];
    }

    const whitelist = [
        'unlockable_id', 'uuid', 'snapcode_url', 'user_display_name', 'lens_name', 'lens_tags', 'lens_status', 'deeplink', 'icon_url',
        'thumbnail_media_url', 'thumbnail_media_poster_url', 'standard_media_url', 'standard_media_poster_url', 'obfuscated_user_slug', 'image_sequence', 'web_import'
    ];

    for (const lens of lenses) {
        // check required fields
        if (!lens || !lens.unlockable_id || !lens.lens_name || !lens.user_display_name) {
            console.error("Invalid argument, expected lens object", lens);
            return;
        }

        let { unlockable_id, lens_name, user_display_name, obfuscated_user_slug } = lens;

        await new Promise(resolve => {
            let args = buildArgs(lens, whitelist, {
                uuid: (!lens.uuid && lens.deeplink) ? Util.parseLensUuid(lens.deeplink) : '',
                snapcode_url: "",
                lens_tags: "",
                lens_status: "Live",
                deeplink: "",
                icon_url: "",
                thumbnail_media_url: "",
                thumbnail_media_poster_url: "",
                standard_media_url: "",
                standard_media_poster_url: "",
                obfuscated_user_slug: (!obfuscated_user_slug && user_display_name && lens.web_import) ? getObfuscatedSlugByDisplayName(user_display_name) : '',
                image_sequence: "{}",
                web_import: 0,
            });

            try {
                connection.query(`INSERT INTO lenses SET ?`, args, async function (err, results) {
                    if (!err) {
                        if (obfuscated_user_slug) {
                            insertUser(lens);
                        }

                        await Util.downloadLens(lens);
                        console.log("Saved Lens:", unlockable_id);
                    } else if (err.code !== "ER_DUP_ENTRY") {
                        console.log(err, unlockable_id, lens_name);
                        return resolve(false);
                    } else if (forceDownload) {
                        await Util.downloadLens(lens);
                    }
                    return resolve(true);
                });
            } catch (e) {
                console.error(e);
                resolve(false);
            }
        });
    }
    lenses = null;
}

async function updateLens(lenses) {
    if (!Array.isArray(lenses)) {
        lenses = [lenses];
    }

    const whitelist = [
        'uuid', 'snapcode_url', 'user_display_name', 'lens_name', 'lens_tags', 'lens_status', 'deeplink', 'icon_url',
        'thumbnail_media_url', 'thumbnail_media_poster_url', 'standard_media_url', 'standard_media_poster_url', 'obfuscated_user_slug', 'image_sequence', 'web_import'
    ];

    for (const lens of lenses) {
        // check required fields
        if (!lens || !lens.unlockable_id) {
            console.error("Invalid argument, expected lens object", lens);
            return;
        }

        let { unlockable_id } = lens;

        await new Promise(resolve => {
            let updateArgs = buildArgs(lens, whitelist);

            try {
                connection.query(`UPDATE lenses SET ? WHERE unlockable_id = ?`, [updateArgs, unlockable_id], async function (err, results) {
                    if (!err) {
                        if (results.affectedRows > 0) {
                            if (lens.obfuscated_user_slug && lens.user_display_name) {
                                insertUser(lens);
                            }

                            await Util.downloadLens(lens);
                            console.log('Updated Lens:', unlockable_id);
                        } else {
                            console.warn('No rows updated for Lens:', unlockable_id);
                        }
                    } else {
                        console.log(err, unlockable_id);
                        return resolve(false);
                    }
                    return resolve(true);
                });
            } catch (e) {
                console.error(e);
                resolve(false);
            }
        });
    }
    lenses = null;
}

async function insertUnlock(unlocks, forceDownload = false) {
    if (!Array.isArray(unlocks)) {
        unlocks = [unlocks];
    }

    const whitelist = ['lens_id', 'lens_url', 'signature', 'hint_id', 'additional_hint_ids', 'web_import'];

    for (const unlock of unlocks) {
        // check required fields
        if (!unlock || !unlock.lens_id || !unlock.lens_url) {
            console.error("Invalid argument, expected unlock object", unlock);
            return;
        }

        let { lens_id, lens_url } = unlock;

        await new Promise(resolve => {
            let args = buildArgs(unlock, whitelist, {
                signature: "",
                hint_id: "",
                additional_hint_ids: "{}",
                web_import: 0,
            });

            try {
                connection.query(`INSERT INTO unlocks SET ?`, args, async function (err, results) {
                    if (!err) {
                        await Util.downloadUnlock(lens_id, lens_url);
                        console.log('Unlocked Lens:', lens_id);
                    } else if (err.code !== "ER_DUP_ENTRY") {
                        console.log(err, lens_id);
                        return resolve(false);
                    } else if (forceDownload) {
                        await Util.downloadUnlock(lens_id, lens_url);
                    }
                    return resolve(true);
                });
            } catch (e) {
                console.error(e);
                resolve(false);
            }
        });
    }
    unlocks = null;
}

async function updateUnlock(unlocks) {
    if (!Array.isArray(unlocks)) {
        unlocks = [unlocks];
    }

    const whitelist = ['lens_url', 'signature', 'hint_id', 'additional_hint_ids', 'web_import'];

    for (const unlock of unlocks) {
        // check required fields
        if (!unlock || !unlock.lens_id) {
            console.error("Invalid argument, expected unlock object", unlock);
            return;
        }

        let { lens_id } = unlock;

        await new Promise(resolve => {
            let updateArgs = buildArgs(unlock, whitelist);

            try {
                connection.query(`UPDATE unlocks SET ? WHERE lens_id = ?`, [updateArgs, lens_id], async function (err, results) {
                    if (!err) {
                        if (results.affectedRows > 0) {
                            if (unlock.lens_url) {
                                await Util.downloadUnlock(lens_id, unlock.lens_url);
                            }

                            console.log('Updated Unlock:', lens_id);
                        } else {
                            console.warn('No rows updated for Unlock:', lens_id);
                        }
                    } else {
                        console.log(err, lens_id);
                        return resolve(false);
                    }
                    return resolve(true);
                });
            } catch (e) {
                console.error(e);
                resolve(false);
            }
        });
    }
    unlocks = null;
}

async function insertUser(user) {
    if (!user || !user.obfuscated_user_slug || !user.user_display_name) {
        console.error("Invalid argument, expected user object", user);
        return;
    }

    const whitelist = ['obfuscated_user_slug', 'user_display_name'];

    await new Promise(resolve => {
        let args = buildArgs(user, whitelist);

        try {
            connection.query(`INSERT INTO users SET ?`, args, async function (err, results) {
                if (!err) {
                    console.log('New User:', user.user_display_name);
                } else if (err.code !== "ER_DUP_ENTRY") {
                    console.log(err, user);
                    return resolve(false);
                }
                return resolve(true);
            });
        } catch (e) {
            console.error(e);
            resolve(false);
        }
    });
    user = null;
}

function markLensAsMirrored(id) {
    try {
        connection.query(`UPDATE lenses SET mirrored=1 WHERE unlockable_id=?`, [id]);
    } catch (e) {
        console.log(e);
    }
}

function markUnlockAsMirrored(id) {
    try {
        connection.query(`UPDATE unlocks SET mirrored=1 WHERE lens_id=?`, [id]);
    } catch (e) {
        console.log(e);
    }
}

function buildArgs(obj, whitelist, defaults = {}) {
    return whitelist.reduce((acc, key) => {
        if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
            if ((key === 'additional_hint_ids' || key === 'image_sequence') && typeof obj[key] !== 'string') {
                acc[key] = JSON.stringify(obj[key]);
            } else {
                acc[key] = obj[key];
            }
        } else if (defaults && defaults.hasOwnProperty(key)) {
            acc[key] = defaults[key];
        }
        return acc;
    }, {});
}

export { searchLensByName, searchLensByTags, searchLensByUuid, getDuplicatedLensIds, getMultipleLenses, getSingleLens, getLensUnlock, getObfuscatedSlugByDisplayName, insertLens, updateLens, insertUnlock, updateUnlock, insertUser, markLensAsMirrored, markUnlockAsMirrored };