const loadPost = require("../misc/post_body");
const starter = require("../movie/main");
const http = require("http");
const folder = process.env.ASSET_FOLDER;
const fUtil = require("../misc/file");
const fs = require("fs");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "POST") return;
        switch (url.path) {
                case "/goapi/deleteAsset/":
                case "/goapi/DeleteUserTemplate/": // older api path for starters. but that one does the same thing as the newer one.
                case "/goapi/deleteUserTemplate/": {
                        loadPost(req, res).then(([data]) => {
                                const id = data.templateId || data.assetId;
                                const i = id.lastIndexOf("-");
                                const prefix = id.substr(0, i);
                                const suffix = id.substr(i + 1);
                                const json = JSON.parse(fs.readFileSync(`${folder}/${data.userId || "public"}.json`));
                                const index = json.assets.findIndex(i => i.id == id);
                                switch (prefix) {
                                        case "s": {
                                                const paths = [
                                                        fUtil.getFileIndex("starter-", ".xml", suffix),
                                                        fUtil.getFileIndex("starter-", ".png", suffix)
                                                ];
                                                for (const path of paths) fs.unlinkSync(path);
                                                break;
                                        } case "a": {
                                                const met = json.assets.find(i => i.id == id)
                                                const path = fUtil.getFileIndex("asset-", `.${met.ext}`, suffix.split(".")[0]);
                                                fs.unlinkSync(path);
                                                break;
                                        }
                                }
                                json.assets.splice(index, 1);
                                fs.writeFileSync(`${folder}/${data.userId || "public"}.json`, JSON.stringify(json, null, "\t"));
                        });
                        break;
                } case "/goapi/saveTemplate/": {
                        loadPost(req, res).then(([data]) => starter.save(data, true)).then((nId) => res.end("0" + nId)).catch(e => res.end("1" + e));
                        break;
                }
                default: return;
        }
	return true;
};
