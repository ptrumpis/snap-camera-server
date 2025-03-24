import NodeCache from 'node-cache';
import { Config } from './config.js';

const SearchCache = new NodeCache(Config.search.cache);

export { SearchCache };