module.exports = function (req, res, url) {
	if (req.method != "GET") return;
        const match = url.pathname.match(/\/videomaker\/full\/([^/]+)\/tutorial$/);
        if (!match) return;
        res.statusCode = 302;
        res.setHeader("Location", `/go_full?tray=${match[1]}&tutorial=0`);
        res.end();
	return true;
};
