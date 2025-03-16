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

router.get('/', (req, res) => res.json('cache import enabled'));

const parseForm = (req, res, next) => {
    const form = formidable({ uploadDir: tempDir, multiples: true });
    form.parse(req, (err, fields, files) => {
        if (err) {
            return next(err);
        }

        if (!files || Object.keys(files).length === 0) {
            return res.json({ error: "No files uploaded." });
        }

        const allFiles = Object.values(files).flat().filter(file => file.size > 0);
        if (allFiles.length === 0) {
            return res.json({ error: 'All uploaded files are empty.' });
        }

        req.files = Array.isArray(allFiles) ? allFiles : [allFiles];
        req.allowOverwrite = Array.isArray(fields.allow_overwrite) ? fields.allow_overwrite[0] === 'true' : fields.allow_overwrite === 'true';

        next();
    });
};

router.post('/', parseForm, async function (req, res, next) {
    console.log("Import Cache API call from", req.ip);

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
        let settingsJson = false;

        // process and filter upload data
        for (const file of req.files) {
            let parentDir = path.basename(path.dirname(file.originalFilename));
            let fileName = path.basename(file.originalFilename);

            // collect and verify required import data
            if (fileName === "lens.lns") {
                const lensId = Number(parentDir);
                if (Util.isLensId(lensId)) {
                    lensIds.push(lensId);
                    lenses.push({ id: lensId, path: file.filepath });

                    // skip file removal of lenses until import is complete
                    continue;
                }
            } else if (fileName === "settings.json") {
                try {
                    settingsJson = JSON.parse(await fs.readFile(file.filepath));
                } catch (e) {
                    return res.json({ error: 'Invalid JSON format in settings.json.' });
                }
            }

            // remove unknown files & settings.json
            await fs.unlink(file.filepath);
        }

        if (!settingsJson) {
            error = 'Missing settings.json file.';
        } else if (!lenses.length) {
            error = 'Missing lens.lns files.';
        } else {
            // query existing Lens IDs to exclude them from import and optionally update them
            const duplicatedLensIds = await DB.getDuplicatedLensIds(lensIds);

            // start file import
            let importedLenses = [];
            let updatedLenses = [];
            for (const lens of lenses) {
                const lensId = Number(lens.id);
                if (duplicatedLensIds.includes(lensId)) {
                    if (allowOverwrite) {
                        console.log("Re-importing existing Lens", lensId);
                        const lensFilePath = await Importer.importLensFile(lens.path, lensId, false);
                        if (lensFilePath) {
                            updatedLenses.push({ id: lensId, path: lensFilePath });
                            updated.push(lensId);
                        } else {
                            failed.push(lensId);
                        }
                    } else {
                        console.log("Discarding existing Lens", lensId);
                        discarded.push(lensId);
                    }
                } else {
                    console.log("Importing new Lens", lensId);
                    const lensFilePath = await Importer.importLensFile(lens.path, lensId, true);
                    if (lensFilePath) {
                        importedLenses.push({ id: lensId, path: lensFilePath });
                        imported.push(lensId);
                    } else {
                        failed.push(lensId);
                    }
                }

                // file import is complete, remove temporary file
                await fs.unlink(lens.path);
            }

            if (importedLenses.length) {
                const insertData = Importer.importCacheLensesFromSettings(settingsJson, importedLenses, false);
                if (insertData) {
                    await DB.insertLens(insertData['lenses']);
                    await DB.insertUnlock(insertData['unlocks']);

                    const actuallyImported = insertData['lenses'].map((entry) => entry.unlockable_id);
                    failed = failed.concat(imported.filter(id => !actuallyImported.includes(id)));
                    imported = actuallyImported;
                } else {
                    failed = failed.concat(imported);
                    imported = [];
                }
            }

            if (updatedLenses.length) {
                const updateData = Importer.importCacheLensesFromSettings(settingsJson, updatedLenses, true);
                if (updateData) {
                    await DB.updateLens(updateData['lenses']);
                    await DB.updateUnlock(updateData['unlocks']);

                    const actuallyUpdated = updateData['lenses'].map((entry) => entry.unlockable_id);
                    failed = failed.concat(updated.filter(id => !actuallyUpdated.includes(id)));
                    updated = actuallyUpdated;
                } else {
                    failed = failed.concat(updated);
                    updated = [];
                }
            }
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