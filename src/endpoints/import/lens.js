import express from 'express';
import formidable from 'formidable';
import os from 'os';
import { Config } from '../../utils/config.js';
import * as fs from 'fs/promises';
import * as DB from '../../utils/db.js';
import * as Importer from '../../utils/importer.js';
import * as Util from '../../utils/helper.js';
import * as Web from '../../utils/web.js';

var router = express.Router();

const tempDir = os.tmpdir();

const configAllowOverwrite = Config.import.allow_overwrite;

router.get('/', async function (req, res, next) {
    return res.json("lens import enabled");
});

const formMiddleWare = (req, res, next) => {
    const form = formidable({ uploadDir: tempDir, multiples: true });
    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }

        // file[] and id[] fields required
        fields.id = [].concat(fields.id || []);
        files.file = [].concat(files.file || []);

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
        req.allowOverwrite = fields.allow_overwrite === 'true';

        next();
    });
};

router.post('/', formMiddleWare, async function (req, res, next) {
    console.log("Import Lens API call from", req.ip);

    let imported = [];
    let updated = [];
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
                lensIds.push(id);
                lenses.push({ id: id, path: file.filepath, web: false });
            } else if (Util.isUrl(id)) {
                // share URL given
                const uuid = Util.parseLensUuid(id);
                if (uuid) {
                    const lens = await Web.getLensByHash(uuid);
                    if (lens && lens.lens_id) {
                        lensIds.push(lens.lens_id);
                        lenses.push({ id: lens.lens_id, path: file.filepath, web: lens });
                    }
                }
            }
        }

        let insertData = [];
        let updateData = [];

        // find already existing lenses and re-import if allow overwrite flag is set
        const duplicatedLensIds = await DB.getDuplicatedLensIds(lensIds);

        for (let i = 0; i < lenses.length; i++) {
            if (duplicatedLensIds.includes(lenses[i].id)) {
                if (allowOverwrite) {
                    console.log("Re-importing existing Lens", lenses[i].id);

                    await Importer.importLens(lenses[i].path, lenses[i].id, false);

                    const lens = (lenses[i].web) ? Importer.exportCustomLensFromWebLens(lenses[i].web, true) : Importer.exportCustomLens(lenses[i].id, true);
                    if (lens) {
                        updateData.push(lens);
                        updated.push(lenses[i].id);
                    }
                }
            } else {
                console.log("Importing new Lens", lenses[i].id);

                await Importer.importLens(lenses[i].path, lenses[i].id, true);

                const lens = (lenses[i].web) ? Importer.exportCustomLensFromWebLens(lenses[i].web, false) : Importer.exportCustomLens(lenses[i].id, false);
                if (lens) {
                    insertData.push(lens);
                    imported.push(lenses[i].id);
                }
            }

            // file import is complete, remove temporary file
            await fs.unlink(lenses[i].path);
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
        error = 'A server side error occured.';
    }

    return res.json({
        error: error,
        import: imported,
        update: updated
    });
});

export default router;