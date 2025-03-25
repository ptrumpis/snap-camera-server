import express from 'express';
import formidable from 'formidable';
import os from 'os';
import { Config } from '../../utils/config.js';
import * as fs from 'fs/promises';
import * as DB from '../../utils/db.js';
import * as Importer from '../../utils/importer.js';
import * as Util from '../../utils/helper.js';
import * as Web from '../../utils/web.js';
import pkg from '../../../package.json' with { type: 'json' };

var router = express.Router();

const tempDir = os.tmpdir();
const configAllowOverwrite = Config.import.allow_overwrite;

router.get('/', (req, res) => res.type('json').send(JSON.stringify({ status: 'lens import enabled', version: pkg.version }, null, 4)));

const parseForm = (req, res, next) => {
    const form = formidable({ uploadDir: tempDir, multiples: true });
    form.parse(req, (err, fields, files) => {
        if (err) {
            return next(err);
        }

        fields.id = fields['id[]'] ? [].concat(fields['id[]']) : [].concat(fields.id);
        files.file = files['file[]'] ? [].concat(files['file[]']) : [].concat(files.file);

        delete fields['id[]'];
        delete files['file[]'];

        if (files.file.length === 0) {
            return res.json({ error: "No files uploaded." });
        }

        if (files.file.length !== fields.id.length) {
            return res.json({ error: "The number of files does not match the number of IDs." });
        }

        const uploadData = files.file.map((file, index) => ({
            file: file,
            id: fields.id[index].trim()
        }));

        req.uploadData = uploadData;
        req.allowOverwrite = Array.isArray(fields.allow_overwrite) ? fields.allow_overwrite[0] === 'true' : fields.allow_overwrite === 'true';

        next();
    });
};

router.post('/', parseForm, async function (req, res, next) {
    console.info(`[Import] Lens API call from: ${req.ip}`);

    let imported = [];
    let updated = [];
    let discarded = [];
    let failed = [];
    let error = false;

    try {
        // both server and user must allow overwriting of existing lenses
        const allowOverwrite = req.allowOverwrite && configAllowOverwrite;

        let lensIds = [];
        let lenses = [];

        // upload data can contain lens ID's or share URL's
        // fetch lens information for all given share URL's
        for (const { id, file } of req.uploadData) {
            if (Util.isLensId(id)) {
                // lens ID given
                const lensId = Number(id);
                lensIds.push(lensId);
                lenses.push({ id: lensId, path: file.filepath, web: false });
            } else {
                // share URL given or UUID
                const uuid = Util.parseLensUuid(id);
                if (!uuid) {
                    failed.push(id);
                    continue;
                }

                const lens = await Web.getLensByHash(uuid);
                if (!lens?.unlockable_id) {
                    failed.push(uuid);
                    continue;
                }

                const lensId = Number(lens.unlockable_id);
                lensIds.push(lensId);
                lenses.push({ id: lensId, path: file.filepath, web: lens });
            }
        }

        let insertData = [];
        let updateData = [];

        // find already existing lenses and re-import if allow overwrite flag is set
        const duplicatedLensIds = lensIds.length ? await DB.getDuplicatedLensIds(lensIds) : [];

        for (const lens of lenses) {
            const lensId = Number(lens.id);
            if (duplicatedLensIds.includes(lensId)) {
                if (allowOverwrite) {
                    console.info(`[Import] Re-importing existing Lens: ${lensId}`);
                    const lensFilePath = await Importer.importLensFile(lens.path, lensId, false);
                    if (lensFilePath) {
                        const data = (lens.web) ? Importer.importCustomLensFromWebLens(lens.web, lensFilePath, true) : Importer.importCustomLens(lensId, lensFilePath, true);
                        if (data) {
                            updateData.push(data);
                            updated.push(lensId);
                        } else {
                            failed.push(lensId);
                        }
                    } else {
                        failed.push(lensId);
                    }
                } else {
                    console.info(`[Import] Discarding existing Lens: ${lensId}`);
                    discarded.push(lensId);
                }
            } else {
                console.info(`[Import] Importing new Lens: ${lensId}`);
                const lensFilePath = await Importer.importLensFile(lens.path, lensId, true);
                if (lensFilePath) {
                    const data = (lens.web) ? Importer.importCustomLensFromWebLens(lens.web, lensFilePath, false) : Importer.importCustomLens(lensId, lensFilePath, false);
                    if (data) {
                        insertData.push(data);
                        imported.push(lensId);
                    } else {
                        failed.push(lensId);
                    }
                } else {
                    failed.push(lensId);
                }
            }

            // file import is complete, remove temporary file
            await fs.unlink(lens.path);
        }

        // create matching database records for new imported files
        if (insertData.length) {
            await DB.insertLens(insertData);
            await DB.insertUnlock(insertData);
        }

        // update unlocks table for existing lenses if config option is set
        if (updateData.length) {
            await DB.updateLens(updateData);
            await DB.updateUnlock(updateData);
        }
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'A server side error occured.' });
    }

    return res.json({
        error: error,
        import: imported,
        update: updated,
        discard: discarded,
        fail: failed
    });
});

router.use((err, req, res, next) => {
    console.error(err.name, err.message);
    return res.status(400).json({ error: 'Invalid files uploaded.' });
});

export default router;