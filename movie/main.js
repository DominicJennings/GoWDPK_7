const fUtil = require("../misc/file");
const parse = require("./parse");
const fs = require("fs");

module.exports = {
	/**
	 *
	 * @param {Buffer} movieZip
	 * @param {string} nëwId
	 * @param {string} oldId
	 * @returns {Promise<string>}
	 */
	save(data, isStarter) {
                try {
                        let type, type2;
                        if (isStarter) {
                                type = "starter-";
                                type2 = "assets";
                                data.presaveId = data.movieId ? `s-${data.movieId}` : `s-${fUtil.getNextFileId("starter-", ".xml")}`;
                        } else {
                                type = "movie-";
                                type2 = "movies";
                        }
                        if (!data.presaveId && type == "movie-") data.presaveId = data.movieId || `m-${fUtil.getNextFileId("movie-", ".xml")}`
                        const buffers = [
                                Buffer.from(data.body_zip, "base64"),
                                Buffer.from(data.thumbnail, "base64"),
                                Buffer.from(data.thumbnail_large, "base64")
                        ];
                        parse.unpackZip(buffers[0]).then(async buffer => {
                                const suffix = data.presaveId.substr(data.presaveId.lastIndexOf("-") + 1);
                                const paths = [
                                        fUtil.getFileIndex(type, ".xml", suffix),
                                        fUtil.getFileIndex("thumb-", ".png", suffix),
                                        fUtil.getFileIndex(type, ".png", suffix)
                                ];
                                fs.writeFileSync(paths[0], buffer);
                                if (!isStarter) fs.writeFileSync(paths[1], buffers[1]);
                                fs.writeFileSync(paths[2], isStarter ? buffers[1] : buffers[2]);
                                const meta = await this.meta(data.presaveId);
                                const info = {
                                        movieOwnerId: data.userId ? data.userId : "",
                                        movieOwner: data.username ? data.username.replace("+", " ") : ""
                                };
                                for (const stuff in meta) info[stuff] = meta[stuff];
                                const json = JSON.parse(fs.readFileSync(process.env.ASSET_FOLDER + `/${data.userId ? data.userId : "public"}.json`));
                                const met = json[type2].find(i => i.id == data.presaveId);
                                if (!met) json[type2].unshift(info);
                                else for (const stuff in info) met[stuff] = info[stuff];
                                fs.writeFileSync(process.env.ASSET_FOLDER + `/${data.userId ? data.userId : "public"}.json`, JSON.stringify(json, null, "\t"));
                                if (info.public == "1") {
                                        const json2 = JSON.parse(fs.readFileSync(process.env.ASSET_FOLDER + `/public.json`));
                                        const met2 = json2[type2].find(i => i.id == data.presaveId);
                                        if (!data.userId) {
                                                info.public = "0";
                                                info.private = "0";
                                        }
                                        if (!met2) json2[type2].unshift(info);
                                        else for (const stuff in info) met2[stuff] = info[stuff];
                                        fs.writeFileSync(process.env.ASSET_FOLDER + `/public.json`, JSON.stringify(json2, null, "\t"))
                                }
                                return data.presaveId;
                        }).catch(e => console.log(e));
                } catch (e) {
                        console.log(e);
                }
	},
	loadZip(query, data) {
                try {
                        const mId = query.movieId;
                        let uId = data.movieOwnerId;
                        if (!uId) {
                                if (query.userId !== "null") uId = query.userId;
                                else uId = "public";
                        }
                        const i = mId.indexOf("-");
                        const prefix = mId.substr(0, i);
                        const suffix = mId.substr(i + 1);
                        switch (prefix) {
                                case "s":
                                case "m": {
                                        let numId = Number.parseInt(suffix);
                                        let filePath;
                                        switch (prefix) {
                                                case "s": {
                                                        filePath = fUtil.getFileIndex("starter-", ".xml", numId);
                                                        break;
                                                } case "m": {
                                                        filePath = fUtil.getFileIndex("movie-", ".xml", numId);
                                                        break;
                                                }
                                        }
                                        async function pack() {
                                                return await parse.packMovie(fs.readFileSync(filePath), uId);
                                        }
                                        return pack();
                                }
                        }
                } catch (e) {
                        console.log(e);
                }
        },
	loadXml(movieId) {
		return new Promise(async (res, rej) => {
                        try {
                                const i = movieId.indexOf("-");
                                const prefix = movieId.substr(0, i);
                                const suffix = movieId.substr(i + 1);
                                switch (prefix) {
                                        case "m": {
                                                const fn = fUtil.getFileIndex("movie-", ".xml", suffix);
                                                res(fs.readFileSync(fn));
                                                break;
                                        } case "s": {
                                                const fn = fUtil.getFileIndex("starter-", ".xml", suffix);
                                                res(fs.readFileSync(fn));
                                                break;
                                        }
                                }
                        } catch (e) {
                                rej(e);
                        }
		});
	},
	loadThumb(movieId, isLarge = false) {
		return new Promise(async (res, rej) => {
                        try {
                                const i = movieId.indexOf("-");
                                const prefix = movieId.substr(0, i);
                                const suffix = movieId.substr(i + 1);
                                switch (prefix) {
                                        case "m": {
                                                let fn;
                                                if (!isLarge) fn = fUtil.getFileIndex("thumb-", ".png", suffix);
                                                else fn = fUtil.getFileIndex("movie-", ".png", suffix);
                                                res(fs.readFileSync(fn));
                                                break;
                                        } case "s": {
                                                const fn = fUtil.getFileIndex("starter-", ".png", suffix);
                                                res(fs.readFileSync(fn));
                                                break;
                                        }
                                }
                        } catch (e) {
                                rej(e);
                        }
		});
	},
	list() {
		const array = [];
		const last = fUtil.getLastFileIndex("movie-", ".xml");
		for (let c = last; c >= 0; c--) {
			const movie = fs.existsSync(fUtil.getFileIndex("movie-", ".xml", c));
			const thumb = fs.existsSync(fUtil.getFileIndex("thumb-", ".png", c));
			if (movie && thumb) array.push(`m-${c}`);
		}
		return array;
	},
	meta(id) {
		return new Promise(async (res, rej) => {
                        try {
                                const i = id.indexOf("-");
                                const prefix = id.substr(0, i);
                                const suffix = id.substr(i + 1);
                                let fn;
                                switch (prefix) {
                                        case "m": {
                                                fn = fUtil.getFileIndex("movie-", ".xml", suffix);
                                                break;
                                        } case "s": {
                                                fn = fUtil.getFileIndex("starter-", ".xml", suffix);
                                                break;
                                        }
                                }
                                const buffer = fs.readFileSync(fn);
                                const begTitle = buffer.indexOf("<title>") + 16;
                                const endTitle = buffer.indexOf("]]></title>");
                                const title = buffer.slice(begTitle, endTitle).toString().trim();
                                const begDesc = buffer.indexOf("<desc>") + 15;
                                const endDesc = buffer.indexOf("]]></desc>");
                                const desc = buffer.slice(begDesc, endDesc).toString().trim();
                                const begTags = buffer.indexOf("<tag>") + 14;
                                const endTags = buffer.indexOf("]]></tag>");
                                const tags = buffer.slice(begTags, endTags).toString().trim();
                                const begDuration = buffer.indexOf('duration="') + 10;
                                const endDuration = buffer.indexOf('"', begDuration);
                                const duration = Number.parseFloat(buffer.slice(begDuration, endDuration));
                                const begPublic = buffer.indexOf('published="') + 11;
                                const endPublic = buffer.indexOf('"', begPublic);
                                const public = Number.parseFloat(buffer.slice(begPublic, endPublic));
                                const begPrivate = buffer.indexOf('pshare="') + 8;
                                const endPrivate = buffer.indexOf('"', begPrivate);
                                const private = Number.parseFloat(buffer.slice(begPrivate, endPrivate));
                                const min = ("" + ~~(duration / 60)).padStart(2, "0");
                                const sec = ("" + ~~(duration % 60)).padStart(2, "0");
                                const durationString = `${min}:${sec}`;
                                res({
                                        date: fs.statSync(fn).mtime,
                                        durationString,
                                        duration,
                                        title: title || "Untitled Video",
                                        desc,
                                        tags,
                                        id,
                                        themeId: "ugc",
                                        public,
                                        private,
                                        type: "movie",
                                        subtype: 0,
                                        enc_asset_id: id,
                                        file: `${id}.xml`
                                });
                        } catch (e) {
                                rej(e);
                        }
		});
	},
};