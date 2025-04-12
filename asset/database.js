const fs = require("fs");
const loadPost = require("../misc/post_body");

module.exports = function(req, res, url) {
        switch (req.method) {
                case "POST": {
                        switch (url.pathname) {
                                case "/ajax/database/get": {
                                        loadPost(req, res).then(([data]) => {
                                                if (data.uid) {
                                                        if (!fs.existsSync(process.env.ASSET_FOLDER + `/${data.uid}.json`))
                                                                fs.writeFileSync(process.env.ASSET_FOLDER + `/${data.uid}.json`, JSON.stringify({
                                                                        assets: [],
                                                                        movies: [],
                                                                        settings: {
                                                                                darkmode: "on",
                                                                                chars: "off",
                                                                                assets: "off"
                                                                        }
                                                                }, null, "\t"));
                                                        res.end(JSON.stringify(JSON.parse(fs.readFileSync(process.env.ASSET_FOLDER + `/${data.uid}.json`))));
                                                } else res.end(JSON.stringify(JSON.parse(fs.readFileSync(process.env.ASSET_FOLDER + `/public.json`))));
                                        });
                                        break;
                                } default: return;
                        }
                        break;
                } default: return;
        }
        return true;
}