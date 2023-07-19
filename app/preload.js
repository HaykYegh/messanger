const appConfig = require("./config.json").zz;

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text
    };

    replaceText("app_name", appConfig.TITLE);
});

document.addEventListener('keydown', event => {
    if(event.ctrlKey && event.shiftKey && event.keyCode === 68) {
        window.ipcRenderer.send('openDevTools');
    }
});

window.ipcRenderer = require('electron').ipcRenderer;
window.shell = require('electron').shell;
window.isWin = /^win/.test(process.platform);
window.isMac = /^darwin/.test(process.platform);
window.isDesktop = true;
window.remote = require('@electron/remote');
window.fs = window.remote.require('fs');
window._os = window.remote.require('os');

window.ffmpegPath = require('@ffmpeg-installer/ffmpeg').path.replace('app.asar', 'app.asar.unpacked');
window.ffprobePath = require('@ffprobe-installer/ffprobe').path.replace('app.asar', 'app.asar.unpacked');
window.ffmpeg = require('fluent-ffmpeg');
window.ffmpeg.setFfmpegPath(ffmpegPath);
window.ffmpeg.setFfprobePath(ffprobePath);
window.command = ffmpeg();

/*if(window.remote && window.remote.process){
    process.on('uncaughtException', function (error) {
        console.log(error);
    });
}*/
