const fs = require("fs");
const loadPost = require("../misc/post_body");
const folder = process.env.ASSET_FOLDER;

module.exports = function(req, res, url) {
        switch (req.method) {
                case "POST": {
                        switch (url.pathname) {
                                case "/ajax/lvmSettings/list": {
                                        loadPost(req, res).then(([data]) => {
                                                if (!fs.existsSync(`${folder}/${data.uid}.json`)) 
                                                        fs.writeFileSync(`${folder}/${data.uid}.json`, JSON.stringify({
                                                                assets: [],
                                                                movies: [],
                                                                settings: {
                                                                        wixwatermark: "off",
                                                                        chars: "off",
                                                                        darkmode: "on",
                                                                        oneyearbacklvm: "off"
                                                                }
                                                        }, null, "\t"));
                                                const json = JSON.parse(fs.readFileSync(`${folder}/${data.uid}.json`));
                                                res.end(JSON.stringify(json.settings));
                                        });
                                        break;
                                } case "/ajax/lvmSettings/update": {
                                        loadPost(req, res).then(([data]) => {
                                                const json = JSON.parse(fs.readFileSync(`${folder}/${data.uid}.json`));
                                                for (const stuff in data) {
                                                        switch (stuff) {
                                                                case "darkmode":
                                                                case "wixwatermark":
                                                                case "oneyearbacklvm":
                                                                case "chars": {
                                                                        json.settings[stuff] = data[stuff];
                                                                        break;
                                                                }
                                                        }
                                                }
                                                fs.writeFileSync(`${folder}/${data.uid}.json`, JSON.stringify(json, null, "\t"));
                                                res.statusCode = 302;
                                                res.setHeader("Location", data.pathname);
                                                res.end();
                                        });
                                        break;
                                } default: return;
                        }
                } default: return;
        }
        return true;
}