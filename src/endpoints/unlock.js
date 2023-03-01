import express from "express";
import * as DB from '../utils/db.js';
import * as Util from '../utils/helper.js';
import * as Web from '../utils/web.js';

const useRelay = Util.relay();
const useWebSource = Util.isOptionTrue('ENABLE_WEB_SOURCE');

var router = express.Router();

router.get('/', async function (req, res, next) {
    const lensId = req?.query?.uid && parseInt(req.query.uid) || false;
    if (!lensId) {
        return res.json({});
    }

    let unlock = await DB.getLensUnlock(lensId);
    if (unlock && unlock[0]) {
        // trigger re-download to catch missing files automatically
        await Util.downloadUnlock(unlock[0].lens_id, unlock[0].lens_url);
        return res.json(Util.modifyResponseURLs(unlock[0]));
    }

    if (useRelay) {
        unlock = await Util.getUnlockFromRelay(lensId);
        if (unlock) {
            DB.insertUnlock(unlock);
            return res.json(unlock);
        }
    }

    if (useWebSource) {
        const uuid = Web.Cache.get(lensId);
        if (uuid) {
            unlock = await Web.getUnlockByHash(uuid);
            if (unlock) {
                DB.insertUnlock(unlock);
                return res.json(unlock);
            }
        }

        const lens = await DB.getSingleLens(lensId);
        if (lens && lens[0] && lens[0].uuid) {
            unlock = await Web.getUnlockByHash(lens[0].uuid);
            if (unlock) {
                DB.insertUnlock(unlock);
                return res.json(unlock);
            }
        }
    }

    return res.json({});
});

export default router;