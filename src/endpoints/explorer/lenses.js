import express from 'express';
import { Config } from '../../utils/config.js';
import * as Cache from '../../utils/cache.js';
import * as DB from '../../utils/db.js';
import * as Util from '../../utils/helper.js';

const useRelay = Config.app.relay.server;
const useWebSource = Config.app.flag.enable_web_source;
const MAX_LENSES = 250;

var router = express.Router();

router.get('/', async function (req, res, next) {
    // missing request documentation
    console.debug("[Debug] Undocumented GET request /vc/v1/explorer/lenses:", req.originalUrl);
    res.json({});
});

router.post('/', async function (req, res, next) {
    const lensIds = req.body?.lenses;

    if (!Array.isArray(lensIds) || lensIds.length > MAX_LENSES) {
        return res.json({});
    }

    let lenses = [];
    const parsedLensIds = lensIds.map(id => parseInt(id)).filter(Number.isInteger);

    if (parsedLensIds.length > 1) {
        lenses = await DB.getMultipleLenses(parsedLensIds);
    } else if (parsedLensIds.length === 1) {
        lenses = await DB.getSingleLens(parsedLensIds[0]);
    }

    if (lenses.length) {
        await Promise.all(lenses.map(Util.downloadLens));
        lenses = Util.modifyResponseURLs(lenses);
    }

    const removeFoundId = (lensId) => {
        const idx = parsedLensIds.indexOf(parseInt(lensId));
        if (idx !== -1) parsedLensIds.splice(idx, 1);
    };

    if (useRelay && parsedLensIds.length) {
        lenses.forEach(lens => removeFoundId(lens.unlockable_id));

        const relayResult = await Util.relayRequest(req.originalUrl, 'POST', { lenses: parsedLensIds });
        // relay should return lenses but not more than requested
        if (Array.isArray(relayResult?.lenses) && relayResult.lenses.length <= parsedLensIds.length) {
            await DB.insertLens(relayResult.lenses);
            lenses = lenses.concat(relayResult.lenses);
        }
    }

    if (useWebSource && parsedLensIds.length) {
        lenses.forEach(lens => removeFoundId(lens.unlockable_id));

        for (const id of parsedLensIds) {
            const lens = Cache.Search.get(id) || Cache.Top.get(id);
            if (lens?.uuid) {
                await DB.insert(lens);
                lenses.push(lens);
            }
        }
    }

    return res.json({ lenses });
});

export default router;