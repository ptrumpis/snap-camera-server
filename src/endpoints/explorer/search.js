import express from 'express';
import { Config } from '../../utils/config.js';
import * as Util from '../../utils/helper.js';
import * as Web from '../../utils/web.js';
import * as Creator from '../../utils/creator.js';

const useRelay = Config.app.relay.server;
const useWebSource = Config.app.flag.enable_web_source;
const mirrorSearchResults = Config.app.flag.mirror_search_results;

var router = express.Router();

router.post('/', async function (req, res, next) {
    if (!req.body || !req.body['query']) {
        return res.json({});
    }

    const searchTerm = req.body['query'].trim();
    if (searchTerm.length < 3 || (searchTerm.startsWith('(by') && !searchTerm.endsWith(')'))) {
        return res.json({ "lenses": [] });
    }

    if (Util.isGroupId(searchTerm)) {
        const groupResults = await Creator.getLensGroup(searchTerm);
        if (Array.isArray(groupResults) && groupResults.length) {
            if (mirrorSearchResults) {
                Web.mirrorSearchResults(groupResults);
            }

            Web.cacheSearchResults(groupResults);

            return res.json({ "lenses": groupResults });
        }
    }

    let searchResults = await Util.advancedSearch(searchTerm);
    if (Array.isArray(searchResults) && searchResults.length) {
        searchResults = Util.modifyResponseURLs(searchResults);
    }

    if (searchTerm.startsWith('#')) {
        // hashtag search (not supported by relay or web)
        return res.json({ "lenses": searchResults });
    }

    if (useRelay) {
        let relayResults = await Util.relayRequest(req.originalUrl, 'POST', { "query": searchTerm });
        if (relayResults && Array.isArray(relayResults['lenses']) && relayResults['lenses'].length) {
            searchResults = Util.mergeLensesUnique(searchResults, relayResults['lenses']);

            if (mirrorSearchResults) {
                Util.mirrorSearchResults(relayResults['lenses']);
            }
        }
        relayResults = null;
    }

    if (useWebSource) {
        let webResults = await Web.search(searchTerm);
        if (Array.isArray(webResults) && webResults.length) {
            searchResults = Util.mergeLensesUnique(searchResults, webResults);

            if (mirrorSearchResults) {
                Web.mirrorSearchResults(webResults);
            }

            Web.cacheSearchResults(webResults);
        }
        webResults = null;
    }

    return res.json({ "lenses": searchResults });
});

export default router;