const importer = $("#importer");

/**
 * importer
 */
class AssetImporter {
	constructor(importer) {
		this.importer = importer;
		this.queue = importer.find("#importer-queue");
		this.config = { maxsize: false };
		this.initialize();
	}
	initialize() {
		this.importer.find("#importer-files").on("input", event => {
			//uploads every file
			var fileUpload = document.getElementById("importer-files");
                        this.addFiles(fileUpload.files[0]);
		});
		this.importer.on("dragover", event => {
			event.preventDefault();
			event.stopPropagation();
		});
		this.importer.on("dragenter", event => {
			event.preventDefault();
			event.stopPropagation();
		})
		this.importer.on("drop", event => {
			event.preventDefault();
			event.stopPropagation();
			const files = event.originalEvent.dataTransfer.files;
                        this.addFiles(files[0]);
		})
	}
	addFiles(file) { //adds a file to the queue
		const ext = file.name.substring(file.name.lastIndexOf(".") + 1);
		const maxsize = this.config.maxsize;
		if (maxsize && file.size > maxsize) return; // check if file is too large
		let validFileType = false;
		let el;
		switch (ext) {
			case "ogg":
			case "mp3":
			case "wma":
			case "wav": {
				validFileType = true;
				el = $(`
					<div class="importer_asset">
						<div class="asset_metadata">
							<img class="asset_preview" src="https://ourmetallicdisplaymanager.joseph-animate.repl.co/static/img/importer/sound.png" />
							<div>
								<h4 contenteditable="true" class="asset_name">${file.name}</h4>
								<p class="asset_subtype">${filesize(file.size)} | Import as...</p>
							</div>
						</div>
						<div class="import_as">
							<a href="#" type="bgmusic">Music</a>
							<a href="#" type="soundeffect">Sound effect</a>
							<a href="#" type="voiceover">Voiceover</a>
						</div>
					</div>
				`.trim()).appendTo(this.queue);
				break;
			}
			case "swf":
			case "gif":
			case "jpg":
                        case "jfif":
			case "png": {
				validFileType = true;
				el = $(`
					<div class="importer_asset">
						<div class="asset_metadata">
							<img class="asset_preview" src="https://ourmetallicdisplaymanager.joseph-animate.repl.co/static/img/importer/image.png" />
							<div>
								<h4 contenteditable="true" class="asset_name">${file.name}</h4>
								<p class="asset_subtype">${filesize(file.size)} | Import as...</p>
							</div>
						</div>
						<div class="import_as">
							<a href="#" type="bg">Background</a>
							<a href="#" type="prop">Prop</a>
						</div>
					</div>
				`.trim()).prependTo(this.queue);
				break;
			}
		}
		if (!validFileType) {
                        parent.importFailed("Invalid file type!", true);
			return;
		} else parent.clearImporterErrorMessage();
		const request = new ImporterFile(file, el, ext);
	}
}
class ImporterFile {
	constructor(file, element, ext) {
		this.file = file;
		this.el = element;
		this.ext = ext;
		this.initialize();
	}
	initialize() {
		this.el.find("[type]").on("click", async event => {
			const el = $(event.target);
			const type = el.attr("type");
			Object.assign(this, this.typeFickser(type));
			if (this.type == "prop") {
				// wait for the prop type to be selected
				await new Promise(resolve => {
					this.el.find(".import_as").html(`
						<a href='#' ptype='holdable'>Handheld</a>
						<a href='#' ptype='wearable'>Headgear</a>
						<a href='#' ptype='placeable'>Other Prop</a>
					`.trim());
					this.el.on("click", "[ptype]", event => {
						const el = $(event.target);
						this.ptype = el.attr("ptype");
						resolve();
					});
				});
			}
			// get the title
			let name = this.el.find(".asset_name").text();
			this.upload(name);
		});
	}
	typeFickser(type) {
		switch (type) {
			case "bgmusic":
			case "soundeffect":
			case "voiceover": 
                                return { 
                                        type: "sound", 
                                        subtype: type 
                                };
                        default: 
                                return { 
                                        type: type, 
                                        subtype: 0 
                                };
                }
	}
	upload(passedname) {
		let name = passedname;
		if (name == "") name = "unnamed" + Math.random().toString().substring(2, 8);
		parent.importStarted(this, name);
	}
}
