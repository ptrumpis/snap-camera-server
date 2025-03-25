import SnapLensWebCrawler from '@ptrumpis/snap-lens-web-crawler/crawler';
import dbmigrate from 'db-migrate';
import { createRequire } from 'module';
import { Config } from './utils/config.js';
import * as Cache from './utils/cache.js';
import * as DB from './utils/db.js';
import * as Util from './utils/helper.js';

const useWebSource = Config.app.flag.enable_web_source;

const topLensesRefreshSeconds = Math.max(Config.top.interval || 0, 3600);
const cacheTopLensesInterval = (useWebSource) ? setInterval(async () => {
    await cacheTopLenses();
}, topLensesRefreshSeconds * 1000).unref() : null;

if (useWebSource) {
    cacheTopLenses();
}

async function bootstrap() {
    while (!await DB.isDatabaseReady()) {
        console.info(`[Info] ⏳ Waiting for the database server to respond...`);
        await Util.sleep(6000);
    }

    await runDatabaseMigration();
    await prefetchStaticLenses();

    process.on('SIGTERM', () => { shutdown(); });
    process.on('SIGINT', () => { shutdown(); });

    console.info(`[Info] ✅ Initialization complete!`);
}

function shutdown() {
    console.info(`[Info] 💤 Shutting down...`);

    if (cacheTopLensesInterval) {
        clearInterval(cacheTopLensesInterval);
    }

    process.exit(0);
}

async function runDatabaseMigration() {
    try {
        const migration = dbmigrate.getInstance(true);
        await migration.up();
        console.info(`[Info] ✅ Database migration complete!`);
    } catch (e) {
        console.error(`[Error] Database migration failed: ${e.message}`);
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
        console.info(`[Info] 🔄 Prefetching static lenses...`);

        for (let i = 0; i < staticLenses.length; i++) {
            await DB.insertLens(staticLenses[i]["lenses"]);
        }

        console.info(`[Info] ✅ Lens prefetching complete!`);
    } catch (e) {
        console.error(`[Error] Prefetching failed: ${e.message}`);
    }

    staticLenses.length = 0;
}

async function cacheTopLenses() {
    const Crawler = new SnapLensWebCrawler(Config.top.crawler);

    try {
        console.info(`[Info] 🔄 Caching top lenses...`);

        for (const category in Crawler.TOP_CATEGORIES) {
            let topLenses = await Crawler.getTopLensesByCategory(category, null);
            if (Array.isArray(topLenses) && topLenses.length) {
                for (const lens of topLenses) {
                    if (!lens.lens_url) {
                        continue;
                    }

                    Cache.Top.set(lens.unlockable_id, lens);
                }
            }

            topLenses.length = 0;
            topLenses = null;
        }

        console.info(`[Info] ✅ Top lenses successfully cached!`);
    } catch (e) {
        console.error(`[Error] Caching top lenses failed: ${e.message}`);
    } finally {
        Crawler.destroy();
    }
}

export { bootstrap };