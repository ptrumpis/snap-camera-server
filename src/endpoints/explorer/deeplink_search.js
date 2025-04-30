import express from 'express';
import { Config } from '../../utils/config.js';
import * as Util from '../../utils/helper.js';
import * as Web from '../../utils/web.js';

const useRelay = Config.app.relay.server;
const useWebSource = Config.app.flag.enable_web_source;
const mirrorSearchResults = Config.app.flag.mirror_search_results;

var router = express.Router();

router.post('/', async function (req, res, next) {
    if (!req.body?.deeplink || typeof req.body.deeplink !== 'string') {
        return res.json({});
    }

    const searchUrl = req.body.deeplink.trim();

    const searchResults = await Util.advancedSearch(searchUrl);
    if (Array.isArray(searchResults) && searchResults.length) {
        return res.json({ "lenses": Util.modifyResponseURLs(searchResults) });
    }

    if (useRelay) {
        let relayResults = await Util.relayRequest(req.originalUrl, 'POST', { "deeplink": searchUrl });
        if (relayResults && Array.isArray(relayResults['lenses']) && relayResults['lenses'].length === 1) {
            if (mirrorSearchResults) {
                Util.mirrorSearchResults(relayResults['lenses']);
            }

            return res.json(relayResults);
        }
    }

    if (useWebSource) {
        let webResults = await Web.search(searchUrl);
        if (Array.isArray(webResults) && webResults.length) {
            if (mirrorSearchResults) {
                Web.mirrorSearchResults(webResults);
            }

            Web.cacheSearchResults(webResults);

            return res.json({ "lenses": webResults });
        }
    }

    return res.json({});
});

export default router;