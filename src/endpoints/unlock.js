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
        // try to retrive unlock information by UUID
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
                return res.json(unlockLensCombined);
            }
        }
    }

    return res.json({});
});

export default router;