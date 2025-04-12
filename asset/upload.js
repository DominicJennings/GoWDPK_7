// Asset Importer
const formidable = require("formidable");
const asset = require("./main");
const http = require("http");
const fs = require("fs");
const fUtil = require("../misc/file");
const mp3Duration = require("mp3-duration");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "POST") return;
	switch (url.pathname) {
                case "/ajax/uploadAsset": { 
                        new formidable.IncomingForm().parse(req, async (e, f, files) => {
                                try {
                                        const meta = {
                                                title: f.name,
                                                type: f.type,
                                                subtype: f.subtype,
                                                ext: f.name.substr(f.name.lastIndexOf(".") + 1),
                                                share: {
                                                        type: "none"
                                                },
                                                published: 0,
                                                tags: ""
                                        };
                                        const buffer = fs.readFileSync(files.import.filepath);
                                        switch (meta.type) {
                                                case "prop": {
                                                        if (f.ptype != "placeable") meta.propType = f.ptype;
                                                        break;
                                                } case "sound": {
                                                        await new Promise(resolve => {
                                                                meta.downloadtype = "progressive";
                                                                mp3Duration(buffer, (e, d) => {
                                                                        meta.duration = d * 1e3;
                                                                        if (e || !meta.duration) return res.end(JSON.stringify({status: "error", msg: e || "Unable to retrieve file duration."}));
                                                                        resolve();
                                                                });
                                                        });
                                                        break;
                                                }
                                        }
                                        asset.save(buffer, meta, f.userId);
                                        if (meta.type == "prop") meta.ptype = "placeable";
                                        res.end(JSON.stringify({status: "ok", data: meta}));
                                } catch (e) {
                                        console.log(e);
                                        res.end(JSON.stringify({status: "error", msg: e}));
                                }
                        });
                        break;
                } case "/ajax/saveAsset": {
                        formidable().parse(req, async (_, fields, files) => {
                                const [mId, mode, ext] = fields.params.split(".");
                                var type, subtype;
				switch (mode) {
					case "vo": {
                                                subtype = "voiceover";
                                                type = "sound";
						break;
                                        } case "se": {
                                                subtype = "soundeffect";
                                                type = "sound";
						break;
                                        } case "mu": {
                                                subtype = "bgmusic";
                                                type = "sound";
						break;
                                        } default: {
                                                subtype = 0;
                                                type = mode;
                                        }
				};
                                const {originalFilename: name, filepath} = files.import;
                                const meta = {
                                        title: name,
                                        type,
                                        subtype,
                                        ext,
                                        share: {
                                                type: "none"
                                        },
                                        published: 0,
                                        tags: ""
                                };
                                switch (meta.type) {
                                        case "sound": {
                                                await new Promise(resolve => {
                                                        meta.downloadtype = "progressive";
                                                        mp3Duration(buffer, (e, d) => {
                                                                meta.duration = d * 1e3;
                                                                resolve();
                                                        });
                                                });
                                                break;
                                        }
                                };
                                asset.save(fs.readFileSync(filepath), meta);
                                res.end();
                        });
                        break;
                }
        }
        return true;
};
