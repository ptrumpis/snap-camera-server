import YAML from 'yaml';
import * as fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const Config = await loadConfig();

async function loadConfig() {
    try {
        const configFile = await fs.readFile("config.yml", { encoding: 'utf8' });
        const yamlConfig = YAML.parse(configFile);

        // default values
        const defaultConfig = {
            app: {
                relay: {
                    server: false,
                    timeout: 6000,
                },
                flag: {
                    enable_web_source: true,
                    enable_custom_source: true,
                    enable_cache_import: true,
                    enable_custom_import: true,
                    mirror_search_results: false,
                    ignore_alt_media: true,
                    ignore_img_sequence: true,
                },
            },
            media: {
                placeholder: {
                    thumbnail: false,
                    snapcode: false,
                    icon: false,
                },
            },
            import: {
                allow_overwrite: true,
                zip_archive: true,
            },
            search: {
                timeout: 9000,
                web_cache: {
                    ttl: 1800,
                    check: 600,
                },
                creator_url: 'https://lensstudio.snapchat.com/creator/',
                share_urls: [],
            },
            storage: {
                urls: [],
            },
        };

        // @todo remove support code block in v4
        // support for .env application config will be dropped in version 4
        // --> 3.x support block start
        const envKeys = [
            'RELAY_SERVER',
            'RELAY_TIMEOUT',
            'ENABLE_WEB_SOURCE',
            'ENABLE_CACHE_IMPORT',
            'MIRROR_SEARCH_RESULTS',
            'IGNORE_ALT_MEDIA',
            'IGNORE_IMG_SEQUENCE'
        ];

        // merge values from .env into yamlConfig,
        // but let config.yml values take precedence
        envKeys.forEach((envKey) => {
            const lowercaseKey = envKey.toLowerCase();

            if (process.env[envKey] !== undefined) {
                if (lowercaseKey === 'relay_server') {
                    if (!yamlConfig.app.relay.server) {
                        yamlConfig.app.relay.server = process.env[envKey];
                    }
                } else if (lowercaseKey === 'relay_timeout') {
                    if (!yamlConfig.app.relay.timeout) {
                        yamlConfig.app.relay.timeout = parseInt(process.env[envKey], 10);
                    }
                } else {
                    if (!yamlConfig.app.flag.hasOwnProperty(lowercaseKey)) {
                        yamlConfig.app.flag[lowercaseKey] = parseBoolean(process.env[envKey]);
                    }
                }
            }
        });
        // <-- 3.x support block end

        return deepMerge(defaultConfig, yamlConfig);
    } catch (e) {
        console.error("Error loading configuration", e);
    }
    return {};
}

function deepMerge(obj1, obj2) {
    const merged = { ...obj1 };

    for (const [key, value] of Object.entries(obj2)) {
        if (obj1[key] && typeof obj1[key] === 'object' && value && typeof value === 'object') {
            if (Array.isArray(obj1[key]) && Array.isArray(value)) {
                merged[key] = mergeArraysUnique(obj1[key], value);
            } else {
                merged[key] = deepMerge(obj1[key], value);
            }
        } else if (value !== null && value !== undefined) {
            merged[key] = value;
        }
    }

    return merged;
}

function mergeArraysUnique(arr1, arr2) {
    const set = new Set([...arr1, ...arr2]);
    return Array.from(set);
}

export { Config };