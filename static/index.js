const fs = require("fs");
const get = require("../misc/get");

module.exports = function(req, res, url) {
        if (req.method != "GET" || !url.pathname.startsWith("/static")) return;
        if (url.pathname.includes("store")) {
                const path = url.pathname.split("/store/")[1];
                get(process.env.STORE_URL + '/' + path).then(buff => res.end(buff));
        } else res.end(fs.readFileSync(`.${url.pathname}`));
        return true;
}