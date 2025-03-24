import NodeCache from 'node-cache';
import { Config } from './config.js';

const SearchCache = new NodeCache(Config.search.cache);
const TopCache = new NodeCache(Config.top.cache);

export { SearchCache, TopCache };