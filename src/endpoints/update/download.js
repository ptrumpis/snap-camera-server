import express from 'express';

var router = express.Router();

router.get('/', async function (req, res, next) {
    return res.json({});
});

router.post('/', async function (req, res, next) {
    return res.json({});
});

export default router;