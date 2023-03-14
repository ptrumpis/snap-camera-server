import express from "express";
import * as DB from '../utils/db.js';
import * as Util from '../utils/helper.js';
import * as Web from '../utils/web.js';

const useRelay = Util.relay();
const useWebSource = Util.isOptionTrue('ENABLE_WEB_SOURCE');

var router = express.Router();

router.post('/', async function (req, res, next) {
    const body = req.body;
    if (body && body['lens_id']) {
        const lensId = parseInt(body['lens_id']);

        const lens = await DB.getSingleLens(lensId);
        if (lens && lens[0]) {
            console.log('Re-downloading Lens', lensId);
            await Util.downloadLens(lens[0]);
        }

        let unlock = await DB.getLensUnlock(lensId);
        if (unlock && unlock[0]) {
            console.log('Re-downloading Unlock', lensId);
            await Util.downloadUnlock(unlock[0].lens_id, unlock[0].lens_url)
            return res.json({});
        }

        if (useRelay) {
            unlock = await Util.getUnlockFromRelay(lensId);
            if (unlock) {
                console.log('Getting Unlock from relay server', lensId);
                await DB.insertUnlock(unlock, true);
                return res.json({});
            }
        }

        if (useWebSource) {
            if (lens && lens.uuid) {
                unlock = await Web.getUnlockByHash(uuid);
                if (unlock) {
                    console.log('Getting Unlock from web', lensId);
                    await DB.insertUnlock(unlock, true);
                    return res.json({});
                }
            }
        }
    }

    return res.json({});
});

export default router;