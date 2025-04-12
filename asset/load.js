const loadPost = require("../misc/post_body");
const asset = require("./main");
const http = require("http");
const fUtil = require("../misc/file");
const fs = require("fs");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	switch (req.method) {
		case "GET": {
			const match = req.url.match(/\/assets\/([^/]+)$/);
			if (!match) return;
			const aId = match[1];
			const b = asset.load(aId);
			try {
				res.statusCode = 200;
				res.end(b);
			} catch (e) {
				res.statusCode = 404;
				res.end('404 Not Found');
                                console.log(e);
			}
			return true;
		}

		case "POST": {
			switch (url.pathname) {
				case "/goapi/getAsset/":
				case "/goapi/getAssetEx/": {
					loadPost(req, res).then(([data]) => {
						const aId = data.assetId || data.enc_asset_id;
						const b = asset.load(aId);
						try {
							res.setHeader("Content-Length", b.length);
							res.setHeader("Content-Type", "audio/mp3");
							res.end(b);
						} catch (e) {
							res.statusCode = 404;
							res.end(1 + e);
                                                        console.log(e);
						}
					});
					return true;
				}
				default:
					return;
			}
		}
		default:
			return;
	}
};