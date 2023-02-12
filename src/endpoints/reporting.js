import express from "express";
import * as DB from '../utils/db.js';
import * as Util from '../utils/helper.js';

var router = express.Router();

router.post('/', async function (req, res, next) {
	//using the report lens feature of the app to try and redownload everything.
	const body = req.body;
	if (body && body['lens_id']) {
		const lensId = parseInt(body['lens_id']);

		console.log('Re-downloading Lens', lensId);

		const lens = await DB.getSingleLens(lensId);
		if (lens && lens[0]) {
			await Util.mirrorLens(lens[0]);

			const lensUrl = await Util.getUnlockUrl(lensId);
			if (lensUrl) {
				await Util.mirrorUnlock(lensId, lensUrl);
			}
		}
	}

	return res.json({});
});

export default router;