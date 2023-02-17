import express from "express";
import * as Util from '../utils/helper.js';
import * as DB from '../utils/db.js';
import * as Storage from '../utils/storage.js';

var router = express.Router();

router.get('/', async function (req, res, next) {
    // missing request documentation
    console.log("Undocumented GET request /vc/v1/explorer/lenses:", req.originalUrl);
    res.json({});
});

router.post('/', async function (req, res, next) {
    if (!req.body || !req.body['lenses']) {
        return res.json({});
    }

    let lensIds = req.body['lenses'];
    let lenses = [];

    // always consider local results even if relay is activated
    if (lensIds.length > 1) {
        lenses = await DB.getMultipleLenses(lensIds);
    } else if (lensIds.length === 1) {
        const id = parseInt(lensIds[0]);
        lenses = await DB.getSingleLens(id);
    }

    if (lenses && lenses.length) {
        // trigger re-download 
        // and remove found lenses from id array
        for (var i = 0; i < lenses.length; i++) {
            await Storage.saveLens(lenses[i]);

            let unlockId = parseInt(lenses[i].unlockable_id);
            let index = lensIds.indexOf(unlockId);
            if (index !== -1) {
                lensIds.splice(index, 1);
            }
        }

        lenses = Util.modifyResponseURLs(lenses);
    }

    // use relay for missing lens id's
    if (Util.relay() && lensIds.length) {
        let data = await Util.relayPostRequest(req.originalUrl, { "lenses": lensIds });
        if (data && data['lenses']) {
            DB.insertLens(data['lenses']);

            // merge with local results
            if (lenses && lenses.length) {
                lenses = lenses.concat(data['lenses']);
            } else {
                lenses = data['lenses'];
            }
        }
    }

    return res.json({
        "lenses": lenses
    });
});

export default router;