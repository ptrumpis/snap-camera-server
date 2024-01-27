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
                enable_web_source: true,
                enable_cache_import: true,
                mirror_search_results: false,
                ignore_alt_media: true,
                ignore_img_sequence: true,
            },
            storage: {
                urls: [
                    'https://app.snapchat.com',
                    'https://bolt-gcdn.sc-cdn.net',
                    'https://community-lens.storage.googleapis.com',
                    'https://lens-preview-storage.storage.googleapis.com',
                    'https://lens-storage.storage.googleapis.com',
                    'https://snapcodes.storage.googleapis.com',
                    'https://storage.googleapis.com',
                ]
            }
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
                if (lowercaseKey === 'relay_server' && !yamlConfig.app.relay.server) {
                    yamlConfig.app.relay.server = process.env[key];
                } else if (lowercaseKey === 'relay_timeout' && !yamlConfig.app.relay.timeout) {
                    yamlConfig.app.relay.timeout = parseInt(process.env[key], 10);
                } else {
                    if (!yamlConfig.app.flag.hasOwnProperty(lowercaseKey)) {
                        yamlConfig.app.flag[lowercaseKey] = parseBoolean(process.env[key]);
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

function parseBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        return value.trim().toLowerCase() === 'true';
    }

    return Boolean(value);
}

function deepMerge(obj1, obj2) {
    const merged = { ...obj1 };

    for (const key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            if (obj1.hasOwnProperty(key) && typeof obj1[key] === 'object' && obj2[key] && typeof obj2[key] === 'object') {
                merged[key] = deepMerge(obj1[key], obj2[key]);
            } else {
                if (obj2[key] !== null && obj2[key] !== undefined) {
                    merged[key] = obj2[key];
                }
            }
        }
    }

    return merged;
}

export { Config };