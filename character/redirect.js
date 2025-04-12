const http = require("http");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "GET" || !url.pathname.startsWith("/go/character_creator")) return;
	var match = /\/go\/character_creator\/(\w+)(\/\w+)?(\/.+)?$/.exec(url.pathname);
	if (!match) return;
	[, theme, mode, id] = match;

	var redirect;
	switch (mode) {
		case "/copy": {
                        if (!req.headers.referer.includes("/go_full")) redirect = `/cc?${req.headers.referer.split("?")[1]}&original_asset_id=${id.substr(1)}`;
                        else redirect = `/cc?themeId=${theme}&original_asset_id=${id.substr(1)}`;
			break;
		}
		default: {
			var type = url.query.type;
                        if (!req.headers.referer.includes("/go_full")) {
                                if (type) redirect = `/cc?${req.headers.referer.split("?")[1]}&bs=${type}`;
                                else redirect = `/cc_browser?${req.headers.referer.split("?")[1]}`;
                        } else redirect = `/html/list_guest.html`;
			break;
		}
	}
	res.setHeader("Location", redirect);
	res.statusCode = 302;
	res.end();
	return true;
};
