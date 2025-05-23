import express from 'express';
import { Config } from '../../utils/config.js';
import LensWebCrawler from '../../lib/crawler.js';
import * as Util from '../../utils/helper.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const originalResponse = require('../../json/lenses/top.json');

const searchTimeout = Config.search.timeout;

var router = express.Router();

router.get('/', async function (req, res, next) {
    const { country, limit, offset } = req.query;

    if (Config.app.flag.fetch_top_lenses) {
        // TODO
    } else if (offset >= originalResponse.lenses.length) {
        return res.json({});
    }

    return res.json(Util.modifyResponseURLs(originalResponse));
});

export default router;