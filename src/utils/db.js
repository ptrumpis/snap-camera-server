import mysql from "mysql2";
import * as dotenv from 'dotenv';
import * as Util from './helper.js';

dotenv.config()

const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME
});

function searchLensByName(term) {
	const wildcardSearch = '%' + term + '%';
	return new Promise(resolve => {
		connection.query(`SELECT * FROM lenses WHERE lens_name LIKE ? OR user_display_name LIKE ? LIMIT 250;`, [
			wildcardSearch,
			wildcardSearch
		], async function (err, results) {
			if (results && results[0]) {
				resolve(results);
			} else {
				if (err) {
					console.error(err, wildcardSearch);
				}
				resolve([]);
			}
		});
	});
}

function searchLensById(lensId) {
	return new Promise(resolve => {
		connection.query(`SELECT * FROM lenses WHERE unlockable_id=? LIMIT 1;`, [
			lensId
		], async function (err, results) {
			if (results && results[0]) {
				resolve(results);
			} else {
				if (err) {
					console.error(err, lensId);
				}
				resolve([]);
			}
		});
	});
}

function searchLensByUuid(uuid) {
	return new Promise(resolve => {
		connection.query(`SELECT * FROM lenses WHERE uuid=? LIMIT 1;`, [
			uuid
		], async function (err, results) {
			if (results && results[0]) {
				resolve(results);
			} else {
				if (err) {
					console.error(err, uuid);
				}
				resolve([]);
			}
		});
	});
}

function getMultipleLenses(lenses) {
	return new Promise(resolve => {
		connection.query(`SELECT * FROM lenses WHERE unlockable_id IN (?);`, [
			lenses
		], async function (err, results) {
			if (results && results[0]) {
				resolve(results);
			} else {
				if (err) {
					console.error(err, lenses);
				}
				resolve([]);
			}
		})
	});
}

function getSingleLens(lensID) {
	return new Promise(resolve => {
		connection.query(`SELECT * FROM lenses WHERE unlockable_id=? LIMIT 1;`, [
			lensID
		], async function (err, results) {
			if (results && results[0]) {
				resolve(results);
			} else {
				if (err) {
					console.error(err, lensID);
				}
				resolve([]);
			}
		});
	});
}

function getLensUnlock(lensID) {
	return new Promise(resolve => {
		connection.query(`SELECT * FROM unlocks WHERE lens_id=? LIMIT 1;`, [
			lensID
		], async function (err, results) {
			if (results && results[0]) {
				resolve(results);
			} else {
				if (err) {
					console.error(err, lensID);
				}
				resolve([]);
			}
		});
	});
}

async function insertLens(lenses, forceMirror = false) {
	if (!Array.isArray(lenses)) {
		console.error("Invalid argument, expected array");
		return;
	}

	lenses.forEach(function (lens, index) {
		let { unlockable_id, snapcode_url, user_display_name, lens_name, lens_status, deeplink, icon_url, thumbnail_media_url,
			thumbnail_media_poster_url, standard_media_url, standard_media_poster_url, obfuscated_user_slug, image_sequence } = lens;

		if (!lens_status) lens_status = "Live";
		if (!snapcode_url) snapcode_url = "";
		if (!deeplink) deeplink = "";
		if (!icon_url) icon_url = "";
		if (!thumbnail_media_url) thumbnail_media_url = "";
		if (!thumbnail_media_poster_url) thumbnail_media_poster_url = "";
		if (!standard_media_url) standard_media_url = "";
		if (!standard_media_poster_url) standard_media_poster_url = "";
		if (!obfuscated_user_slug) obfuscated_user_slug = "";
		if (!image_sequence) image_sequence = {};

		// uuid is not part of the original data structure
		let uuid = Util.extractUuidFromDeeplink(deeplink);

		// will trigger insertUnlock if unlock data is present on relay but not locally
		Util.getUnlockUrl(unlockable_id, forceMirror);

		return new Promise(resolve => {
			// rebuild the passed object manually
			// so we know exactly what will be inserted
			let args = {
				unlockable_id: unlockable_id,
				uuid: uuid,
				snapcode_url: snapcode_url,
				user_display_name: user_display_name,
				lens_name: lens_name,
				lens_status: lens_status,
				deeplink: deeplink,
				icon_url: icon_url,
				thumbnail_media_url: thumbnail_media_url,
				thumbnail_media_poster_url: thumbnail_media_poster_url,
				standard_media_url: standard_media_url,
				standard_media_poster_url: standard_media_poster_url,
				obfuscated_user_slug: obfuscated_user_slug,
				image_sequence: JSON.stringify(image_sequence)
			};

			try {
				connection.query(`INSERT INTO lenses SET ?`, args, async function (err, results) {
					if (!err) {
						await Util.mirrorLens(args);
						console.log("Saved Lens:", unlockable_id);
					} else if (err.code !== "ER_DUP_ENTRY") {
						console.log(err, unlockable_id, lens_name);
					} else if (forceMirror) {
						await Util.mirrorLens(lens);
					}
				});
			} catch (e) {
				console.log(e);
			}
		});
	});
}

async function insertUnlock(lens, forceMirror = false) {
	let { lens_id, lens_url, signature, hint_id, additional_hint_ids } = lens;

	if (!additional_hint_ids) additional_hint_ids = {};
	if (!hint_id) hint_id = "";
	if (!signature) signature = "";

	return new Promise(resolve => {
		// rebuild the passed object manually
		// so we know exactly what will be inserted
		let args = {
			lens_id: lens_id,
			lens_url: lens_url,
			signature: signature,
			hint_id: hint_id,
			additional_hint_ids: JSON.stringify(additional_hint_ids)
		};

		try {
			connection.query(`INSERT INTO unlocks SET ?`, args, async function (err, results) {
				if (!err) {
					await Util.mirrorUnlock(lens_id, lens_url);
					console.log('Unlocked Lens:', lens_id);
				} else if (err.code !== "ER_DUP_ENTRY") {
					console.log(err, lens_id);
				} else if (forceMirror) {
					await Util.mirrorLens(lens);
				}
			});
		} catch (e) {
			console.log(e);
		}
	});
}

function markLensAsMirrored(id) {
	connection.query(`UPDATE lenses SET mirrored=1 WHERE unlockable_id=?`, [id]);
}

function markUnlockAsMirrored(id) {
	connection.query(`UPDATE unlocks SET mirrored=1 WHERE lens_id=?`, [id]);
}

export { searchLensByName, searchLensById, searchLensByUuid, getMultipleLenses, getSingleLens, getLensUnlock, insertLens, insertUnlock, markLensAsMirrored, markUnlockAsMirrored };