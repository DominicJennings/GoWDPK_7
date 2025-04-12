const env = Object.assign(process.env, require("./env"), require("./config"));
const fs = require('fs');
const asset = require('./asset/main');
const http = require("http");
const chr = require("./character/redirect");
const stg = require("./asset/settings");
const pmc = require("./character/premade");
const pre = require("./movie/preview");
const chl = require("./character/load");
const chs = require("./character/save");
const cht = require("./character/thmb");
const mvu = require("./movie/upload");
const stp = require("./static/page");
const stc = require("./static/index");
const str = require("./starter/save");
const qkv = require("./movie/redirect");
const asu = require("./asset/upload");
const dbs = require("./asset/database");
const stl = require("./static/load");
const asl = require("./asset/load");
const asL = require("./asset/list");
const ast = require("./asset/thmb");
const mvl = require("./movie/load");
const mvL = require("./movie/list");
const mvm = require("./movie/meta");
const mvs = require("./movie/save");
const mvt = require("./movie/thmb");
const thL = require("./theme/list");
const thl = require("./theme/load");
const tsv = require("./tts/voices");
const tsl = require("./tts/load");
const url = require("url");

const functions = [mvL, pre, stg, stc, str, stp, dbs, qkv, pmc, asl, chl, thl, thL, chs, cht, asL, tsl, chr, ast, mvm, mvl, mvs, mvt, tsv, asu, mvu, stl];

module.exports = () => {
        http.createServer((req, res) => {
                const parsedUrl = url.parse(req.url, true);
                try {
                        functions.find((f) => f(req, res, parsedUrl));
                        console.log(req.method, parsedUrl.path, '-', res.statusCode);
                } catch (x) {
                        res.statusCode = 500;
                        console.log(x);
                        console.log(req.method, parsedUrl.path, '-', res.statusCode);
                        res.end('500 Server Error');
                }
        }).listen(env.PORT || env.SERVER_PORT, console.log("GoWDPK Has Started Sucessfully"));
}
