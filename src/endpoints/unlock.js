import express from 'express'
import * as Util from '../utils/helper.js';
import * as DB from '../utils/db.js';

var router = express.Router();

router.get('/', async function (req, res, next) {
    const lensID = req?.query?.uid && parseInt(req.query.uid) || false;
    if (!lensID) {
        return res.json({});
    }

    const lens = await DB.getLensUnlock(lensID);
    if (lens && lens[0]) {
        return res.json(Util.modifyResponseURLs(lens[0]));
    } else if (Util.relay()) {
        let data = await Util.relayGetRequest(req.originalUrl);
        if (data && data['lens_id']) {
            await DB.insertUnlock(data);
            return res.json(Util.modifyResponseURLs(data));
        }
    }

    return res.json({});

});

export default router;