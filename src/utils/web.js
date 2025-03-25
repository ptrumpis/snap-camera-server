import { SnapLensWebCrawler, CrawlerFailure } from '@ptrumpis/snap-lens-web-crawler';
import { Config } from './config.js';
import * as DB from './db.js';
import * as Util from './helper.js';

const Crawler = new SnapLensWebCrawler(Config.search.crawler);

async function search(searchTerm) {
    let result = [];
    try {
        if (searchTerm.startsWith(Config.search.creator_url)) {
            const slug = searchTerm.substr(searchTerm.lastIndexOf('/') + 1);
            return await searchByCreatorSlug(slug);
        }

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

        return await Promise.all(result.map(async lens => {
            lens.web_import = 1;
            return lens;
        }));
    } catch (e) {
        console.error(e);
    }

    return result;
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
    let [lens, archivedLens] = await Promise.all([
        getLensByHash(uuid),
        Crawler.getLensByArchivedSnapshot(uuid)
    ]);

    lens = lens instanceof CrawlerFailure ? {} : lens;
    archivedLens = archivedLens instanceof CrawlerFailure ? {} : archivedLens;

    const unlock = SnapLensWebCrawler.mergeLensItems(archivedLens, lens);
    if (unlock && unlock.lens_id && unlock.lens_url) {
        unlock.web_import = 1;
        return unlock;
    }

    return null;
}

async function mirrorSearchResults(webResults) {
    if (webResults && webResults.length) {
        for (let i = 0; i < webResults.length; i++) {
            if (webResults[i].uuid) {
                try {
                    // object has both lens/unlock attributes on success (with more info)
                    const lens = await getLensByHash(webResults[i].uuid);
                    if (lens && lens.unlockable_id && lens.lens_name && lens.user_display_name) {
                        await DB.insertLens(lens);
                    } else {
                        await DB.insertLens(webResults[i]);
                    }

                    // there is no fallback for the unlock
                    if (lens && lens.lens_id && lens.lens_url) {
                        await DB.insertUnlock(lens);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }
    webResults = null;
}

export { search, getLensByHash, getUnlockByHash, mirrorSearchResults }