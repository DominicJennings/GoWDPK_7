const formidable = require("formidable");
const fUtil = require("../misc/file");
const parse = require("./parse");
const https = require("https");
const fs = require("fs");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url, _settings, user) {
	if (req.method != "POST") return;
  switch (url.path) {
    case "/ajax/movie/upload": {
      new formidable.IncomingForm().parse(req, (e, f, files) => {
        if (e) {
          res.statusCode = 302;
          res.setHeader("Content-Type", "/html/list.html?errorMessage=Something unexpected has happened while uploading a movie. please try again later.");
          res.end();
        } else {
          const newId = fUtil.getNextFileId("movie-", ".xml");
          const filepath = fUtil.getFileIndex("movie-", ".xml", newId);
          const thumbpath = fUtil.getFileIndex("thumb-", ".png", newId);
          const largepath = fUtil.getFileIndex("movie-", ".png", newId);
          const filename = files.import.originalFilename;
          if (
            files.import.mimetype !== "application/xml" &&
            files.import.mimetype !== "application/x-zip-compressed" &&
            files.import.mimetype !== "application/zip" &&
            !buffer.slice(0, 4).equals(
              Buffer.from([0x50, 0x4b, 0x03, 0x04])
            )
          ) {
            res.statusCode = 302;
            res.setHeader("Content-Type", "/html/list.html?errorMessage=Attempted movie upload with invalid file.");
            res.end();
          }
          if (filename.includes(".zip")) {
            parse.unpackMutiple(fs.readFileSync(files.import.filepath)).then(zip => {
              fs.writeFileSync(filepath, zip.xmlBuffer);
              if (zip.thumbBuffer) fs.writeFileSync(thumbpath, zip.thumbBuffer);
              if (zip.largeBuffer) fs.writeFileSync(largepath, zip.largeBuffer);
            }).catch(e => {
              res.statusCode = 302;
              res.setHeader("Content-Type", "/html/list.html?errorMessage=Something unexpected has happened while uploading a movie. please try again later.");
              res.end();
            });
          } else parse.unpackXml(fs.readFileSync(files.import.filepath), `m-${newId}`);
          fs.writeFileSync(fUtil.getFileIndex("user-", ".json", newId), JSON.stringify(user));
          res.statusCode = 302;
          res.setHeader("Location", `/go_full?movieId=m-${newId}`);
          res.end();
        }
      });
      break;
    }
      // you should make a xss check, it'll prevent people from posting p()rn images into the thmeelist. i've seen it happen to Wrapper Online Reborn and some others so it kinda makes sense lol
  }
	return true;
};
