import express from "express";
import * as DB from '../utils/db.js';
import * as Util from '../utils/helper.js';
import * as Web from '../utils/web.js';

const useRelay = Util.relay();
const useWebSource = Util.isOptionTrue('ENABLE_WEB_SOURCE');

var router = express.Router();

router.post('/', async function (req, res, next) {
    if (!req.body || !req.body['deeplink']) {
        return res.json({});
    }

    const searchUrl = req.body['deeplink'].trim();

    const searchResults = await Util.advancedSearch(searchUrl);
    if (searchResults && searchResults.length) {
        return res.json({ "lenses": Util.modifyResponseURLs(searchResults) });
    }

    if (useRelay) {
        let relayResults = await Util.relayPostRequest(req.originalUrl, { "deeplink": searchUrl });
        if (relayResults && relayResults['lenses'] && relayResults['lenses'].length) {
            DB.insertLens(relayResults['lenses']);
            return res.json(relayResults);
        }
    }

    if (useWebSource) {
        let webResults = await Web.search(searchUrl);
        if (webResults && webResults.length) {
            DB.insertLens(webResults);
            return res.json({ "lenses": webResults });
        }
    }

    return res.json({});
});

export default router;