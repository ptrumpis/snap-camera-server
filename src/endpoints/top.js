import express from 'express';
import * as Util from '../utils/helper.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const originalResponse = require('../json/top.json');

var router = express.Router();

router.get('/', async function (req, res, next) {
    return res.json(Util.modifyResponseURLs(originalResponse));
});

export default router;