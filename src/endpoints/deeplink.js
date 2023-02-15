import express from "express";
import * as Util from '../utils/helper.js';
import * as DB from '../utils/db.js';

var router = express.Router();

router.post('/', async function (req, res, next) {
    if (!req.body || !req.body['deeplink']) {
        return res.json({});
    }

    const searchUrl = req.body['deeplink'].trim();

    // search local database
    const searchResults = await Util.advancedSearch(searchUrl);

    if (searchResults && searchResults.length) {
        return res.json({ "lenses": Util.modifyResponseURLs(searchResults) });
    } else if (Util.relay()) {
        let data = await Util.relayPostRequest(req.originalUrl, { "deeplink": searchUrl });
        if (data && data['lenses']) {
            DB.insertLens(data['lenses']);
            return res.json(data);
        }
    }

    return res.json({});
});

export default router;