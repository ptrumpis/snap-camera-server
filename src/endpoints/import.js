import express from 'express';
import formidable from 'formidable';
import os from 'os';
import path from 'path';
import { Config } from '../utils/config.js';
import * as fs from 'fs/promises';
import * as DB from '../utils/db.js';
import * as Importer from '../utils/importer.js';

var router = express.Router();

const tempDir = os.tmpdir();

const configAllowOverwrite = Config.import.allow_overwrite;

router.get('/', async function (req, res, next) {
    return res.json("import enabled");
});

const formMiddleWare = (req, res, next) => {
    const form = formidable({ uploadDir: tempDir, multiples: true });
    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        req.fields = fields || [];
        req.files = files || [];
        req.allowOverwrite = fields.allow_overwrite === 'true' ? true : false;
        next();
    });
};

router.post('/', formMiddleWare, async function (req, res, next) {
    console.log("Import API call from", req.ip);

    let newLensIds = [];
    let existingLensIds = [];
    let lensFiles = [];
    let settingsJson = false;
    let error = false;

    try {
        // both server and user must allow overwriting of existing lenses
        const allowOverwrite = req.allowOverwrite && configAllowOverwrite;

        // process and filter upload data
        const files = Object.values(req.files)[0];
        if (Array.isArray(files)) {
            for (let i = 0; i < files.length; i++) {
                let parentDir = path.basename(path.dirname(files[i].originalFilename));
                let fileName = path.basename(files[i].originalFilename);

                // collect and verify required import data
                if (files[i].size > 0) {
                    if (fileName === "lens.lns") {
                        const lensId = parseInt(parentDir);
                        if (lensId) {
                            newLensIds.push(lensId);
                            lensFiles.push({ id: lensId, path: files[i].filepath });

                            // skip file removal of lenses until import is complete
                            continue;
                        }
                    } else if (fileName === "settings.json") {
                        settingsJson = JSON.parse(await fs.readFile(files[i].filepath));
                    }
                }

                // remove unknown files & settings.json
                await fs.unlink(files[i].filepath);
            }

            if (!settingsJson) {
                error = 'missing settings.json';
            } else if (!lensFiles.length) {
                error = 'missing lens.lns files';
            } else {
                // query existing Lens IDs to exclude them from import and optionally update them
                existingLensIds = await DB.getDuplicatedLensIds(newLensIds);

                // start file import
                for (let j = 0; j < lensFiles.length; j++) {
                    const isDuplicated = existingLensIds.includes(lensFiles[j].id);
                    if (isDuplicated) {
                        let index = newLensIds.indexOf(lensFiles[j].id);
                        if (index !== -1) {
                            newLensIds.splice(index, 1);
                        }

                        if (allowOverwrite) {
                            console.log("Re-importing existing Lens", lensFiles[j].id);
                            await Importer.importLens(lensFiles[j].path, lensFiles[j].id, false);
                        }
                    } else {
                        console.log("Importing new Lens", lensFiles[j].id);
                        await Importer.importLens(lensFiles[j].path, lensFiles[j].id);
                    }

                    // file import is complete, remove temporary file
                    await fs.unlink(lensFiles[j].path);
                }

                // create matching database records for new imported files
                const insertData = Importer.exportFromAppSettings(settingsJson, newLensIds);
                if (insertData) {
                    await DB.insertLens(insertData['lenses']);
                    await DB.insertUnlock(insertData['unlocks']);
                }

                // update unlocks table for existing lenses if config option is set
                if (allowOverwrite) {
                    const updateData = Importer.exportFromAppSettings(settingsJson, existingLensIds, false);
                    if (updateData) {
                        await DB.updateLens(updateData['lenses']);
                        await DB.updateUnlock(updateData['unlocks']);
                    }
                }
            }
        } else {
            error = 'array of files expected';
        }
    } catch (e) {
        console.error(e);
        error = 'server side error';
    }

    if (error) {
        return res.json({
            error: error
        });
    }

    return res.json({
        import: newLensIds,
        update: allowOverwrite ? existingLensIds : [],
    });
});

export default router;