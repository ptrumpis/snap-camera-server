import YAML from 'yaml';
import * as fs from 'fs/promises';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const envConfig = dotenv.config();
for (const key in envConfig.parsed) {
    if (process.env[key]?.trim() === '') {
        process.env[key] = envConfig.parsed[key]?.trim() || '';
    }
}

const Config = await loadConfig();

async function loadConfig() {
    try {
        const configFile = await fs.readFile("config.yml", { encoding: 'utf8' });
        const yamlConfig = YAML.parse(configFile);

        const require = createRequire(import.meta.url);
        const defaultConfig = require('../json/config/defaults.json');

        return deepMerge(defaultConfig, yamlConfig);
    } catch (e) {
        console.error(`[Error] Failed to load configuration: ${e.message}`);
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