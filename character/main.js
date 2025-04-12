const cachéFolder = process.env.CACHÉ_FOLDER;
const xNumWidth = process.env.XML_NUM_WIDTH;
const baseUrl = process.env.CHAR_BASE_URL;
const fUtil = require("../misc/file");
const util = require("../misc/util");
const get = require("../misc/get");
const fw = process.env.FILE_WIDTH;
const fs = require("fs");
const themes = {};

function addTheme(id, buffer) {
	const beg = buffer.indexOf(`theme_id="`) + 10;
	const end = buffer.indexOf(`"`, beg);
	const theme = buffer.slice(beg, end).toString().trim();
	return (themes[id] = theme);
}

function save(id, data) {
	const i = id.indexOf("-");
	const prefix = id.substr(0, i);
	const suffix = id.substr(i + 1);
	switch (prefix) {
		case "c":
			fs.writeFileSync(fUtil.getFileIndex("char-", ".xml", suffix), data);
			break;
		case "C":
	}
	addTheme(id, data);
	return id;
}

fUtil.getValidFileIndicies("char-", ".xml").map((n) => {
	return addTheme(`c-${n}`, fs.readFileSync(fUtil.getFileIndex("char-", ".xml", n)));
});

/**
 * @param {string} id
 * @returns {string}
 */
function getCharPath(id) {
	var i = id.indexOf("-");
	var prefix = id.substr(0, i);
	var suffix = id.substr(i + 1);
	switch (prefix) {
		case "c": return fUtil.getFileIndex("char-", ".xml", suffix);
	}
}
/**
 * @param {string} id
 * @returns {string}
 */
function getThumbPath(id) {
	var i = id.indexOf("-");
	var prefix = id.substr(0, i);
	var suffix = id.substr(i + 1);
	switch (prefix) {
		case "c": return fUtil.getFileIndex("char-", ".png", suffix);
        }
}

module.exports = {
	/**
	 * @param {string} id
	 * @returns {Promise<string>}
	 */
	getTheme(id) {
		return new Promise(async (res, rej) => {
                        if (themes[id]) res(themes[id]);
                        else {
                                const b = await this.load(id);
                                res(addTheme(id, b));
                        }
		});
	},
	/**
	 * @param {string} id
	 * @returns {Promise<Buffer>}
	 */
	load(id) {
		return new Promise((res, rej) => {
                        try {
                                var i = id.indexOf("-");
                                var prefix = id.substr(0, i);
                                var suffix = id.substr(i + 1);
                                switch (prefix) {
                                        case "c":
                                                res(fs.readFileSync(getCharPath(id)));
                                                break;
                                        case "":
                                        default: {
                                                // Blank prefix is left here for backwards-compatibility purposes.
                                                var nId = Number.parseInt(suffix);
                                                var xmlSubId = nId % fw;
                                                var fileId = nId - xmlSubId;
                                                var lnNum = fUtil.padZero(xmlSubId, xNumWidth);
                                                var url = `${baseUrl}/${fUtil.padZero(fileId)}.txt`;

                                                get(url).then((b) => {
                                                        var line = b.toString("utf8").split("\n").find((v) => v.substr(0, xNumWidth) == lnNum);
							if (line) res(Buffer.from(line.substr(xNumWidth)));
							else rej("Character Not Found")
						})
                                        }
				}
			} catch (e) {
                                rej(e);
                        }
		});
	},
	/**
	 * @param {Buffer} data
	 * @param {string} id
	 * @returns {Promise<string>}
	 */
	save(data) {
		return new Promise((res, rej) => {
                        try {
                                if (!fs.existsSync(process.env.ASSET_FOLDER + `/${data.userId ? data.userId : "public"}.json`)) 
                                        fs.writeFileSync(process.env.ASSET_FOLDER + `/${data.userId ? data.userId : "public"}.json`, JSON.stringify({
                                                assets: [
                                                        {
                                                                id: data.charId || `c-${fUtil.getNextFileId("char-", ".xml")}`,
                                                                enc_asset_id: data.charId || `c-${fUtil.getNextFileId("char-", ".xml")}`,
                                                                type: "char",
                                                                themeId: data.themeId,
                                                                title: "Untitled",
                                                                tags: "",
                                                                subtype: 0,
                                                                share: {
                                                                        type: "none"
                                                                }
                                                        }
                                                ],
                                                movies: [],
                                                settings: {
                                                        assets: "off",
                                                        chars: "off",
                                                        darkmode: "on"
                                                }
                                        }, null, "\t"));
                                else {
                                        const json = JSON.parse(fs.readFileSync(process.env.ASSET_FOLDER + `/${data.userId ? data.userId : "public"}.json`));
                                        json.assets.unshift({
                                                id: data.charId || `c-${fUtil.getNextFileId("char-", ".xml")}`,
                                                enc_asset_id: data.charId || `c-${fUtil.getNextFileId("char-", ".xml")}`,
                                                type: "char",
                                                themeId: data.themeId,
                                                title: "Untitled",
                                                tags: "",
                                                subtype: 0,
                                                share: {
                                                        type: "none"
                                                }
                                        });
                                        fs.writeFileSync(process.env.ASSET_FOLDER + `/${data.userId ? data.userId : "public"}.json`, JSON.stringify(json, null, "\t"));
                                }
                                if (data.charId) {
                                        const i = data.charId.indexOf("-");
                                        const prefix = data.charId.substr(0, i);
                                        switch (prefix) {
                                                case "c": {
                                                        fs.writeFileSync(getCharPath(data.charId), data.body);
                                                        res(data.charId);
                                                        break;
                                                } default: {
                                                        res(save(data.charId, data.body));
                                                        break;
                                                }
                                        }
				} else {
                                        const saveId = `c-${fUtil.getNextFileId("char-", ".xml")}`;
                                        res(save(saveId, data.body));
                                }
			} catch (e) {
                                console.log(e);
                        }
		});
	},
	/**
	 * @param {Buffer} data
	 * @param {string} id
	 * @returns {Promise<string>}
	 */
	saveThumb(thumb, id) {
		return new Promise((res, rej) => {
                        try {
                                fs.writeFileSync(getThumbPath(id), thumb);
                                res(id);
                        } catch (e) {
                                rej(e);
                        }
		});
	},
	/**
	 * @param {string} id
	 * @returns {Promise<Buffer>}
	 */
	loadThumb(id) {
		return new Promise((res, rej) => {
			try {
                                res(fs.readFileSync(getThumbPath(id)));
                        } catch (e) {
                                rej(e);
                        }
		});
	},
};