import express from 'express'
import * as Util from '../utils/helper.js';
import * as DB from '../utils/db.js';

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
    let lenses;

    // always consider local results even if relay is activated
    if (lensIds.length > 1) {
        lenses = await DB.getMultipleLenses(lensIds);
    } else {
        lenses = await DB.getSingleLens(parseInt(lensIds[0]));
    }

    if (lenses) {
        for (var i = 0; i < lenses.length; i++) {
            let index = lensIds.indexOf(parseInt(lenses[i].unlockable_id));
            if (index !== -1) {
                lensIds.splice(index, 1);
            }
        }
    }

    // use relay for missing lens id's
    if (Util.relay() && lensIds.length) {
        let data = await Util.relayPostRequest(req.originalUrl, { "lenses": lensIds });
        if (data && data['lenses']) {
            await DB.insertLens(data['lenses']);

            // merge with local results
            if (lenses) {
                lenses = lenses.concat(data['lenses']);
            } else {
                lenses = data['lenses'];
            }
        }
    }

    if (lenses) {
        lenses = Util.modifyResponseURLs(lenses);
    } else {
        lenses = [];
    }

    return res.json({
        "lenses": lenses
    });
});

export default router;