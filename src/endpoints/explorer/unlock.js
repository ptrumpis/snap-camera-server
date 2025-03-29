import express from 'express';
import Wayback from 'wayback.js';
import { Config } from '../../utils/config.js';
import * as Cache from '../../utils/cache.js';
import * as DB from '../../utils/db.js';
import * as Util from '../../utils/helper.js';
import * as Web from '../../utils/web.js';

const useRelay = Config.app.relay.server;
const useWebSource = Config.app.flag.enable_web_source;

const wayback = new Wayback();
const maxFileAgeInDays = 90;

var router = express.Router();

router.get('/', async function (req, res, next) {
    const lensId = req.query?.uid || false;
    if (!lensId) {
        return res.json({});
    }

    if (Util.isLensId(lensId)) {
        const unlock = await DB.getLensUnlock(lensId);
        if (unlock?.[0]) {
            if (unlock[0].lens_id && unlock[0].lens_url) {
                // trigger re-download to catch missing files automatically
                await Util.downloadUnlock(unlock[0].lens_id, unlock[0].lens_url);

                wayback.saveOutdatedUrl(unlock[0].lens_url, maxFileAgeInDays);

                return res.json(Util.modifyResponseURLs(unlock[0]));
            } else {
                console.warn(`[Warning] Unlock Download URL is missing: ${lensId}`);
            }
        }

        const remoteUnlock = await getRemoteUnlockByLensId(lensId);
        if (remoteUnlock) {
            return res.json(remoteUnlock);
        }
    }

    const webUnlock = await getWebUnlockByLensId(lensId);
    if (webUnlock) {
        return res.json(webUnlock);
    }

    console.info(`[Info] 😕 This lens cannot currently be activated: ${lensId}`);

    return res.json({});
});

async function getRemoteUnlockByLensId(lensId) {
    try {
        if (useRelay) {
            const unlock = await Util.getUnlockFromRelay(lensId);
            if (unlock) {
                await DB.insertUnlock(unlock);
                return unlock;
            }
        }
    } catch (e) {
        console.error(e);
    }

    return null;
}

async function getWebUnlockByLensId(lensId) {
    try {
        if (useWebSource) {
            if (Cache.Top.has(lensId)) {
                const topLens = await unlockWebLens(Cache.Top.get(lensId));
                if (topLens) {
                    return topLens;
                }
            }

            if (Cache.Search.has(lensId)) {
                const searchLens = await unlockWebLens(Cache.Search.get(lensId));
                if (searchLens) {
                    return searchLens;
                }
            }

            const lens = await DB.getSingleLens(lensId);
            if (lens?.[0]) {
                return await unlockWebLens(lens[0]);
            }
        }
    } catch (e) {
        console.error(e);
    }

    return null;
}

async function unlockWebLens(lens) {
    if (lens?.unlockable_id && !lens?.uuid) {
        const dbLens = await DB.getSingleLens(lens.unlockable_id);
        lens = (dbLens?.[0]) ? Util.mergeLens(dbLens[0], lens) : lens;
    }

    if (lens?.uuid && !Util.isLensId(lens.unlockable_id)) {
        const webLens = await Web.getLensByHash(lens.uuid);
        lens = (webLens) ? Util.mergeLens(webLens, lens) : lens;
    }

    if (lens?.uuid && !lens?.lens_url) {
        const webLens = await Web.getUnlockByHash(lens.uuid);
        lens = (webLens) ? Util.mergeLens(webLens, lens) : lens;
    }

    if (!Util.isLensId(lens?.lens_id) && Util.isLensId(lens?.unlockable_id)) {
        lens.lens_id = lens.unlockable_id;
    }

    if (lens?.lens_url && Util.isLensId(lens.unlockable_id) && Util.isLensId(lens.lens_id)) {
        await DB.insertLens(lens);
        await DB.insertUnlock(lens);

        return lens;
    }

    return null;
}

export default router;