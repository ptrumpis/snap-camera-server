import express from "express";
import * as Util from '../utils/helper.js';
import * as DB from '../utils/db.js';

const relay = Util.relay();

var router = express.Router();

router.post('/', async function (req, res, next) {
    if (!req.body || !req.body['query']) {
        return res.json({});
    }

    const searchTerm = req.body['query'].trim();

    // search local database
    let searchResults = await Util.advancedSearch(searchTerm);
    if (searchResults && searchResults.length) {
        searchResults = Util.modifyResponseURLs(searchResults);
    }

    if (relay) {
        let data = await Util.relayPostRequest(req.originalUrl, { "query": searchTerm });
        if (data && data['lenses']) {
            if (searchResults && searchResults.length) {
                // collect all lens id's of local results to identify duplicates
                let localLensIds = [];
                for (var i = 0; i < searchResults.length; i++) {
                    localLensIds.push(searchResults[i].unlockable_id);
                }

                // remove duplicated local results from relay results
                for (var j = 0; j < localLensIds.length; j++) {
                    let index = data['lenses'].indexOf(localLensIds[i]);
                    if (index !== -1) {
                        data['lenses'].splice(index, 1);
                    }
                }

                // merge new relay search results with local
                searchResults = searchResults.concat(data['lenses']);
            } else {
                searchResults = data['lenses'];
            }

            // add newly found lenses from relay to our database
            DB.insertLens(data['lenses']);
        }
    }

    return res.json({ "lenses": searchResults });
});

export default router;