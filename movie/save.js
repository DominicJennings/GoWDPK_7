const loadPost = require("../misc/post_body");
const movie = require("./main");
const http = require("http");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "POST" || url.path != "/goapi/saveMovie/") return;
	loadPost(req, res).then(([data]) => movie.save(data)).then((nId) => res.end("0" + nId)).catch(e => {
                console.log(e);
                res.end("1" + `<error><code>ERR_ASSET_404</code><message>${e}</message><text></text></error>`)
        });
	return true;
};