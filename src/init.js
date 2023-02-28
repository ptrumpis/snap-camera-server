import dbmigrate from 'db-migrate';
import * as DB from './utils/db.js';
import * as Util from './utils/helper.js';
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const top = require('./json/top.json');
const scheduled = require('./json/scheduled.json');
const wfh = require('./json/wfh.json');
const color_effect = require('./json/color_effect.json');
const funny = require('./json/funny.json');
const gaming = require('./json/gaming.json');
const cute = require('./json/cute.json');
const character = require('./json/character.json');

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

async function bootstrap() {
    // Dirty fix to wait for mysql server initialization
    // TODO: fix inside docker-compose.yml
    console.log('Execution delayed by 15 seconds.');
    await Util.sleep(15000);

    await runDatabaseMigration();

    prefetchStaticLenses();
}

async function runDatabaseMigration() {
    try {
        const migration = dbmigrate.getInstance(true);
        await migration.up();
        console.log('Database migration complete');
    } catch (e) {
        console.error(e);
    }
}

async function prefetchStaticLenses() {
    try {
        for (let i = 0; i < staticLenses.length; i++) {
            for (let j = 0; j < staticLenses[i]["lenses"].length; j++) {
                let lens = staticLenses[i]["lenses"][j];
                await DB.insertLens(lens, true);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

export { bootstrap };