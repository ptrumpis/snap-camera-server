import NodeCache from 'node-cache';
import { Config } from './config.js';

const Search = new NodeCache(Config.search.cache);
const Top = new NodeCache(Config.top.cache);

export { Search, Top };