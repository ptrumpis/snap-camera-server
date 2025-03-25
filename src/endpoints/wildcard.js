import express from 'express';

var router = express.Router();

router.get('/', async function (req, res, next) {
    console.debug("[Debug] Undocumented GET URL:", req.originalUrl);
    return res.json({});
});

router.post('/', async function (req, res, next) {
    console.debug("[Debug] Undocumented POST URL:", req.originalUrl, req.body);
    return res.json({});
});

export default router;