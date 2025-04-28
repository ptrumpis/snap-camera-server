import { SnapLensWebCrawler, CrawlerFailure } from '@ptrumpis/snap-lens-web-crawler';
import { Config } from './config.js';
import * as Cache from './cache.js';
import * as DB from './db.js';
import * as Util from './helper.js';

const Crawler = new SnapLensWebCrawler(Config.search.crawler);

async function search(searchTerm) {
    try {
        if (searchTerm.startsWith(Config.search.creator_url)) {
            const slug = searchTerm.substr(searchTerm.lastIndexOf('/') + 1);
            return await searchByCreatorSlug(slug);
        }

        let result = [];
        if (Util.isLensUuid(searchTerm)) {
            result = await getLensByHash(searchTerm) || [];
        } else if (Util.isUrl(searchTerm)) {
            const uuid = Util.parseLensUuidFromShareUrl(searchTerm);
            if (uuid) {
                result = await getLensByHash(uuid) || [];
            } else {
                result = await searchByUrl(searchTerm);
            }
        } else {
            result = await searchByTerm(searchTerm);
        }

        if (!Array.isArray(result)) {
            result = [result];
        }

        return result.map(lens => ({ ...lens, web_import: 1 }));
    } catch (e) {
        console.error(e);
    }

    return [];
}

async function searchByUrl(url) {
    const lenses = await Crawler.getLensesFromUrl(url);
    return lenses instanceof CrawlerFailure ? [] : lenses.map(lens => ({ ...lens, web_import: 1 }));
}

async function searchByTerm(searchTerm) {
    const lenses = await Crawler.searchLenses(searchTerm);
    return lenses instanceof CrawlerFailure ? [] : lenses.map(lens => ({ ...lens, web_import: 1 }));
}

async function searchByCreatorSlug(obfuscatedUserSlug) {
    const lenses = await Crawler.getLensesByCreator(obfuscatedUserSlug);
    return lenses instanceof CrawlerFailure ? [] : lenses.map(lens => ({ ...lens, web_import: 1 }));
}

async function getLensByHash(uuid) {
    const lens = await Crawler.getLensByHash(uuid);
    if (!(lens instanceof CrawlerFailure)) {
        lens.web_import = 1;
        return lens;
    }
    return null;
}

async function getUnlockByHash(uuid) {
    const [lensResult, archivedLensResult] = await Promise.allSettled([
        getLensByHash(uuid),
        Crawler.getLensByArchivedSnapshot(uuid)
    ]);

    const lens = lensResult.status === "fulfilled" && !(lensResult.value instanceof CrawlerFailure)
        ? lensResult.value
        : {};

    const archivedLens = archivedLensResult.status === "fulfilled" && !(archivedLensResult.value instanceof CrawlerFailure)
        ? archivedLensResult.value
        : {};

    const unlock = Util.mergeLens(archivedLens, lens);
    if (unlock && unlock.lens_id && unlock.lens_url) {
        unlock.web_import = 1;
        return unlock;
    }

    return null;
}

async function mirrorSearchResults(webResults) {
    if (Array.isArray(webResults) && webResults.length) {
        for (let lens of webResults) {
            if (!lens.uuid) {
                continue;
            }

            try {
                if (!lens.lens_url || !Util.isLensId(lens.lens_id)) {
                    const unlock = await getUnlockByHash(lens.uuid);
                    if (unlock) {
                        lens = Util.mergeLens(unlock, lens);
                    }
                }

                if (lens?.lens_name && Util.isLensId(lens.unlockable_id)) {
                    await DB.insertLens(lens);
                }

                if (lens?.lens_url && Util.isLensId(lens.lens_id)) {
                    await DB.insertUnlock(lens);
                }
            } catch (e) {
                console.error(e);
            }
        }
    }
    webResults = null;
}

function cacheSearchResults(webResults, preferExistingLens = false) {
    if (Array.isArray(webResults) && webResults.length) {
        for (let lens of webResults) {
            if (!lens.unlockable_id || !lens.uuid) {
                continue;
            }

            if (Cache.Search.has(lens.unlockable_id)) {
                if (preferExistingLens) {
                    lens = Util.mergeLens(Cache.Search.get(lens.unlockable_id), lens);
                } else {
                    lens = Util.mergeLens(lens, Cache.Search.get(lens.unlockable_id));
                }
            }

            lens.web_import = 1;
            Cache.Search.set(lens.unlockable_id, lens);
        }
    }
    webResults = null;
}

export { search, getLensByHash, getUnlockByHash, mirrorSearchResults, cacheSearchResults }