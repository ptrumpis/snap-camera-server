import express from 'express'
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

    if (relay) {
        let data = await Util.relayPostRequest(req.originalUrl, { "query": searchTerm });
        if (data && data['lenses']) {
            // merge relay results with local results and remove duplicates
            if (searchResults) {
                let localLensIds = [];
                for (var i = 0; i < searchResults.length; i++) {
                    localLensIds.push(searchResults[i].unlockable_id);
                }

                for (var j = 0; j < localLensIds.length; j++) {
                    let index = data['lenses'].indexOf(localLensIds[i]);
                    if (index !== -1) {
                        data['lenses'].splice(index, 1);
                    }
                }

                searchResults = searchResults.concat(data['lenses']);
            }

            // add newly found lenses to our database
            await DB.insertLens(data['lenses']);
        }
    }

    if (searchResults) {
        searchResults = Util.modifyResponseURLs(searchResults);
    } else {
        searchResults = [];
    }

    return res.json({ "lenses": searchResults });
});

export default router;