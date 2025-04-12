const chars = require("../character/main");
const fUtil = require("../misc/file");
const folder = process.env.ASSET_FOLDER;
const fs = require("fs");

module.exports = {
	load(aId) {
                const path = fUtil.getFileIndex("asset-", `.${aId.substr(aId.lastIndexOf(".") + 1)}`, aId.substr(0, aId.lastIndexOf(".")).split("-")[1]);
		return fs.readFileSync(path);
	},
        save(buffer, meta, uId) {
                meta.file = meta.id = `a-${fUtil.getNextFileId("asset-", `.${meta.ext}`)}.${meta.ext}`;
                meta.enc_asset_id = meta.id.substr(0, meta.id.lastIndexOf("."));
                const path = fUtil.getFileIndex("asset-", `.${meta.ext}`, meta.id.split("-")[1].split(".")[0]);
                fs.writeFileSync(path, buffer);
                let json;
                if (uId) json = JSON.parse(fs.readFileSync(`${folder}/${uId}.json`)); 
                else json = JSON.parse(fs.readFileSync(`${folder}/public.json`)); 
                json.assets.unshift(meta);
                if (uId) fs.writeFileSync(`${folder}/${uId}.json`, JSON.stringify(json, null, "\t"));
                else fs.writeFileSync(`${folder}/public.json`, JSON.stringify(json, null, "\t"));
                return meta.id;
        },
	list(uId, type, subtype, themeId, aId) {
                switch (themeId) {
                        case "custom": {
                                themeId = "family";
                                break;
                        } case "action": {
                                themeId = "cc2";
                                break;
                        }
                }
                if (uId != "public") {
                        const json = JSON.parse(fs.readFileSync(`${folder}/${uId}.json`));
                        let aList = json.assets.filter(i => i.type == type);
                        // more filters
                        if (subtype) aList = aList.filter(i => i.subtype == subtype);
                        if (themeId) aList = aList.filter(i => i.themeId == themeId);
                        if (aId) aList = aList.filter(i => i.id == aId);
                        return aList;
                } else {
                        const aList = [];
                        fs.readdirSync(folder).forEach(file => {
                                const json = JSON.parse(fs.readFileSync(`${folder}/${file}`));
                                if (type == "char") {
                                        for (const stuff in json.settings) {
                                                if (stuff == "chars" && json.settings[stuff] == "on") {
                                                        for (const meta of json.assets) {
                                                                if (meta.themeId == themeId && meta.subtype == subtype) aList.unshift(meta);
                                                        }
                                                }
                                        }
                                }
                        })
                       return aList;
                }
	},
        meta2Xml(v, headers) {
                let xmlString;
                switch (v.type) {
                        case "char": {
                                xmlString = `
                                <char id="${v.id}" name="Untitled" cc_theme_id="${v.themeId}" thumbnail_url="${headers ? `https://${headers.host}` : ''}/char_thumbs/${v.id}.png" copyable="Y">
                                        <tags></tags>
                                </char>`;
                                break;
                        } case "bg": {
                                xmlString = `<background subtype="0" id="${v.id}" name="${v.title}" enable="Y"/>`;
                                break;
                        } case "sound": {
                                xmlString = `<sound subtype="${v.subtype}" id="${v.id}" name="${v.title}" enable="Y" duration="${v.duration}" downloadtype="progressive"/>`;
                                break;
                        } case "movie": {
                                xmlString = `
                                <movie id="${v.id}" enc_asset_id="${v.id}" path="/_SAVED/${v.id}" numScene="1" title="${v.title}" thumbnail_url="${headers ? `https://${headers.host}` : ''}/ajax/movie/thumb/${v.id}.png">
                                        <tags>${v.tags}</tags>
                                </movie>`;
                                break;
                        } case "prop": {
                                xmlString = `<prop subtype="0" id="${v.id}" name="${v.title}" enable="Y" ${v.propType ? `${v.propType}="1"` : ''} placeable="1" facing="left" width="0" height="0" asset_url="${headers ? `https://${headers.host}` : ''}/assets/${v.id}"/>`;
                                break;
                        }
                }
                return xmlString;
        }
};