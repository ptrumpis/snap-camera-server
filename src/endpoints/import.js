import express from "express";

var router = express.Router();

router.get('/', async function (req, res, next) {
	return res.json("Hello");
});

export default router;