import YAML from 'yaml';
import * as fs from 'fs/promises';

const Config = await loadConfig();

async function loadConfig() {
    try {
        const file = await fs.readFile("config.yml", { encoding: 'utf8' });
        return YAML.parse(file);
    } catch (e) {
        console.error(e);
    }
    return {};
}

export { Config }