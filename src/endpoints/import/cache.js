import express from 'express';
import formidable from 'formidable';
import os from 'os';
import path from 'path';
import { Config } from '../../utils/config.js';
import * as fs from 'fs/promises';
import * as DB from '../../utils/db.js';
import * as Importer from '../../utils/importer.js';
import * as Util from '../../utils/helper.js';

var router = express.Router();

const tempDir = os.tmpdir();

const configAllowOverwrite = Config.import.allow_overwrite;

router.get('/', async function (req, res, next) {
    return res.json("cache import enabled");
});

const formMiddleWare = (req, res, next) => {
    const form = formidable({ uploadDir: tempDir, multiples: true });
    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }

        if (!files || Object.keys(files).length === 0) {
            res.json({ error: "No files uploaded." });
            return;
        }

        const allFiles = [];
        for (const fieldName in files) {
            if (files.hasOwnProperty(fieldName)) {
                const fileArray = [].concat(files[fieldName] || []);
                allFiles.push(...fileArray);
            }
        }

        req.files = allFiles;
        req.allowOverwrite = fields.allow_overwrite === 'true';

        next();
    });
};

router.post('/', formMiddleWare, async function (req, res, next) {
    console.log("Import Cache API call from", req.ip);

    let imported = [];
    let updated = [];
    let error = false;

    try {
        // both server and user must allow overwriting of existing lenses
        const allowOverwrite = req.allowOverwrite && configAllowOverwrite;

        let lensIds = [];
        let lenses = [];
        let settingsJson = false;

        // process and filter upload data
        for (let i = 0; i < req.files.length; i++) {
            let parentDir = path.basename(path.dirname(req.files[i].originalFilename));
            let fileName = path.basename(req.files[i].originalFilename);

            // collect and verify required import data
            if (req.files[i].size > 0) {
                if (fileName === "lens.lns") {
                    const lensId = parseInt(parentDir);
                    if (Util.isLensId(lensId)) {
                        lensIds.push(lensId);
                        lenses.push({ id: lensId, path: req.files[i].filepath });

                        // skip file removal of lenses until import is complete
                        continue;
                    }
                } else if (fileName === "settings.json") {
                    settingsJson = JSON.parse(await fs.readFile(req.files[i].filepath));
                }
            }

            // remove unknown files & settings.json
            await fs.unlink(req.files[i].filepath);
        }

        if (!settingsJson) {
            error = 'Missing settings.json file.';
        } else if (!lenses.length) {
            error = 'Missing lens.lns files.';
        } else {
            // query existing Lens IDs to exclude them from import and optionally update them
            const duplicatedLensIds = await DB.getDuplicatedLensIds(lensIds);

            // start file import
            for (let j = 0; j < lenses.length; j++) {
                if (duplicatedLensIds.includes(lenses[j].id)) {
                    if (allowOverwrite) {
                        console.log("Re-importing existing Lens", lenses[j].id);

                        updated.push(lenses[j].id);

                        await Importer.importLens(lenses[j].path, lenses[j].id, false);
                    }
                } else {
                    console.log("Importing new Lens", lenses[j].id);

                    imported.push(lenses[j].id);

                    await Importer.importLens(lenses[j].path, lenses[j].id, true);
                }

                // file import is complete, remove temporary file
                await fs.unlink(lenses[j].path);
            }

            // create matching database records for new imported files
            if (imported.length) {
                const insertData = Importer.exportCacheLensesFromSettings(settingsJson, imported);
                if (insertData) {
                    await DB.insertLens(insertData['lenses']);
                    await DB.insertUnlock(insertData['unlocks']);
                }
            }

            // update unlocks table for existing lenses if config option is set
            if (updated.length) {
                const updateData = Importer.exportCacheLensesFromSettings(settingsJson, updated, false);
                if (updateData) {
                    await DB.updateLens(updateData['lenses']);
                    await DB.updateUnlock(updateData['unlocks']);
                }
            }
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