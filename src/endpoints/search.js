import express from "express";
import * as Util from '../utils/helper.js';
import * as Web from '../utils/web.js';

const useRelay = Util.relay();
const useWebSource = Util.isOptionTrue('ENABLE_WEB_SOURCE');
const mirrorSearchResults = Util.isOptionTrue('MIRROR_SEARCH_RESULTS');

var router = express.Router();

router.post('/', async function (req, res, next) {
    if (!req.body || !req.body['query']) {
        return res.json({});
    }

    const searchTerm = req.body['query'].trim();
    if (searchTerm.length < 3 || (searchTerm.startsWith('(by') && !searchTerm.endsWith(')'))) {
        return res.json({ "lenses": [] });
    }

    let searchResults = await Util.advancedSearch(searchTerm);
    if (searchResults && searchResults.length) {
        searchResults = Util.modifyResponseURLs(searchResults);

        // hashtag search (not supported by relay or web)
        if (searchTerm.startsWith('#') && searchResults.length) {
            return res.json({ "lenses": searchResults });
        }
    }

    if (useRelay) {
        let relayResults = await Util.relayPostRequest(req.originalUrl, { "query": searchTerm });
        if (relayResults && relayResults['lenses'] && relayResults['lenses'].length) {
            searchResults = Util.mergeLensesUnique(searchResults, relayResults['lenses']);

            if (mirrorSearchResults) {
                Util.mirrorSearchResults(relayResults['lenses']);
            }
        }
    }

    if (useWebSource) {
        let webResults = await Web.search(searchTerm);
        if (webResults && webResults.length) {
            searchResults = Util.mergeLensesUnique(searchResults, webResults);

            if (mirrorSearchResults) {
                Web.mirrorSearchResults(webResults);
            }

            for (let i = 0; i < webResults.length; i++) {
                if (webResults[i].unlockable_id && webResults[i].uuid) {
                    // caching is required to activate the lens if search mirroring is disabled or delayed
                    Web.Cache.set(webResults[i].unlockable_id, webResults[i]);
                }
            }
        }
    }

    return res.json({ "lenses": searchResults });
});

export default router;