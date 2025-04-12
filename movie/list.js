const movie = require("./main");
const http = require("http");
const loadPost = require("../misc/post_body");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "GET") return; 
        switch (url.pathname) {
                case "/ajax/movies/list": {
                        Promise.all(movie.list().map(movie.meta)).then((a) => res.end(JSON.stringify(a)));
                        break;
                } case "/ajax/userMovies/list": {
                        loadPost(req, res).then(([data]) => {
                                const json = JSON.parse(fs.readFileSync(process.env.ASSET_FOLDER + `/${data.uid}.json`));
                                res.end(JSON.stringify(json.movies));
                        });
                        break;
                } default: return;
        }
	return true;
};