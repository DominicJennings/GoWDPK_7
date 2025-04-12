const asset = require('../asset/main.js');
const char = require('../character/main');
const mp3Duration = require("mp3-duration");
const get = require('../misc/get');
const fUtil = require("../misc/file");
const nodezip = require("node-zip");
const jszip = require("jszip");
const xmldoc = require('xmldoc');
const fs = require('fs');
const { 
        THEME_FOLDER: themeFolder, 
        CLIENT_URL: source, 
        XML_HEADER: header, 
        STORE_URL: store,
        ASSET_FOLDER: folder
} = process.env;

function name2Font(font) {
	switch (font) {
		case "Blambot Casual": return "FontFileCasual";
		case "BadaBoom BB": return "FontFileBoom";
		case "Entrails BB": return "FontFileEntrails";
		case "Tokyo Robot Intl BB": return "FontFileTokyo";
		case "Accidental Presidency": return "FontFileAccidental";
		case "BodoniXT": return "FontFileBodoniXT";
		case "Budmo Jiggler": return "FontFileBJiggler";
		case "Budmo Jigglish": return "FontFileBJigglish";
		case "Existence Light": return "FontFileExistence";
		case "HeartlandRegular": return "FontFileHeartland";
		case "Honey Script": return "FontFileHoney";
		case "I hate Comic Sans": return "FontFileIHate";
		case "Impact Label": return "FontFileImpactLabel";
		case "loco tv": return "FontFileLocotv";
		case "Mail Ray Stuff": return "FontFileMailRay";
		case "Mia\'s Scribblings ~": return "FontFileMia";
		case "Shanghai": return "FontFileShanghai";
		case "Comic Book": return "FontFileComicBook";
		case "Wood Stamp": return "FontFileWoodStamp";
		case "Brawler": return "FontFileBrawler";
		case "Coming Soon": return "FontFileCSoon";
		case "Glegoo": return "FontFileGlegoo";
		case "Lilita One": return "FontFileLOne";
		case "Telex Regular": return "FontFileTelex";
		case "Claire Hand": return "FontFileClaireHand";
		case "Oswald": return "FontFileOswald";
		case "Poiret One": return "FontFilePoiretOne";
		case "Raleway": return "FontFileRaleway";
		case "Bangers": return "FontFileBangers";
		case "Creepster": return "FontFileCreepster";
		case "BlackoutMidnight": return "FontFileBlackoutMidnight";
		case "BlackoutSunrise": return "FontFileBlackoutSunrise";
		case "Junction": return "FontFileJunction";
		case "LeagueGothic": return "FontFileLeagueGothic";
		case "LeagueSpartan": return "FontFileLeagueSpartan";
		case "OstrichSansMedium": return "FontFileOstrichSansMedium";
		case "Prociono": return "FontFileProciono";
		case "Lato": return "FontFileLato";
		case "Alegreya Sans SC": return "FontFileAlegreyaSansSC";
		case "Barrio": return "FontFileBarrio";
		case "Bungee Inline": return "FontFileBungeeInline";
		case "Bungee Shade": return "FontFileBungeeShade";
		case "Gochi Hand": return "FontFileGochiHand";
		case "IM Fell English SC": return "FontFileIMFellEnglishSC";
		case "Josefin": return "FontFileJosefin";
		case "Kaushan": return "FontFileKaushan";
		case "Lobster": return "FontFileLobster";
		case "Montserrat": return "FontFileMontserrat";
		case "Mouse Memoirs": return "FontFileMouseMemoirs";
		case "Patrick Hand": return "FontFilePatrickHand";
		case "Permanent Marker": return "FontFilePermanentMarker";
		case "Satisfy": return "FontFileSatisfy";
		case "Sriracha": return "FontFileSriracha";
		case "Teko": return "FontFileTeko";
		case "Vidaloka": return "FontFileVidaloka";
		case '': return '';
		case null: return '';
		default: return `FontFile${font}`;
	}
}
function stream2Buffer(readStream) {
	return new Promise((res, rej) => {
		let buffers = [];
		readStream.on("data", (c) => buffers.push(c));
		readStream.on("end", () => res(Buffer.concat(buffers)));
	});
}
module.exports = {
	/**
	 * @summary Parses a movie using jszip
	 * @param {Buffer} xmlBuffer 
	 * @param {string} mId
	 * @returns {Promise<Buffer>}
	 */
	async packMovie(xmlBuffer, uId) {
                if (xmlBuffer.length == 0) throw null;
                const zip = nodezip.create();
                const themes = { common: true };
                var ugc = `${header}<theme id="ugc" name="ugc">`;
                fUtil.addToZip(zip, "movie.xml", xmlBuffer);
                // this is common in this file
                async function basicParse(file, type, subtype) {
                        const pieces = file.split(".");
                        const themeId = pieces[0];
                        // add the extension to the last key
                        const ext = pieces.pop();
                        pieces[pieces.length - 1] += "." + ext;
                        // add the type to the filename
                        pieces.splice(1, 0, type);
                        const filename = pieces.join(".");
                        if (themeId == "ugc") {
                                const id = pieces[2];
                                try {
                                        const buffer = asset.load(id);
                                        let json;
                                        if (uId) json = JSON.parse(fs.readFileSync(`${folder}/${uId}.json`));
                                        else json = JSON.parse(fs.readFileSync(`${folder}/public.json`));
                                        // add asset meta
                                        if (json.assets.find(i => i.id == id)) ugc += asset.meta2Xml(json.assets.find(i => i.id == id));
                                        // and add the file
                                        fUtil.addToZip(zip, filename, buffer);
                                } catch (e) {
                                        console.error(`WARNING: ${id}:`, e);
                                }
                        } else {
                                const filepath = `${store}/${pieces.join("/")}`;
                                // add the file to the zip
                                fUtil.addToZip(zip, filename, await get(filepath));
                        }
                        themes[themeId] = true;
                }
                // begin parsing the movie xml
                const film = new xmldoc.XmlDocument(xmlBuffer);
                for (const eI in film.children) {
                        const elem = film.children[eI];
                        switch (elem.name) {
                                case "sound": {
                                        const file = elem.childNamed("sfile")?.val;
                                        if (!file) continue;
                                        await basicParse(file, elem.name);
                                        break;
                                } case "scene": {
                                        for (const e2I in elem.children) {
                                                const elem2 = elem.children[e2I];
                                                let tag = elem2.name;
                                                // change the tag to the one in the store folder
                                                if (tag == "effectAsset") tag = "effect";
                                                switch (tag) {
                                                        case "durationSetting":
                                                        case "trans":
                                                                break;
                                                        case "bg":
                                                        case "effect":
                                                        case "prop": {
                                                                const file = elem2.childNamed("file")?.val;
                                                                if (!file) continue;
                                                                await basicParse(file, tag, elem2.attr.subtype);
                                                                break;
                                                        } case "char": {
                                                                let file = elem2.childNamed("action")?.val;
                                                                if (!file) continue;
                                                                const pieces = file.split(".");
                                                                const themeId = pieces[0];

                                                                const ext = pieces.pop();
                                                                pieces[pieces.length - 1] += "." + ext;
                                                                pieces.splice(1, 0, elem2.name);
	
                                                                if (themeId == "ugc") {
                                                                        // remove the action from the array
                                                                        pieces.splice(3, 1);
                                                                        const id = pieces[2];
                                                                        try {
                                                                                const buffer = await char.load(id);
                                                                                const filename = pieces.join(".");
                                                                                ugc += asset.meta2Xml({
                                                                                        // i can't just select the character data because of stock chars
                                                                                        id: id,
                                                                                        type: "char",
                                                                                        themeId: await char.getTheme(id)
                                                                                });
                                                                                fUtil.addToZip(zip, filename + ".xml", buffer);
                                                                        } catch (e) {
                                                                                console.error(`WARNING: ${id}:`, e);
                                                                        }
                                                                } else {
                                                                        const filepath = `${store}/${pieces.join("/")}`;
                                                                        const filename = pieces.join(".");
                                                                        fUtil.addToZip(zip, filename, await get(filepath));
                                                                }
                                                                for (const e3I in elem2.children) {
                                                                        const elem3 = elem2.children[e3I];
                                                                        if (!elem3.children) continue;
                                                                        // add props and head stuff
                                                                        file = elem3.childNamed("file")?.val;
                                                                        if (!file) continue;
                                                                        const pieces2 = file.split(".");
                                                                        // headgears and handhelds
                                                                        if (elem3.name != "head") await basicParse(file, "prop");
                                                                        else { // heads
                                                                                if (pieces2[0] == "ugc") continue;
                                                                                pieces2.pop(), pieces2.splice(1, 0, "char");
                                                                                const filepath = `${store}/${pieces2.join("/")}.swf`;
                                                                                pieces2.splice(1, 1, "prop");
                                                                                const filename = `${pieces2.join(".")}.swf`;
                                                                                fUtil.addToZip(zip, filename, await get(filepath));
                                                                        }
                                                                        themes[pieces2[0]] = true;
                                                                }
                                                                themes[themeId] = true;
                                                                break;
                                                        } case 'bubbleAsset': {
                                                                const bubble = elem2.childNamed("bubble");
                                                                const text = bubble.childNamed("text");
                                                                // arial doesn't need to be added
                                                                if (text.attr.font != "Arial") {
                                                                        const filename = `${name2Font(text.attr.font)}.swf`;
                                                                        const filepath = `${source}/go/font/${filename}`;
                                                                        fUtil.addToZip(zip, filename, await get(filepath));
                                                                }
                                                                break;
                                                        }
                                                }
                                        }
                                        break;
                                }
                        }
                }
                if (themes.family) {
                        delete themes.family;
                        themes.custom = true;
                }
                if (themes.cc2) {
                        delete themes.cc2;
                        themes.action = true;
                }
                const themeKs = Object.keys(themes);
                themeKs.forEach(t => {
                        if (t == 'ugc') return;
                        const file = fs.readFileSync(`${themeFolder}/${t}.xml`);
                        fUtil.addToZip(zip, `${t}.xml`, file);
                });
                fUtil.addToZip(zip, 'themelist.xml', Buffer.from(`${header}<themes>${themeKs.map(t => `<theme>${t}</theme>`).join('')}</themes>`));
                fUtil.addToZip(zip, 'ugc.xml', Buffer.from(ugc + `</theme>`));
                return await zip.zip();
	},
        /**
	 * Unpacks a movie zip containing mutiple files
	 * @param {Buffer} body 
	 * @returns {Promise<Buffer>}
	 */
        unpackZip(body) {
                return new Promise(async (res, rej) => {
                        try {
                                const zip = nodezip.unzip(body);
                                const readStream = zip["movie.xml"].toReadStream();
                                const buffer = await stream2Buffer(readStream);
                                res(buffer);
                        } catch (e) {
                                rej(e);
                        }
                });
	},
	/**
	 * 
	 * @param {Buffer} xml 
	 * @param {number} id 
	 */
	unpackXml(xml, id) {
                try {
                        const thumbBeg = xml.lastIndexOf('<thumb>');
                        const thumbEnd = xml.lastIndexOf('</thumb>');
                        const largeBeg = xml.lastIndexOf('<thumb>');
                        const largeEnd = xml.lastIndexOf('</thumb>');
                        if (thumbBeg > -1 && thumbEnd > -1) {
                                const sub = Buffer.from(xml.subarray(thumbBeg + 7, thumbEnd).toString(), 'base64');
                                fs.writeFileSync(fUtil.getFileIndex('thumb-', '.png', id), sub);
                        }
                        if (largeBeg > -1 && largeEnd > -1) {
                                const sub = Buffer.from(xml.subarray(largeBeg + 7, largeEnd).toString(), 'base64');
                                fs.writeFileSync(fUtil.getFileIndex('movie-', '.png', id), sub);
                        }
                        fs.writeFileSync(fUtil.getFileIndex('movie-', '.xml', id), xml);
                } catch (e) {
                        console.log(e);
                }
	},
	unpackCharXml(xml, id) {
		fs.writeFileSync(fUtil.getFileIndex('char-', '.xml', id), xml);
	},
}