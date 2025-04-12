const movie = require("./main");
const http = require("http");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	var path = url.pathname;
	if (req.method != "GET" || !path.startsWith("/ajax/movie/thumb")) return;
	var beg = path.lastIndexOf("/") + 1;
	var end = path.lastIndexOf(".");
	var ext = path.substr(end + 1).toLowerCase();
	if (ext != "png") return;

	movie.loadThumb(path.substr(beg, end - beg), url.query.large).then((v) => {
                res.setHeader("Content-Type", "image/png");
		res.end(v);
	}).catch(e => console.log(e));
	return true;
};
