/*
Snap Lens Web Crawler
(c) 2023-2025 by Patrick Trumpis
Original code copy from:
https://github.com/ptrumpis/snap-lens-web-crawler
*/
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

export default class SnapLensWebCrawler {
    SCRIPT_SELECTOR = '#__NEXT_DATA__';
    constructor(connectionTimeoutMs = 9000, headers = null) {
        this.json = {};
        this.connectionTimeoutMs = connectionTimeoutMs;
        this.headers = headers || { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
        };
    }

    async getLensByHash(hash, rawOutput = false) {
        try {
            const body = await this._loadUrl('https://lens.snapchat.com/' + hash);
            const $ = cheerio.load(body);
            const json = JSON.parse($(this.SCRIPT_SELECTOR).text());

            // debugging
            if (rawOutput) {
                return json;
            }

            if (json && json?.props?.pageProps?.lensDisplayInfo) {
                return this._lensInfoToLens(json.props.pageProps.lensDisplayInfo);
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    async getLensesByCreator(obfuscatedSlug, offset = 0, limit = 100, rawOutput = false) {
        let lenses = [];
        try {
            limit = Math.min(100, limit);
            const jsonString = await this._loadUrl('https://lensstudio.snapchat.com/v1/creator/lenses/?limit=' + limit + '&offset=' + offset + '&order=1&slug=' + obfuscatedSlug);
            if (jsonString) {
                const json = JSON.parse(jsonString);

                // debugging
                if (rawOutput) {
                    return json;
                }

                if (json && json.lensesList) {
                    for (let i = 0; i < json.lensesList.length; i++) {
                        const item = json.lensesList[i];
                        if (item.lensId && item.deeplinkUrl && item.name && item.creatorName) {
                            lenses.push(this._lensItemToLens(item, obfuscatedSlug));
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
        return lenses;
    }

    async searchLenses(search, rawOutput = false) {
        const slug = search.replace(/\W+/g, '-');
        let lenses = [];
        try {
            const body = await this._loadUrl('https://www.snapchat.com/explore/' + slug);
            const $ = cheerio.load(body);
            const json = JSON.parse($(this.SCRIPT_SELECTOR).text());

            // debugging
            if (rawOutput) {
                return json;
            }

            if (json && json?.props?.pageProps?.initialApolloState) {
                // original data structure
                const results = json.props.pageProps.initialApolloState;
                for (const key in results) {
                    if (key != 'ROOT_QUERY') {
                        if (results[key].id && results[key].deeplinkUrl && results[key].lensName) {
                            lenses.push(this._lensItemToLens(results[key]));
                        }
                    }
                }
            } else if (json && json?.props?.pageProps?.encodedSearchResponse) {
                // new data structure introduced in summer 2024
                const searchResult = JSON.parse(json.props.pageProps.encodedSearchResponse);
                let results = [];
                for (const index in searchResult.sections) {
                    if (searchResult.sections[index].title === 'Lenses') {
                        results = searchResult.sections[index].results;
                        break;
                    }
                }

                for (const index in results) {
                    if (results[index]?.result?.lens) {
                        let lens = results[index].result.lens;
                        if (lens.lensId && lens.deeplinkUrl && lens.name) {
                            lenses.push(this._lensItemToLens(lens));
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
        return lenses;
    }

    async getUserProfileLenses(userName, rawOutput = false) {
        let lenses = [];
        try {
            const body = await this._loadUrl('https://www.snapchat.com/add/' + userName);
            const $ = cheerio.load(body);
            const json = JSON.parse($(this.SCRIPT_SELECTOR).text());

            // debugging
            if (rawOutput) {
                return json;
            }

            if (json && json?.props?.pageProps?.lenses) {
                const results = json.props.pageProps.lenses;
                for (const index in results) {
                    lenses.push(this._lensInfoToLens(results[index], userName));
                }
            }
        } catch (e) {
            console.error(e);
        }
        return lenses;
    }

    async getTopLenses(rawOutput = false) {
        let lenses = [];
        try {
            const body = await this._loadUrl('https://www.snapchat.com/lens');
            const $ = cheerio.load(body);
            const json = JSON.parse($(this.SCRIPT_SELECTOR).text());

            // debugging
            if (rawOutput) {
                return json;
            }

            if (json && json?.props?.pageProps?.topLenses) {
                const results = json.props.pageProps.topLenses;
                for (const index in results) {
                    lenses.push(this._lensInfoToLens(results[index]));
                }
            }
        } catch (e) {
            console.error(e);
        }
        return lenses;
    }

    async _loadUrl(url) {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, this.connectionTimeoutMs);

        try {
            const response = await fetch(url, { signal: controller.signal, headers: this.headers });
            if (response.status !== 200) {
                console.warn("Unexpected HTTP status", response.status);
            }
            return await response.text();
        } catch (e) {
            console.error('Request failed:', e);
        } finally {
            clearTimeout(timeout);
        }

        return null;
    }

    // creator and search lens formatting
    _lensItemToLens(lensItem, obfuscatedSlug = '') {
        const uuid = this._extractUuidFromDeeplink(lensItem.deeplinkUrl);
        let result = {
            unlockable_id: lensItem.id || lensItem.lensId,
            uuid: uuid,
            snapcode_url: lensItem.snapcodeUrl || this._snapcodeUrl(uuid),

            lens_name: lensItem.lensName || lensItem.name || "",
            lens_creator_search_tags: [],
            lens_tags: "",
            lens_status: "Live",

            user_display_name: lensItem.creator?.title || lensItem.creatorName || "",
            user_name: "",
            user_profile_url: "",
            user_id: lensItem.creatorUserId || "",
            user_profile_id: lensItem.creatorProfileId || "",

            deeplink: lensItem.deeplinkUrl || "",
            icon_url: lensItem.iconUrl || "",
            thumbnail_media_url: lensItem.thumbnailUrl || lensItem.previewImageUrl || "",
            thumbnail_media_poster_url: lensItem.thumbnailUrl || lensItem.previewImageUrl || "",
            standard_media_url: lensItem.previewVideoUrl || "",
            standard_media_poster_url: "",
            obfuscated_user_slug: obfuscatedSlug || "",
            image_sequence: {}
        };

        if (lensItem.thumbnailSequence) {
            result.image_sequence = {
                url_pattern: lensItem.thumbnailSequence?.urlPattern || "",
                size: lensItem.thumbnailSequence?.numThumbnails || 0,
                frame_interval_ms: lensItem.thumbnailSequence?.animationIntervalMs || 0
            }
        }
        return result;
    }

    // top lenses, user profile lenses and single lens formatting
    _lensInfoToLens(lensInfo, userName = '') {
        const uuid = lensInfo.scannableUuid || this._extractUuidFromDeeplink(lensInfo.unlockUrl);
        return {
            //lens
            unlockable_id: lensInfo.lensId,
            uuid: uuid,
            snapcode_url: this._snapcodeUrl(uuid),

            lens_name: lensInfo.lensName || "",
            lens_creator_search_tags: lensInfo.lensCreatorSearchTags || [],
            lens_tags: "",
            lens_status: "Live",

            user_display_name: lensInfo.lensCreatorDisplayName || "",
            user_name: lensInfo.lensCreatorUsername || userName || "",
            user_profile_url: lensInfo.userProfileUrl || this._profileUrl(lensInfo.lensCreatorUsername || userName),
            user_id: "",
            user_profile_id: "",

            deeplink: lensInfo.unlockUrl || "",
            icon_url: lensInfo.iconUrl || "",
            thumbnail_media_url: lensInfo.lensPreviewImageUrl || "",
            thumbnail_media_poster_url: lensInfo.lensPreviewImageUrl || "",
            standard_media_url: lensInfo.lensPreviewVideoUrl || "",
            standard_media_poster_url: "",
            obfuscated_user_slug: "",
            image_sequence: {},

            //unlock
            lens_id: lensInfo.lensId,
            lens_url: lensInfo.lensResource?.archiveLink || "",
            signature: lensInfo.lensResource?.signature || "",
            sha256: lensInfo.lensResource?.checkSum || "",
            hint_id: "",
            additional_hint_ids: {},
            last_updated: lensInfo.lensResource?.lastUpdated || "",
        };
    }

    _profileUrl(username) {
        if (typeof username === 'string' && username) {
            return "https://www.snapchat.com/add/" + username;
        }
        return '';
    }

    _snapcodeUrl(uuid) {
        if (typeof uuid === 'string' && uuid) {
            return "https://app.snapchat.com/web/deeplink/snapcode?data=" + uuid + "&version=1&type=png";
        }
        return '';
    }

    _extractUuidFromDeeplink(deeplink) {
        if (typeof deeplink === "string" && deeplink && (deeplink.startsWith("https://www.snapchat.com/unlock/?") || deeplink.startsWith("https://snapchat.com/unlock/?"))) {
            let deeplinkURL = new URL(deeplink);
            const regexExp = /^[a-f0-9]{32}$/gi;
            if (regexExp.test(deeplinkURL.searchParams.get('uuid'))) {
                return deeplinkURL.searchParams.get('uuid');
            }
        }
        return '';
    }
}