const http = require("http");
const fUtil = require("../misc/file");
const folder = process.env.THEME_FOLDER;
const fs = require('fs');
const loadPost = require("../misc/post_body");
/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
        switch (req.method) {
                case "POST": {
                        switch (url.path) {
                                case "/goapi/getThemeList/": {
                                        loadPost(req, res).then(async ([data]) => {
                                                try {
                                                        res.setHeader("Content-Type", "application/zip");
                                                        res.end(await fUtil.makeZip(`${folder}/${data.themelistType || ""}_themelist.xml`, "themelist.xml"));
                                                } catch (e) {
                                                        console.log(e);
                                                }
                                        });
                                        return true;
                                } default: return;
                        }
                }
        }
};
