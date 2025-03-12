import express from 'express';
import Wayback from 'wayback.js';
import { Config } from '../../utils/config.js';
import * as DB from '../../utils/db.js';
import * as Util from '../../utils/helper.js';
import * as Web from '../../utils/web.js';

const useRelay = Config.app.relay.server;
const useWebSource = Config.app.flag.enable_web_source;

const wayback = new Wayback();
const maxFileAgeInDays = 90;

var router = express.Router();

router.get('/', async function (req, res, next) {
    const lensId = req?.query?.uid && parseInt(req.query.uid) || false;
    if (!lensId) {
        return res.json({});
    }

    const unlock = await DB.getLensUnlock(lensId);
    if (unlock && unlock[0]) {
        if (unlock[0].lens_id && unlock[0].lens_url) {
            // trigger re-download to catch missing files automatically
            await Util.downloadUnlock(unlock[0].lens_id, unlock[0].lens_url);

            wayback.saveOutdatedUrl(unlock[0].lens_url, maxFileAgeInDays);

            return res.json(Util.modifyResponseURLs(unlock[0]));
        } else {
            console.warn('Unlock Download URL is missing', lensId);
        }
    }

    const remoteUnlock = await getRemoteUnlockByLensId(lensId);
    if (remoteUnlock) {
        return res.json(remoteUnlock);
    }

    // TODO FIX in upcomming versions
    console.warn('This Lens can not be used. The issue is known and will most likely be fixed in upcomming versions of Snap Camera Server.', lensId);

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

        if (useWebSource) {
            let lens = Web.Cache.get(lensId);
            if (!lens || !lens.uuid) {
                lens = await DB.getSingleLens(lensId);
                if (lens && lens[0]) {
                    lens = lens[0];
                }
            }

            if (lens && lens.uuid) {
                const unlockLensCombined = await Web.getUnlockByHash(lens.uuid);
                if (unlockLensCombined) {
                    DB.insertLens(unlockLensCombined);
                    DB.insertUnlock(unlockLensCombined);
                    return unlockLensCombined;
                }
            }
        }
    } catch (e) {
        console.error(e);
    }

    return null;
}

export default router;