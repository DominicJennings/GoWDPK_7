const movie = require("./main");
const base = Buffer.alloc(1, 0);
const loadPost = require("../misc/post_body");
/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
        switch (req.method) {
		case "GET": {
			const match = req.url.match(/\/movies\/([^.]+)(?:\.(zip|xml))?$/);
			if (!match) return;

			var id = match[1];
			var ext = match[2];
			switch (ext) {
				case "zip": {
                                        movie.loadZip(id).then(v => {
                                                res.setHeader("Content-Type", "application/zip");
                                                res.end(v);
                                        }).catch(e => console.log(e));
					break;
                                } case "xml": {
					movie.loadXml(id).then((v) => {
                                                res.setHeader("Content-Type", "text/xml");
						res.end(v);
					}).catch(e => console.log(e));
                                        break;
                                }
			}
			break;
		}

		case "POST": {
                        switch (url.pathname) {
                                case "/goapi/getMovieInfo/": {
                                        res.end("<?xml encoding=\"UTF-8\"?><watermarks><watermark style=\"visualplugin\"/></watermarks>");
                                        break;
                                }
                                case "/goapi/getMovie/": {
                                        loadPost(req, res).then(([data]) => movie.loadZip(url.query, data)).then(b => {
                                                res.setHeader("Content-Type", "application/zip");
                                                res.end(Buffer.concat([base, b]));
                                        }).catch(e => console.log(e));
                                        break;
                                } default: return;
                        }
                        break;
		} default: return;
	}
        return true;
};
