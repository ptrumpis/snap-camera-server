import NodeCache from 'node-cache';
import { Config } from './config.js';

const SearchCache = new NodeCache({
    stdTTL: Config.search.web_cache.ttl,
    checkperiod: Config.search.web_cache.check,
});

export { SearchCache };