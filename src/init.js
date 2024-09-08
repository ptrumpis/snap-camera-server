import dbmigrate from 'db-migrate';
import * as DB from './utils/db.js';
import * as Util from './utils/helper.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const top = require('./json/lenses/top.json');
const scheduled = require('./json/lenses/scheduled.json');
const wfh = require('./json/lenses/wfh.json');
const color_effect = require('./json/lenses/color_effect.json');
const funny = require('./json/lenses/funny.json');
const gaming = require('./json/lenses/gaming.json');
const cute = require('./json/lenses/cute.json');
const character = require('./json/lenses/character.json');

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
    console.log('Initialization delayed by 30 seconds.');
    await Util.sleep(30000);

    await runDatabaseMigration();
    await prefetchStaticLenses();

    console.log('Initialization complete! 🎉');
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
            DB.insertLens(staticLenses[i]["lenses"], true);
            await Util.sleep(1000);
        }
    } catch (e) {
        console.error(e);
    }
}

export { bootstrap };