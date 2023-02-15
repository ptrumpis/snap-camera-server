import * as DB from './db.js';
import * as Util from './helper.js';
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const top = require('../json/top.json');
const scheduled = require('../json/scheduled.json');
const wfh = require('../json/wfh.json');
const color_effect = require('../json/color_effect.json');
const funny = require('../json/funny.json');
const gaming = require('../json/gaming.json');
const cute = require('../json/cute.json');
const character = require('../json/character.json');

const staticLenses = [
    top,
    scheduled,
    wfh,
    color_effect,
    funny,
    gaming,
    cute,
    character
];

// pre-fetch static lenses
async function loadStaticLenses() {
    for (let i = 0; i < staticLenses.length; i++) {
        await DB.insertLens(staticLenses[i]["lenses"], true);
        await Util.sleep(5000);
    }
    return true;
}

export { loadStaticLenses };