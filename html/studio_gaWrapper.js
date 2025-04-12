let userData, settingsData;
setTimeout(() => {
        if (userData && userData.loggedIn) window.location.href = window.location.origin
}, 1000)
function retrievePreviewPlayerData() {
        var r = new XMLHttpRequest();
        r.open('POST', '/ajax/fetchVideoPreview', false);
        r.send(null);
        return r.responseText
}
function showModal(title, content, isLoaded = false) {
        const closeHTML = '<span class="close" onclick="hideModal()">&times;</span>'
        $("#shade").show();
        $("#modal").html(`<div class="window"><h1>${title} ${isLoaded ? closeHTML : ''}</h1><center><br><br>${content}</center></div>`).show();
}
function toAttrString(table) {
	return typeof (table) == 'object' ? Object.keys(table).filter(key => table[key] !== null).map(key =>
		`${encodeURIComponent(key)}=${encodeURIComponent(table[key])}`).join('&') : table.replace(/"/g, "\\\"");
}
function toParamString(table) {
	return Object.keys(table).map(key =>
		`<param name="${key}" value="${toAttrString(table[key])}">`
	).join(' ');
}
function toObjectString(attrs, params) {
	return `<object id="obj" ${Object.keys(attrs).map(key =>
		`${key}="${attrs[key].replace(/"/g, "\\\"")}"`
	).join(' ')}>${toParamString(params)}</object>`;
}
function hideModal() {
        $("#shade").hide();
        $("#modal").hide();
}
function initPreviewPlayer(xml, startFrame) {
        showModal('Preview Video', '<img src="/html/preview_gen.gif"/>');
        var a = xml.split('');
        function f() {
                var s = a.splice(0,5e5);
                if (s.length) 
                        fetch('/ajax/saveVideoPreview', {
                                method: 'POST',
                                body: s.join('')
                        }).then(f);
                else showModal('Preview Video', toObjectString(attrs, params), true);
        };
        const params = {
                flashvars: {
                        apiserver: window.location.origin + '/', 
                        storePath: 'https://josephanimate2021.github.io/store/3a981f5cb2739137/<store>', 
                        ut: 10, 
                        autostart: 1, 
                        clientThemePath: 'https://josephanimate2021.github.io/static/ad44370a650793d9/<client_theme>',
                        isInitFromExternal: 1, 
                        startFrame: startFrame,
                        isWide: 1,
                        movieId: flashvars.presaveId
                },
                allowScriptAccess: 'always',
                allowFullScreen: 'true',
                bgcolor: '#000000'
        };
        const attrs = {
                data: 'https://josephanimate2021.github.io/animation/414827163ad4eb60/player.swf',
                type: 'application/x-shockwave-flash', width: '550', height: '384',
        };
        f()
}
const interactiveTutorial = {
        neverDisplay: function() {
                return true
        }
};
function studioLoaded(arg) {
        console.log(arg)
};
function exitStudio() {
        quitStudio();
}
function quitStudio() {
        window.location = '/html/list_guest.html'
}