import express from 'express';
import * as Util from '../../../utils/helper.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const wfh = require('../../../json/wfh.json');
const color_effect = require('../../../json/color_effect.json');
const funny = require('../../../json/funny.json');
const gaming = require('../../../json/gaming.json');
const cute = require('../../../json/cute.json');
const character = require('../../../json/character.json');

const originalResponses = {
    wfh,
    color_effect, //winter
    funny,
    gaming, //makeup
    cute,
    character
};

var router = express.Router();

router.get('/', async function (req, res, next) {
    const { category, limit, offset } = req.query;
    if (!category || offset === 31 || !originalResponses[category]) {
        return res.json({});
    }

    return res.json(Util.modifyResponseURLs(originalResponses[category]));
});

export default router;