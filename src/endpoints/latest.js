import express from 'express'
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const customResponse = require('../json/latest.json');

var router = express.Router();

router.get('/', async function (req, res, next) {
	return res.json(customResponse);
});

export default router;