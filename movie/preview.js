const folder = process.env.CACHÉ_FOLDER;
const fs = require("fs");

const preview = {
        push: function(dataStr, ip) {
                const fn = `${folder}/${ip}.xml`;
		const ws = fs.createWriteStream(fn, { flags: 'a' });
		dataStr.pipe(ws);
		return ws;
	},
	pop: function(ip) {
                const fn = `${folder}/${ip}.xml`;
		const stream = fs.createReadStream(fn);
		stream.on('end', () => fs.unlinkSync(fn));
		return stream;
	}
};

module.exports = function (req, res, url) {
        switch (req.method) {
                case "POST": {
                        switch (url.pathname) {
                                case "/ajax/saveVideoPreview": {
                                        const ip = req.headers['x-forwarded-for'];
                                        req.on('end', () => res.end());
                                        preview.push(req, ip);
                                        break;
                                } case "/ajax/fetchVideoPreview": {
                                        const ip = req.headers['x-forwarded-for'];
                                        const stream = preview.pop(ip);
                                        stream.pipe(res);
                                        break;
                                } default: return;
                        }
                        break;
                } default: return;
        }
        return true;
}