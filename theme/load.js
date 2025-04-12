const loadPost = require("../misc/post_body");
const folder = process.env.THEME_FOLDER;
const fUtil = require("../misc/file");
const http = require("http");
const nodezip = require("node-zip");
const get = require("../misc/get");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
        if (req.method != "POST" || url.path != "/goapi/getTheme/") return;
        loadPost(req, res).then(async ([data]) => {
                try {
                        var theme;
                        switch (data.themeId) {
                                case "family": {
                                        theme = "custom";
                                        break;
                                } default: {
                                        theme = data.themeId;
                                        break;
                                }
                        }
                        if (data.themelistType != "2015") {
                                res.setHeader("Content-Type", "application/zip");
                                res.end(await fUtil.makeZip(`${folder}/${theme}.xml`, "theme.xml"));
                        } else {
                                try {
                                        res.setHeader("Content-Type", "application/zip");
                                        res.end(await fUtil.makeZip(`${folder}/${theme}.xml`, "theme.xml"));
                                } catch (e) {
                                        const zip = nodezip.create();
                                        fUtil.addToZip(zip, 'theme.xml', await get(`https://ourmetallicdisplaymanager.joseph-animate.repl.co/static/store/${theme}/theme.xml`));
                                        res.setHeader("Content-Type", "application/zip");
                                        res.end(await zip.zip());
                                }
                        }
                } catch (e) {
                        console.log(e);
                }
        });
	return true;
};
