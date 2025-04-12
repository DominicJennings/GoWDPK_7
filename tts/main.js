const brotli = require("brotli");
const { convertToMp3 } = require("../misc/file");
const https = require("https");
const voices = require("./info.json").voices;
function checkSpeakStatus(id) {
        return new Promise((res, rej) => {
                https.get(`https://api.uberduck.ai/speak-status?uuid=${id}`, (r) => {
                        let buffers = [];
                        r.on("data", (b) => buffers.push(b)).on("end", () => {
                                try {
                                        const json = JSON.parse(Buffer.concat(buffers));
                                        res(json);
                                } catch (e) {
                                        rej(e);
                                }
                        }).on("error", rej);
                }).on("error", rej);
        });
}

/**
 * uses tts demos to generate tts
 * @param {string} voiceName
 * @param {string} text
 * @returns {Promise<IncomingMessage>}
 */
module.exports = (voiceName, rawText) => {
	return new Promise(async (res, rej) => {
		const voice = voices[voiceName];
		if (!voice) return rej("The voice you requested is unavailable. Please try another voice.");

		let flags = {};
		const pieces = rawText.split("#%");
		let text = pieces.pop().substring(0, 180);
		for (const rawFlag of pieces) {
			const index = rawFlag.indexOf("=");
			if (index == -1) continue;
			const name = rawFlag.substring(0, index);
			const value = rawFlag.substring(index + 1);
			flags[name] = value;
		}

		try {
			switch (voice.source) {
				case "polly": {
					const body = new URLSearchParams({
						msg: text,
						lang: voice.arg,
						source: "ttsmp3"
					}).toString();

					const req = https.request(
						{
							hostname: "ttsmp3.com",
							path: "/makemp3_new.php",
							method: "POST",
							headers: { 
								"Content-Length": body.length,
								"Content-type": "application/x-www-form-urlencoded"
							}
						},
						(r) => {
							let body = "";
							r.on("data", (c) => body += c);
							r.on("end", () => {
								const json = JSON.parse(body);
								if (json.Error == 1) {
									return rej(json.Text);
								}

								https
									.get(json.URL, (r) => {
                                                                                let body = "";
                                                                                r.on("data", (c) => body += c);
                                                                                r.on("end", () => res(body));
                                                                        })
									.on("error", rej);
							});
							r.on("error", rej);
						}
					)
					req.on("error", rej);
					req.end(body);
					break;
				}

				case "nuance": {
					const q = new URLSearchParams({
						voice_name: voice.arg,
						speak_text: text,
					}).toString();

					https
						.get(`https://voicedemo.codefactoryglobal.com/generate_audio.asp?${q}`, (r) => {
                                                        const buffers = [];
                                                        r.on("data", (b) => buffers.push(b)).on("end", () => res(Buffer.concat(buffers)));
                                                })
						.on("error", rej);
					break;
				}

				case "microsoft": {
					let url;
					if (voice.desc.includes("Bonzi")) url = `https://www.tetyys.com/SAPI4/SAPI4?text=${
						encodeURIComponent(text)
					}&voice=${encodeURIComponent(voice.arg)}&pitch=140&speed=157`
					else url = "https://www.tetyys.com/SAPI4/SAPI4?text=" + encodeURIComponent(text) + "&voice=" + encodeURIComponent(voice.arg);
					https.get(url, (r) => convertToMp3(r, "wav").then(v => {
                                                const buffers = [];
                                                v.on("data", (b) => buffers.push(b)).on("end", () => res(Buffer.concat(buffers)));
                                        }).catch(rej)).on("error", rej);
					break;
				}

				case "cepstral": {
					let pitch;
					if (flags.pitch) {
						pitch = +flags.pitch;
						pitch /= 100;
						pitch *= 4.6;
						pitch -= 0.4;
						pitch = Math.round(pitch * 10) / 10;
					} else {
						pitch = 1;
					}
					https.get("https://www.cepstral.com/en/demos", async (r) => {
						const cookie = r.headers["set-cookie"];
						const q = new URLSearchParams({
							voiceText: text,
							voice: voice.arg,
							createTime: 666,
							rate: 170,
							pitch,
							sfx: "none"
						}).toString();

						https.get(
							{
								hostname: "www.cepstral.com",
								path: `/demos/createAudio.php?${q}`,
								headers: { Cookie: cookie }
							},
							(r) => {
								let body = "";
								r.on("data", (b) => body += b);
								r.on("end", () => {
									const json = JSON.parse(body);

									https
										.get(`https://www.cepstral.com${json.mp3_loc}`, (r) => {
                                                                                        let body = "";
                                                                                        r.on("data", (b) => body += b);
                                                                                        r.on("end", () => res(body)).on("error", rej);
                                                                                }).on("error", rej);
                                                                }).on("error", rej);
							}
						).on("error", rej);
					}).on("error", rej);
					break;
				}

				case "voiceforge": {
					const q = new URLSearchParams({						
						msg: text,
						voice: voice.arg,
						email: "null"
					}).toString();
					
					https.get({
						hostname: "api.voiceforge.com",
						path: `/swift_engine?${q}`,
						headers: { 
							"User-Agent": "just_audio/2.7.0 (Linux;Android 11) ExoPlayerLib/2.15.0",
							"HTTP_X_API_KEY": "8b3f76a8539",
							"Accept-Encoding": "identity",
							"Icy-Metadata": "1",
						}
					}, (r) => {
						convertToMp3(r, "wav").then(v => {
                                                        const buffers = [];
                                                        v.on("data", (b) => buffers.push(b)).on("end", () => res(Buffer.concat(buffers)));
                                                }).catch(rej);
					}).on("error", rej);
					break;
				}

				case "vocalware": {
					const [EID, LID, VID] = voice.arg;
					const q = new URLSearchParams({
						EID,
						LID,
						VID,
						TXT: text,
						EXT: "mp3",
						FNAME: "",
						ACC: 15679,
						SceneID: 2703396,
						HTTP_ERR: "",
					}).toString();

					https
						.get(
							{
								hostname: "cache-a.oddcast.com",
								path: `/tts/genB.php?${q}`,
								headers: {
									"Host": "cache-a.oddcast.com",
									"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:107.0) Gecko/20100101 Firefox/107.0",
									"Accept": "*/*",
									"Accept-Language": "en-US,en;q=0.5",
									"Accept-Encoding": "gzip, deflate, br",
									"Origin": "https://www.oddcast.com",
									"DNT": 1,
									"Connection": "keep-alive",
									"Referer": "https://www.oddcast.com/",
									"Sec-Fetch-Dest": "empty",
									"Sec-Fetch-Mode": "cors",
									"Sec-Fetch-Site": "same-site"
								}
							}, (r) => {
                                                                let buffers = [];
                                                                r.on("data", (d) => buffers.push(d));
                                                                r.on("end", () => res(Buffer.concat(buffers)));
                                                        }
						)
						.on("error", rej);
					break;
				}

				case "acapela": {
					let acapelaArray = [];
					for (let c = 0; c < 15; c++) acapelaArray.push(~~(65 + Math.random() * 26));
					const email = `${String.fromCharCode.apply(null, acapelaArray)}@gmail.com`;

					let req = https.request(
						{
							hostname: "acapelavoices.acapela-group.com",
							path: "/index/getnonce",
							method: "POST",
							headers: {
								"Content-Type": "application/x-www-form-urlencoded",
							},
						},
						(r) => {
							let buffers = [];
							r.on("data", (b) => buffers.push(b));
							r.on("end", () => {
								const nonce = JSON.parse(Buffer.concat(buffers)).nonce;
								let req = https.request(
									{
										hostname: "acapela-group.com",
										port: "8443",
										path: "/Services/Synthesizer",
										method: "POST",
										headers: {
											"Content-Type": "application/x-www-form-urlencoded",
										},
									},
									(r) => {
										let buffers = [];
										r.on("data", (d) => buffers.push(d));
										r.on("end", () => {
											const html = Buffer.concat(buffers);
											const beg = html.indexOf("&snd_url=") + 9;
											const end = html.indexOf("&", beg);
											const sub = html.subarray(beg, end).toString();

											https
												.get(sub, (r) => {
                                                                                                        let buffers = [];
                                                                                                        r.on("data", (d) => buffers.push(d));
                                                                                                        r.on("end", () => res(Buffer.concat(buffers)));
                                                                                                })
												.on("error", rej);
										});
										r.on("error", rej);
									}
								).on("error", rej);
								req.end(
									new URLSearchParams({
										req_voice: voice.arg,
										cl_pwd: "",
										cl_vers: "1-30",
										req_echo: "ON",
										cl_login: "AcapelaGroup",
										req_comment: `{"nonce":"${nonce}","user":"${email}"}`,
										req_text: text,
										cl_env: "ACAPELA_VOICES",
										prot_vers: 2,
										cl_app: "AcapelaGroup_WebDemo_Android",
									}).toString()
								);
							});
						}
					).on("error", rej);
					req.end(
						new URLSearchParams({
							json: `{"googleid":"${email}"`,
						}).toString()
					);
					break;
				}

				case "svox": {
					const q = new URLSearchParams({
						apikey: "e3a4477c01b482ea5acc6ed03b1f419f",
						action: "convert",
						format: "mp3",
						voice: voice.arg,
						speed: 0,
						text,
						version: "0.2.99",
					}).toString();

					https
						.get(`https://api.ispeech.org/api/rest?${q}`, (r) => {
                                                        let buffers = [];
                                                        r.on("data", (d) => buffers.push(d));
                                                        r.on("end", () => res(Buffer.concat(buffers)));
                                                })
						.on("error", rej);
					break;
				}

				case "readloud": {
					const req = https.request(
						{
							hostname: "101.99.94.14",														
							path: voice.arg,
							method: "POST",
							headers: { 			
								Host: "gonutts.net",					
								"Content-Type": "application/x-www-form-urlencoded"
							}
						},
						(r) => {
							let buffers = [];
							r.on("data", (b) => buffers.push(b));
							r.on("end", () => {
								const html = Buffer.concat(buffers);
								const beg = html.indexOf("/tmp/");
								const end = html.indexOf("mp3", beg) + 3;
								const path = html.subarray(beg, end).toString();

								if (path.length > 0) {
									https.get({
										hostname: "101.99.94.14",	
										path: `/${path}`,
										headers: {
											Host: "gonutts.net"
										}
									}, (r) => {
                                                                                let buffers = [];
                                                                                r.on("data", (d) => buffers.push(d));
                                                                                r.on("end", () => res(Buffer.concat(buffers)));
                                                                        }).on("error", rej);
								} else {
									return rej("Could not find voice clip file in response.");
								}
							});
						}
					);
					req.on("error", rej);
					req.end(
						new URLSearchParams({
							but1: text,
							butS: 0,
							butP: 0,
							butPauses: 0,
							but: "Submit",
						}).toString()
					);
					break;
				}

				case "cereproc": {
					const req = https.request(
						{
							hostname: "www.cereproc.com",
							path: "/themes/benchpress/livedemo.php",
							method: "POST",
							headers: {
								"content-type": "text/xml",
								"accept-encoding": "gzip, deflate, br",
								origin: "https://www.cereproc.com",
								referer: "https://www.cereproc.com/en/products/voices",
								"x-requested-with": "XMLHttpRequest",
								cookie: "Drupal.visitor.liveDemo=666",
							},
						},
						(r) => {
							var buffers = [];
							r.on("data", (d) => buffers.push(d));
							r.on("end", () => {
								const xml = String.fromCharCode.apply(null, brotli.decompress(Buffer.concat(buffers)));
								const beg = xml.indexOf("<url>") + 5;
								const end = xml.lastIndexOf("</url>");
								const loc = xml.substring(beg, end).toString();
								https.get(loc, (r) => {
                                                                        let buffers = [];
                                                                        r.on("data", (d) => buffers.push(d));
                                                                        r.on("end", () => res(Buffer.concat(buffers)));
                                                                }).on("error", rej);
							});
							r.on("error", rej);
						}
					);
					req.on("error", rej);
					req.end(
						`<speakExtended key='666'><voice>${voice.arg}</voice><text>${text}</text><audioFormat>mp3</audioFormat></speakExtended>`
					);
					break;
				}

				case "tiktok": {
					const req = https.request(
						{
							hostname: "tiktok-tts.weilnet.workers.dev",
							path: "/api/generation",
							method: "POST",
							headers: {
								"Content-type": "application/json"
							}
						},
						(r) => {
							let body = "";
							r.on("data", (b) => body += b);
							r.on("end", () => {
								const json = JSON.parse(body);
								if (json.success !== true) {
									return rej(json.error);
								}

								res(Buffer.from(json.data, "base64"));
							});
							r.on("error", rej);
						}
					).on("error", rej);
					req.end(JSON.stringify({
						text,
						voice: voice.arg
					}));
					break;
				}
				case "ttstool": {
					https.request({
						hostname: "support.readaloud.app",
						path: "/ttstool/createParts",
						method: "POST",
						headers: {
								"Content-Type": "application/json",
						},
					}, (r) => {
						let buffers = [];
						r.on("data", (d) => buffers.push(d)).on("error", rej).on("end", () => {
							https.get({
								hostname: "support.readaloud.app",
								path: `/ttstool/getParts?q=${JSON.parse(Buffer.concat(buffers))[0]}`,
								headers: {
									"Content-Type": "audio/mp3"
								}
							}, (r) => {
                                                                let buffers = [];
                                                                r.on("data", (d) => buffers.push(d));
                                                                r.on("end", () => res(Buffer.concat(buffers)));
                                                        }).on("error", rej);
						});
					}).end(JSON.stringify([
						{
							voiceId: voice.arg,
							ssml: `<speak version="1.0" xml:lang="${voice.lang}">${text}</speak>`
						}
					])).on("error", rej);
					break;
				}
				case "uberduck": {
					https.request({
                                                method: 'POST',
                                                hostname: 'api.uberduck.ai',
                                                path: '/speak',
                                                headers: {
                                                        accept: 'application/json',
                                                        'content-type': 'application/json',
                                                        authorization: `Basic 
                                                                cHViX21hdGR2bHZrYXBwcW9ocGtheDpwa18zOGU2Yjk5NC0wZjBmLTQwMDItYmEyMC02MmI2MjQ4N2IyYmM=`
                                                }
                                        }, (r) => {
                                                let body = "";
                                                r.on("data", (d) => body += d);
                                                r.on("end", async () => {
                                                        const info = JSON.parse(body);
                                                        let json = await checkSpeakStatus(info.uuid);
                                                        while (json.path === null) json = await checkSpeakStatus(info.uuid);
                                                        https.get(json.path, (r) => convertToMp3(r, "wav").then(buff => {
                                                                let buffers = [];
                                                                buff.on("data", (b) => buffers.push(b)).on("end", () => {
                                                                        res(Buffer.concat(buffers));
                                                                });
                                                        }))
                                                });
                                        }).end(`{
                                                voice: "${voice.name}",
                                                speech: "${data.text}"
                                        }`);
					break;
				}
				default: return rej("The voice you requested currently has no source available right now. Please try another voice.");
			}
		} catch (e) {
			return rej(e);
		}
	});
};