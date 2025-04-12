const fUtil = require("../misc/file");
const stuff = require("./info");
const http = require("http");

function toAttrString(table) {
	return typeof table == "object"
		? Object.keys(table)
				.filter((key) => table[key] !== null)
				.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(table[key])}`)
				.join("&")
		: table.replace(/"/g, '\\"');
}
function toParamString(table) {
	return Object.keys(table)
		.map((key) => `<param name="${key}" value="${toAttrString(table[key])}">`)
		.join(" ");
}
function toObjectString(attrs, params) {
	return `<object id="obj" ${Object.keys(attrs)
		.map((key) => `${key}="${attrs[key].replace(/"/g, '\\"')}"`)
		.join(" ")}>${toParamString(params)}</object>`;
}

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "GET") return;
	const query = url.query;

	var attrs, params, title;
	switch (url.pathname) {
		case "/go_full": {
			let presave = query.movieId && query.movieId.startsWith("m") ? query.movieId : `m-${fUtil.getNextFileId("movie-", ".xml")}`;
			title = "Video Editor";
			attrs = {
				data: process.env.SWF_URL + "/go_full.swf",
				type: "application/x-shockwave-flash",
				width: "100%",
				height: "100%",
			};
			params = {
				flashvars: {
					apiserver: "/",
					storePath: process.env.STORE_URL + "/<store>",
					isEmbed: 1,
					ctc: "go",
					ut: 10,
					bs: "default",
					appCode: "go",
					page: "",
					siteId: "go",
					lid: 13,
					isLogin: "Y",
					retut: 1,
					clientThemePath: process.env.CLIENT_URL + "/<client_theme>",
					themeId: "business",
					tlang: "en_US",
					presaveId: presave,
					goteam_draft_only: 1,
					isWide: 0,
					collab: 0,
					nextUrl: "/go/movie/<movieId>",
                                        isWixPaid: 1
				},
				allowScriptAccess: "always",
			};
			break;
		} case "/cc": {
                        attrs = {
                                data: "/static/animation/cc.swf",
                                type: "application/x-shockwave-flash",
                                width: "100%",
                                height: "100%"
                        };
                        params = {
                                flashvars: {},
                                align: "middle",
                                allowScriptAccess: "always",
                                allowFullScreen: "true",
                                wmode: "transparent",
                                movie: "/static/animation/cc.swf"
                        }
                        break;
                } case "/cc_browser": {
                        attrs = {
                                data: "/static/animation/cc_browser.swf",
                                type: "application/x-shockwave-flash",
                                width: "100%",
                                height: "100%"
                        };
                        params = {
                                flashvars: {},
                                align: "middle",
                                allowScriptAccess: "always",
                                allowFullScreen: "true",
                                wmode: "transparent",
                                movie: "/static/animation/cc_browser.swf"
                        }
                        break;
                }

		default:
			return;
	}
	res.setHeader("Content-Type", "text/html; charset=UTF-8");
	Object.assign(params.flashvars, query);
	res.end(
		`<script>document.title='${title}',flashvars=${JSON.stringify(
			params.flashvars
		)}</script><body style="margin:0px">${toObjectString(attrs, params)}</body>${stuff.pages[url.pathname] || ""}`
	);
	return true;
};