import mysql from "mysql2";
import * as dotenv from 'dotenv';
import * as Util from './helper.js';

dotenv.config();

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

function searchLensByTags(hashtags) {
	const regSearch = hashtags.join('|');
	return new Promise(resolve => {
		connection.query(`SELECT * FROM lenses WHERE lens_tags REGEXP (?) LIMIT 250;`, [
			regSearch
		], async function (err, results) {
			if (results && results[0]) {
				resolve(results);
			} else {
				if (err) {
					console.error(err, regSearch);
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

function getDuplicatedLensIds(lensIds) {
	return new Promise(resolve => {
		connection.query(`SELECT unlockable_id as id FROM lenses WHERE unlockable_id IN (?);`, [
			lensIds
		], async function (err, results) {
			if (results && results[0]) {
				resolve(results.map(obj => { return parseInt(obj.id) }));
			} else {
				if (err) {
					console.error(err, lensIds);
				}
				resolve([]);
			}
		})
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

function getObfuscatedSlugByDisplayName(userDisplayName) {
	return new Promise(resolve => {
		connection.query(`SELECT obfuscated_user_slug as slug FROM users WHERE user_display_name=? LIMIT 1;`, [
			userDisplayName
		], async function (err, results) {
			if (results && results[0]) {
				resolve(results[0].slug);
			} else {
				if (err) {
					console.error(err, userDisplayName);
				}
				resolve([]);
			}
		});
	});
}

async function insertLens(lenses, forceMirror = false) {
	if (!Array.isArray(lenses)) {
		lenses = [lenses];
	}

	for (const lens of lenses) {
		// check required fields
		if (!lens || !lens.unlockable_id || !lens.lens_name || !lens.user_display_name) {
			console.error("Invalid argument, expected lens object", lens);
			return;
		}

		let { unlockable_id, uuid, snapcode_url, user_display_name, lens_name, lens_tags, lens_status, deeplink, icon_url, thumbnail_media_url,
			thumbnail_media_poster_url, standard_media_url, standard_media_poster_url, obfuscated_user_slug, image_sequence } = lens;

		if (!lens_tags) lens_tags = "";
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
		if (!uuid) {
			uuid = Util.extractUuidFromDeeplink(deeplink);
		}

		// will trigger insertUnlock if unlock data is present on relay but not locally
		Util.getUnlockUrl(unlockable_id, forceMirror);

		await new Promise(resolve => {
			// rebuild the passed object manually
			// so we know exactly what will be inserted
			let args = {
				unlockable_id: unlockable_id,
				uuid: uuid,
				snapcode_url: snapcode_url,
				user_display_name: user_display_name,
				lens_name: lens_name,
				lens_tags: lens_tags,
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
						if (obfuscated_user_slug) {
							insertUser(lens);
						}

						await Util.mirrorLens(lens);
						console.log("Saved Lens:", unlockable_id);
					} else if (err.code !== "ER_DUP_ENTRY") {
						console.log(err, unlockable_id, lens_name);
						return resolve(false);
					} else if (forceMirror) {
						await Util.mirrorLens(lens);
					}
					return resolve(true);
				});
			} catch (e) {
				console.error(e);
				resolve(false);
			}
		});
	}
}

async function insertUnlock(unlocks, forceMirror = false) {
	if (!Array.isArray(unlocks)) {
		unlocks = [unlocks];
	}

	for (const unlock of unlocks) {
		// check required fields
		if (!unlock || !unlock.lens_id || !unlock.lens_url) {
			console.error("Invalid argument, expected unlock object", unlock);
			return;
		}

		let { lens_id, lens_url, signature, hint_id, additional_hint_ids } = unlock;

		if (!signature) signature = "";
		if (!hint_id) hint_id = "";
		if (!additional_hint_ids) additional_hint_ids = {};

		await new Promise(resolve => {
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
						return resolve(false);
					} else if (forceMirror) {
						await Util.mirrorUnlock(lens_id, lens_url);
					}
					return resolve(true);
				});
			} catch (e) {
				console.error(e);
				resolve(false);
			}
		});
	}
}

async function insertUser(user) {
	if (!user || !user.obfuscated_user_slug || !user.user_display_name) {
		console.error("Invalid argument, expected user object", user);
		return;
	}

	let { obfuscated_user_slug, user_display_name } = user;

	await new Promise(resolve => {
		// rebuild the passed object manually
		// so we know exactly what will be inserted
		let args = {
			obfuscated_user_slug: obfuscated_user_slug,
			user_display_name: user_display_name,
		};

		try {
			connection.query(`INSERT INTO users SET ?`, args, async function (err, results) {
				if (!err) {
					console.log('New User:', user_display_name);
				} else if (err.code !== "ER_DUP_ENTRY") {
					console.log(err, user);
					return resolve(false);
				}
				return resolve(true);
			});
		} catch (e) {
			console.error(e);
			resolve(false);
		}
	});
}

function markLensAsMirrored(id) {
	try {
		connection.query(`UPDATE lenses SET mirrored=1 WHERE unlockable_id=?`, [id]);
	} catch (e) {
		console.log(e);
	}
}

function markUnlockAsMirrored(id) {
	try {
		connection.query(`UPDATE unlocks SET mirrored=1 WHERE lens_id=?`, [id]);
	} catch (e) {
		console.log(e);
	}
}

export { searchLensByName, searchLensByTags, searchLensById, searchLensByUuid, getDuplicatedLensIds, getMultipleLenses, getSingleLens, getLensUnlock, getObfuscatedSlugByDisplayName, insertLens, insertUnlock, insertUser, markLensAsMirrored, markUnlockAsMirrored };