import express from "express";
import * as Util from '../utils/helper.js';
import { createRequire } from "module";

const require = createRequire(import.meta.url);

//these are actually the featured filters,
//for now we'll stick with the main ones they have featured before the servers went offline.
const originalResponse = require('../json/scheduled.json');

var router = express.Router();

router.get('/', async function (req, res, next) {
    return res.json(Util.modifyResponseURLs(originalResponse));
});

export default router;