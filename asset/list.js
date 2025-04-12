const loadPost = require("../misc/post_body");
const header = process.env.XML_HEADER;
const fUtil = require("../misc/file");
const nodezip = require("node-zip");
const base = Buffer.alloc(1, 0);
const asset = require("./main");
const http = require("http");

async function listAssets(data, makeZip, userFiles, headers) {
	var xmlString, files;
	switch (data.type) {
		case "char": {
                        if (data.assetId && data.assetId !== "null") files = asset.list(data.userId || "public", "char", 0, data.themeId, data.assetId);
                        else files = asset.list(data.userId || "public", "char", 0, data.themeId);
			xmlString = `${header}<ugc more="0">${
                                files.map(v => `<char id="${v.id}" name="${v.title}" cc_theme_id="${v.themeId}" thumbnail_url="https://${headers.host}/char_thumbs/${v.id}.png" copyable="N"><tags>${v.tags}</tags></char>`).join("")
                        }</ugc>`;
			break;
		} default: {
                        if (data.subtype != "video") {
                                files = asset.list(data.userId || "public", data.type);
                                xmlString = `${header}<ugc more="0">${files.map(v => asset.meta2Xml(v, headers)).join("")}</ugc>`;
                        } else {
                                files = [];
                                xmlString = `${header}<ugc more="0"></ugc>`;
                        }
                        break;
                }
	}

	if (makeZip) {
		const zip = nodezip.create();
		fUtil.addToZip(zip, "desc.xml", Buffer.from(xmlString));

		files.forEach((file) => {
			switch (file.type) {
                                case "movie": break;
                                default: {
					const buffer = asset.load(file.id);
					fUtil.addToZip(zip, `${file.type}/${file.id}`, buffer);
					break;
				}
			}
		});
		return await zip.zip();
	} else if (!userFiles) {
		return Buffer.from(xmlString);
	} else return JSON.stringify(files);
}

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	var makeZip = false;
        var userFiles = false;
	switch (url.pathname) {
		case "/goapi/getUserAssets/":
			makeZip = true;
			break;
                case "/ajax/getUserFiles/":
			userFiles = true;
			break;
		case "/goapi/getUserAssetsXml/":
			break;
		default:
			return;
	}

	switch (req.method) {
		case "GET": {
			var q = url.query;
			if (q.userId && q.type) {
				listAssets(q, makeZip, userFiles, req.headers).then((buff) => {
					const type = makeZip ? "application/zip" : "text/xml";
					res.setHeader("Content-Type", type);
					res.end(buff);
				});
				return true;
			} else return;
		}
		case "POST": {
			loadPost(req, res).then(([data]) => listAssets(data, makeZip, userFiles, req.headers)).then((buff) => {
                                const type = makeZip ? "application/zip" : "text/xml";
				res.setHeader("Content-Type", type);
				if (makeZip) res.write(base);
				res.end(buff);
			});
			return true;
		}
		default:
			return;
	}
};