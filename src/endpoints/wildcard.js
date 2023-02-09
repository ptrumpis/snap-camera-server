import express from 'express'

var router = express.Router();

router.get('/', async function (req, res, next) {
	let response;
	console.log("Undocumented GET URL:", req.originalUrl);
	return res.json(response);
});

router.post('/', async function (req, res, next) {
	let response;
	console.log("Undocumented POST URL:", req.originalUrl, req.body);
	return res.json(response);
});

export default router;