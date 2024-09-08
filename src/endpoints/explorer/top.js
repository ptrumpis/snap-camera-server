import express from 'express';
import { Config } from '../../utils/config.js';
import LensWebCrawler from '../../lib/crawler.js';
import * as Util from '../../utils/helper.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const originalResponse = require('../../json/lenses/top.json');

const searchTimeout = Config.search.timeout;
const crawler = new LensWebCrawler(searchTimeout);

var router = express.Router();

router.get('/', async function (req, res, next) {
    if (Config.app.flag.fetch_top_lenses) {
        try {
            const webResponse = await crawler.getTopLenses();
            return res.json(webResponse);
        } catch (e) {
            console.error(e);
        }
    }

    return res.json(Util.modifyResponseURLs(originalResponse));
});

export default router;