import dbmigrate from 'db-migrate';
import * as DB from './utils/db.js';
import * as Util from './utils/helper.js';
import { createRequire } from 'module';

async function bootstrap() {
    while (!await DB.isDatabaseReady()) {
        console.log(`⏳ Waiting for the database server to respond...`);
        await Util.sleep(6000);
    }

    await runDatabaseMigration();
    await prefetchStaticLenses();

    process.on('SIGTERM', () => { shutdown(); });
    process.on('SIGINT', () => { shutdown(); });

    console.log(`✅ Initialization complete!`);
}

function shutdown() {
    console.log(`Shutting down... 💤`);
    process.exit(0);
}

async function runDatabaseMigration() {
    try {
        const migration = dbmigrate.getInstance(true);
        await migration.up();
        console.log(`✅ Database migration complete!`);
    } catch (e) {
        console.error(e);
    }
}

async function prefetchStaticLenses() {
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

    try {
        for (let i = 0; i < staticLenses.length; i++) {
            await DB.insertLens(staticLenses[i]["lenses"]);
        }

        console.log(`✅ Lens prefetching complete!`);
    } catch (e) {
        console.error(e);
    }

    staticLenses.length = 0;
}

export { bootstrap };