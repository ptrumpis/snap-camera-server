import express from "express";
import * as Util from '../utils/helper.js';
import * as DB from '../utils/db.js';
import * as Storage from '../utils/storage.js';

var router = express.Router();

router.get('/', async function (req, res, next) {
    const lensID = req?.query?.uid && parseInt(req.query.uid) || false;
    if (!lensID) {
        return res.json({});
    }

    const lens = await DB.getLensUnlock(lensID);
    if (lens && lens[0]) {
        // trigger re-download 
        await Storage.saveUnlock(lens[0].lens_id, lens[0].lens_url);

        return res.json(Util.modifyResponseURLs(lens[0]));
    } else if (Util.relay()) {
        let data = await Util.relayGetRequest(req.originalUrl);
        if (data && data['lens_id']) {
            DB.insertUnlock(data);

            return res.json(data);
        }
    }

    return res.json({});
});

export default router;