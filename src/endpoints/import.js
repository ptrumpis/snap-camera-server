import express from "express";
import os from 'os';
import path from "path";
import formidable from 'formidable';
import * as fs from "fs/promises";
import * as DB from '../utils/db.js';
import * as Importer from '../utils/importer.js';

var router = express.Router();

const tempDir = os.tmpdir();

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
		next();
	});
};

router.post('/', formMiddleWare, async function (req, res, next) {
	console.log("Import API call from", req.ip);

	let lensIds = [];
	let lensFiles = [];
	let settingsJson = false;
	let error = false;

	try {
		// process and filter upload data
		const files = Object.values(req.files)[0];
		if (Array.isArray(files)) {
			for (let i = 0; i < files.length; i++) {
				let parentDir = path.basename(path.dirname(files[i].originalFilename));
				let fileName = path.basename(files[i].originalFilename);

				if (files[i].size > 0) {
					if (fileName === "lens.lns") {
						const lensId = parseInt(parentDir);
						if (lensId) {
							lensIds.push(lensId);
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
			} else if (!lensFiles) {
				error = 'missing lens.lns files';
			} else {
				// import uploaded lenses, but ignore already existing ones
				const duplicatedLensIds = await DB.getDuplicatedLensIds(lensIds);
				for (let j = 0; j < lensFiles.length; j++) {
					if (duplicatedLensIds.includes(lensFiles[j].id)) {
						let index = lensIds.indexOf(lensFiles[j].id);
						if (index !== -1) {
							lensIds.splice(index, 1);
						}
					} else {
						console.log("Importing Lens", lensFiles[j].id);
						await Importer.importFromAppCache(lensFiles[j].path, lensFiles[j].id);
					}

					// file import is complete, remove temporary file
					await fs.unlink(lensFiles[j].path);
				}

				// create matching database records for imported files
				const insertData = Importer.exportFromAppSettings(settingsJson, lensIds);
				if (insertData) {
					await DB.insertLens(insertData['lenses']);
					await DB.insertUnlock(insertData['unlocks']);
				}
			}
		} else {
			error = 'array of files expected';
		}
	} catch (e) {
		console.error(e);
		error = 'server side error';
	}

	return res.json({
		error: error,
		import: lensIds
	});
});

export default router;