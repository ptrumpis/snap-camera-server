import express from 'express';
import { Config } from '../../utils/config.js';
import * as DB from '../../utils/db.js';
import * as Util from '../../utils/helper.js';
import * as Web from '../../utils/web.js';

const useRelay = Config.app.relay.server;
const useWebSource = Config.app.flag.enable_web_source;

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
            if (unlock[0].lens_id && unlock[0].lens_url) {
                console.log('Re-downloading Unlock', lensId);
                await Util.downloadUnlock(unlock[0].lens_id, unlock[0].lens_url);
                return res.json({});
            } else {
                console.warn('Unlock Download URL is missing', lensId);
            }
        }

        if (useRelay) {
            console.log('Trying to get Unlock from relay server', lensId);
            unlock = await Util.getUnlockFromRelay(lensId);
            if (unlock) {
                console.log('Received Unlock from relay server', lensId);
                await DB.insertUnlock(unlock, true);
                return res.json({});
            } else {
                console.log('Failed to get Unlock from relay server', lensId);
            }
        }

        if (useWebSource) {
            if (lens && lens.uuid) {
                console.log('Trying to get Unlock from web', lensId);
                unlock = await Web.getUnlockByHash(uuid);
                if (unlock) {
                    console.log('Received Unlock from web', lensId);
                    await DB.insertUnlock(unlock, true);
                    return res.json({});
                } else {
                    console.log('Failed to get Unlock from web', lensId);
                }
            }
        }
    }

    return res.json({});
});

export default router;