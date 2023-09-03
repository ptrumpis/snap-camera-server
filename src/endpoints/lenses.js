import express from 'express';
import * as DB from '../utils/db.js';
import * as Util from '../utils/helper.js';
import * as Web from '../utils/web.js';

const useRelay = Util.relay();
const useWebSource = Util.isOptionTrue('ENABLE_WEB_SOURCE');
const MAX_LENSES = 250;

var router = express.Router();

router.get('/', async function (req, res, next) {
    // missing request documentation
    console.log("Undocumented GET request /vc/v1/explorer/lenses:", req.originalUrl);
    res.json({});
});

router.post('/', async function (req, res, next) {
    if (!req.body || !req.body['lenses'] || !(req.body['lenses'] instanceof Array)) {
        return res.json({});
    }

    // initialize ID array
    let lensIds = req.body['lenses'];
    let lenses = [];

    if (lensIds.length > MAX_LENSES) {
        return res.json({});
    }

    const removeFoundId = function (lensId) {
        const idx = lensIds.indexOf(parseInt(lensId));
        if (idx !== -1) {
            lensIds.splice(idx, 1);
        }
    };

    if (lensIds.length > 1) {
        lenses = await DB.getMultipleLenses(lensIds);
    } else if (lensIds.length === 1) {
        const id = parseInt(lensIds[0]);
        lenses = await DB.getSingleLens(id);
    }

    if (lenses && lenses.length) {
        for (let i = 0; i < lenses.length; i++) {
            // trigger re-download to catch missing files automatically
            await Util.downloadLens(lenses[i]);
        }
        lenses = Util.modifyResponseURLs(lenses);
    }

    // use relay for missing lens ID's
    if (useRelay && lensIds.length) {
        for (let i = 0; i < lenses.length; i++) {
            removeFoundId(lenses[i].unlockable_id);
        }

        let data = await Util.relayPostRequest(req.originalUrl, { "lenses": lensIds });
        if (data && data['lenses'] && (data['lenses'] instanceof Array)) {
            // relay should return lenses but not more than requested
            if (data['lenses'].length <= lensIds.length) {
                DB.insertLens(data['lenses']);

                // merge with local results
                if (lenses && lenses.length) {
                    lenses = lenses.concat(data['lenses']);
                } else {
                    lenses = data['lenses'];
                }
            }
        }
        data = null;
    }

    // use web cache for missing lens ID's
    if (useWebSource && lensIds.length) {
        for (let i = 0; i < lenses.length; i++) {
            removeFoundId(lenses[i].unlockable_id);
        }

        for (let i = 0; i < lensIds.length; i++) {
            let lens = Web.Cache.get(lensIds[i]);
            if (lens && lens.uuid) {
                DB.insertLens(lens);

                // add to local results
                lenses.push(lens);
            }
        }
    }

    lensIds = null;
    return res.json({
        "lenses": lenses
    });
});

export default router;