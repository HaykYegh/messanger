// require('@electron/remote/main').initialize()
const electron = require('electron');
const path = require('path');
const os = require("os");
const AutoLaunch = require('auto-launch');
const archiver = require('archiver');
// const addon = require(path.join(process.resourcesPath, "addon.node"));
const addon = require('zangi-addon');

// /Applications/Zangi.app/Contents/Resources/addon.node

const prefix = "zz"
const params = {
    zz: {
        webView: false,
    },
    po: {
        webView: true,
    },
    rs: {
        webView: false,
    },
    jt: {
        webView: false,
    },
    oo: {
        webView: false,
    },
    sk: {
        webView: false,
    },
};

const {autoUpdater, CancellationToken} = require('electron-updater');

const {Tray, nativeImage, Menu, app, BrowserWindow, dialog, ipcMain, Notification, BrowserView} = electron;
require('@electron/remote/main').initialize()

let checkForUpdateInterval = null;

app.commandLine.appendSwitch('remote-debugging-port', '9222')


const logger = require('./electron/services/logger');

const appInstance = (electron.app || electron.remote.app);
const appDataPath = appInstance.getPath('userData');
const runtimeFolder = path.join(appDataPath, 'runtime');
const thumbFileDirname = "thumbs";
const thumbFileDir = path.join(appDataPath, thumbFileDirname);
const gifFileDirname = "gifs";
const gifFileDir = path.join(appDataPath, gifFileDirname);
const zipFolderDirname = "zip";
const zipFolderDir = path.join(appDataPath, zipFolderDirname);
const {DOWNLOAD_FOLDER_NAME, LEARN_MORE_URL} = require("./config.json").zz;

const _process = process;
_process.env.GOOGLE_API_KEY = "AIzaSyDpojwgOKdDa0jpPCwIk7WduZ54rFJ4SSI";
_process.env.IS_LOGS_ENABLED = "1";

// open this line for primeone chat later for release
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const isMac = /^darwin/.test(process.platform);
const isWin = /^win/.test(process.platform);
const url_scheme = 'zangi';
const iconPath = path.join(__dirname, 'assets/images/icon.ico');
const fs = require('fs');
const AWS = require('aws-sdk');
// const {ToastNotification} = require('electron-windows-notifications')
// const appId = 'com.electron.zangi';

global.globalValues = {firstOpen: true, link: null};
global.thumbFileDir = thumbFileDir;
global.gifFileDir = gifFileDir;
global._iconPath = path.join(__dirname, 'assets/icons/dialog/logo@2x.png');

let firstOpen = true;
let force_quit = false;
let mainWindow;
let callWindow;
let groupCallWindow;
let tray;
let secondWindow;
let homePath = "";

const CALL_WINDOW_WIDTH = 280;
const CALL_WINDOW_HEIGHT = 410;
const LOADER_WINDOW_WIDTH = 350;
const LOADER_WINDOW_HEIGHT = 350;

// let update_downloading = false;
// let notifiedAboutUpdate = false;
// let notNotifyUpdate = false;


let audioFinished = true;
let bagdeImage = null;
let badgeCount = 0;

app.commandLine.appendSwitch('--autoplay-policy', 'no-user-gesture-required');
// app.commandLine.appendSwitch('--js-flags', '--experimental-wasm-threads');
// app.commandLine.appendSwitch('--enable-features', 'WebAssembly,SharedArrayBuffer');

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development') {
    require('electron-debug')();
    const path = require('path');
    const p = path.join(__dirname, '..', 'app', 'node_modules');
    require('module').globalPaths.push(p);
}

process.on('uncaughtException', function (err) {
    mainWindow && mainWindow.webContents.send('sendError', err);
});

const installExtensions = () => {
    if (process.env.NODE_ENV === 'development') {
        const installer = require('electron-devtools-installer');

        const extensions = [
            'REACT_DEVELOPER_TOOLS',
            'REDUX_DEVTOOLS'
        ];
        const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
        return Promise.all(extensions.map(name => installer.default(installer[name], forceDownload)));
    }

    return Promise.resolve([]);
};

function createWindow() {
    const bounds = electron.screen.getPrimaryDisplay().bounds;

    const LOADER_WINDOW_X_POS = bounds.x + ((bounds.width - LOADER_WINDOW_WIDTH) / 2);
    const LOADER_WINDOW_Y_POS = bounds.y + ((bounds.height - LOADER_WINDOW_HEIGHT) / 2);
    let loader = new BrowserWindow({
        width: LOADER_WINDOW_WIDTH,
        height: LOADER_WINDOW_HEIGHT,
        minWidth: LOADER_WINDOW_WIDTH,
        minHeight: LOADER_WINDOW_HEIGHT,
        transparent: false,
        frame: false,
        resizable: false,
        x: LOADER_WINDOW_X_POS,
        y: LOADER_WINDOW_Y_POS,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });
    loader.loadURL(`file://${__dirname}/loader.html`);

    const gotTheLock = app.requestSingleInstanceLock();

    app.on('second-instance', (event, argv) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
        mainWindow.webContents.send('openNetwork', argv);
        //mainWindow.webContents.send('openChannel', argv);
    });

    if (!gotTheLock) {
        return app.quit();
    }

    if (isWin) {
        tray = new Tray(iconPath);
        const contextMenu = Menu.buildFromTemplate([{label: 'Quit', role: 'quit'}]);
        tray.setContextMenu(contextMenu);
        tray.on("click", () => {
            !mainWindow.isVisible() ? mainWindow.show() : null;
        });
    }

    homePath = os.homedir();
    process.chdir(homePath);
    fs.access(process.cwd() + "/downloads", function (err) {
        if (err) {
            fs.mkdirSync("downloads");
        }
        process.chdir(homePath + "/downloads");
        fs.access(homePath + "/downloads/" + DOWNLOAD_FOLDER_NAME, function (err) {
            if (err) {
                fs.mkdirSync(DOWNLOAD_FOLDER_NAME);
            }
            process.chdir(homePath + "/downloads/" + DOWNLOAD_FOLDER_NAME);
            // fs.access(homePath + "/downloads/zangi/gif", function (err) {
            //     if (err) {
            //         fs.mkdirSync("gif");
            //     }
            // });
        });
    });

    fs.access(thumbFileDir, (err => {
        if (err) {
            fs.mkdirSync(thumbFileDir, '0777');
        }
    }));
    fs.access(gifFileDir, (err => {
        if (err) {
            fs.mkdirSync(gifFileDir, '0777');
        }
    }));

    mainWindow = new BrowserWindow({
        titleBarStyle: 'default',
        width: 1200,
        height: 800,
        minWidth: 1040,
        minHeight: 700,
        backgroundColor: '#fff',
        show: false,
        icon: path.join(__dirname, './assets/icons/mac/icon.icns'),
        webPreferences: {
            contextIsolation: false,
            preload: path.join(__dirname, '/preload.js'),
            nodeIntegration: true,
            webviewTag: params[prefix].webView ? true : false,
            enableRemoteModule: true
        }
    });

    require("@electron/remote/main").enable(mainWindow.webContents)

    // let view = new BrowserView({
    //     webPreferences: {
    //         nodeIntegration: false
    //     }
    // })
    // mainWindow.setBrowserView(view)
    // view.setBounds({ x: 0, y: 0, width: 300, height: 300 })
    // view.webContents.loadURL('https://electronjs.org')

    const CALL_WINDOW_X_POS = bounds.x + ((bounds.width - CALL_WINDOW_WIDTH) / 2);
    const CALL_WINDOW_Y_POS = bounds.y + ((bounds.height - CALL_WINDOW_HEIGHT) / 2);

    callWindow = new BrowserWindow({
        titleBarStyle: 'default',
        frame: false,
        width: CALL_WINDOW_WIDTH,
        height: CALL_WINDOW_HEIGHT,
        minWidth: CALL_WINDOW_WIDTH,
        minHeight: CALL_WINDOW_HEIGHT,
        type: 'normal',
        fullscreenable: false,
        maximizable: false,
        resizable: false,
        transparent: false,
        show: false,
        x: CALL_WINDOW_X_POS,
        y: CALL_WINDOW_Y_POS,
        icon: path.join(__dirname, 'assets/images/icon.ico'),
        webPreferences: {
            contextIsolation: false,
            preload: path.join(__dirname, '/preload.js'),
            enableRemoteModule: true
        }
    });

    groupCallWindow = new BrowserWindow({
        titleBarStyle: 'default',
        frame: false,
        width: 280,
        height: 400,
        minWidth: 300,
        minHeight: 400,
        maxWidth: 300,
        maxHeight: 450,
        type: 'normal',
        fullscreenable: false,
        maximizable: false,
        resizable: false,
        transparent: true,
        show: false,
        icon: path.join(__dirname, 'assets/images/icon.ico'),
        webPreferences: {
            contextIsolation: false,
            preload: path.join(__dirname, '/preload.js'),
            enableRemoteModule: true
        }
    });

    mainWindow.loadURL(`file://${__dirname}/app.html`);
    callWindow.loadURL(`file://${__dirname}/newCallPopup.html`);
    groupCallWindow.loadURL(`file://${__dirname}/groupCallPopup.html`);

    mainWindow.once('ready-to-show', () => {
        if (isWin) {
            mainWindow.setMenu(null);
        }
        // loader.show();
        mainWindow.on('show', (event) => {
            showBadge();
        });
    });

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.show();
    });

    mainWindow.webContents.on('did-start-loading', () => {
        if (!params[prefix].webView) {
            mainWindow.hide();
            loader.show();
        }
    });

    mainWindow.webContents.on('did-stop-loading', () => {
        loader.hide();
        mainWindow.show();
    });

    mainWindow.on('close', (e) => {
        if (!force_quit) {
            e.preventDefault();

            if (mainWindow.isFullScreen()) {
                mainWindow.once('leave-full-screen', () => mainWindow.hide());
                mainWindow.setFullScreen(false);

            } else {
                mainWindow.hide();
            }
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;

        try {
            callWindow.close();
            groupCallWindow.close();

        } catch (e) {
            console.log(e);

        } finally {
            callWindow = null;
            groupCallWindow = null;
        }
    });

    // mainWindow.on('minimize',(e) => {
    //     console.log('electron minimize');
    // });
    // mainWindow.on('maximize',(e) => {
    //     console.log('electron maximize');
    // });
    // mainWindow.on('restore',(e) => {
    //     console.log('electron restore');
    // });

    mainWindow.webContents.session.once('will-download', (event, item) => {
        const fileName = item.getFilename();
        const extension = fileName.slice(fileName.lastIndexOf('.') + 1);
        const file = dialog.showSaveDialog({
            defaultPath: fileName,
            filters: [{name: fileName, extensions: [extension]}]
        });
        if (file === undefined) item.cancel();
        else item.setSavePath(file);
    });

    mainWindow.webContents.on('new-window', function (event, url) {
        event.preventDefault();
        require('electron').shell.openExternal(url)
    });

    const template = [
        {
            label: 'Edit',
            submenu: [
                {role: 'undo'},
                {role: 'redo'},
                {type: 'separator'},
                {role: 'cut'},
                {role: 'copy'},
                {role: 'paste'},
                {role: 'pasteandmatchstyle'},
                {role: 'delete'},
                {role: 'selectall'}
            ]
        },
        {
            label: 'View',
            submenu: [
                {role: 'reload'},
                {role: 'forcereload'},
                {type: 'separator'},
                {role: 'resetzoom'},
                {role: 'zoomin'},
                {role: 'zoomout'},
                {type: 'separator'},
                {role: 'togglefullscreen'}
            ]
        },
        {
            role: 'window',
            submenu: [
                {role: 'minimize'},
                {role: 'close'}
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click() {
                        require('electron').shell.openExternal(LEARN_MORE_URL)
                    }
                }
            ]
        }
    ];

    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                {role: 'about'},
                // {
                //     label: 'Check for updates', //Проверить наличие обновлений
                //     click() {
                //         // checkforUpdates();
                //     }
                // },
                {type: 'separator'},
                {role: 'services', submenu: []},
                {type: 'separator'},
                {role: 'hide'},
                {role: 'hideothers'},
                {role: 'unhide'},
                {type: 'separator'},
                {role: 'quit'}
            ]
        });

        // Edit menu
        template[1].submenu.push(
            {type: 'separator'},
            {
                label: 'Speech',
                submenu: [
                    {role: 'startspeaking'},
                    {role: 'stopspeaking'}
                ]
            }
        );

        // Window menu
        template[3].submenu = [
            {role: 'close'},
            {role: 'minimize'},
            {role: 'zoom'},
            {type: 'separator'},
            {role: 'front'}
        ]
    }

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
        // loader.webContents.openDevTools();
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

}

app.on('before-quit', () => {
    force_quit = true;
    clearInterval(checkForUpdateInterval);
    checkForUpdateInterval = null;
});

app.on('ready', () => {
    checkForUpdateInterval = checkForUpdatesBackground();

    const autoLauncher = new AutoLaunch({
        name: app.getName(),
        isHidden: true,
    });

    // Checking if autoLaunch is enabled, if not then enabling it.
    setTimeout(() => {
            autoLauncher.isEnabled().then(function(isEnabled) {
                console.log("autoLauncher Enabled", isEnabled);
                if (isEnabled) return;
                autoLauncher.enable();
            }).catch(function (err) {
                console.log("autoLauncher error", err);
                throw err;
            })
    }
        , 100
    );


    if (!app.isDefaultProtocolClient(url_scheme)) {
        app.setAsDefaultProtocolClient(url_scheme);
    }
    installExtensions().then(() => createWindow()).catch(e => console.log(e));



    setTimeout(() => {
        if (!isWin) {
            app.dock.hide();
        }

        if (callWindow) {
            callWindow.setAlwaysOnTop(true, "floating");
            callWindow.setVisibleOnAllWorkspaces(true);
            callWindow.setFullScreenable(false);
            callWindow.show();
            callWindow.hide();
        }

        if (groupCallWindow) {
            groupCallWindow.setAlwaysOnTop(true, "floating");
            groupCallWindow.setVisibleOnAllWorkspaces(true);
            groupCallWindow.setFullScreenable(false);
            groupCallWindow.show();
            groupCallWindow.hide();
        }

        if (!isWin) {
            app.dock.show();
            setTimeout(showBadge, 1000);
        }
    }, 1);
});

// Protocol handler for osx
/*app.on('open-url', function (event, url) {
    event.preventDefault();
    if(mainWindow){
        mainWindow.webContents.send('openChannel', [url]);
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
    }else{
        globalValues.link = url;
    }
});*/

// Protocol handler for osx
app.on('open-url', function (event, url) {
    event.preventDefault();
    if (mainWindow) {
        mainWindow.webContents.send('openNetwork', [url]);
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    } else {
        globalValues.link = url;
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    } else if (typeof mainWindow !== "undefined") {
        mainWindow.show();
    }
});

ipcMain.on('notification', (event, {title, options}) => {
    if (isWin) {
        // let notification = new ToastNotification({
        //     appId: appId,
        //     template: `<toast><visual version='1'><binding template="ToastImageAndText02"><text id="1">%s</text><text id="2">%s</text><image id="1" src="%s" alt="Zangi"/></binding></visual><audio src='ms-winsoundevent:Notification.ddd'/></toast>`,
        //     strings: [title, options.body,path.join(process.resourcesPath, 'logo.png')]
        // });
        //
        // notification.on('activated', () => mainWindow.webContents.send('balloon-clicked', options.data))//mainWindow.webContents.send('balloon-clicked', options.data))
        // notification.show()

        logger.methods.log('info', "##notification##", {
            windows: true,
            shouldDisplay: true
        });

        tray.displayBalloon({
            icon: path.join(__dirname, 'assets/icons/png/128x128.png'),
            title: title,
            content: options.body
        });

        tray.once('balloon-click', () => {
            mainWindow.webContents.send('balloon-clicked', options.data);
        });
    }

    if (isMac || !isMac && !isWin) {
        logger.methods.log('info', "##notification##", {
            mac: true,
            shouldDisplay: true
        });

        const newNotification = new Notification({
            title: title,
            body: options.body,
            // sound: 'sound.mp3',
            // sound: options.sound != "" ? '/Users/vhovhann/Library/Sounds/sound.mp3' : "",
            //icon: path.join(__dirname, 'assets/icons/png/128x128.png'),
            //hasReply: true,
            silent: options.sound === "",
        });

        newNotification.on('click', () => {
            mainWindow && mainWindow.show();
            mainWindow.webContents.send('balloon-clicked', options.data);
        });

        newNotification.show();

    }
});

ipcMain.on('resizeLoginWindow', (event, isLoginWindow) => {
    const minimumSize = mainWindow.getMinimumSize();
    if (isLoginWindow) {
        if (minimumSize[0] !== 640) {
            mainWindow.setMinimumSize(780, 800);
            mainWindow.setMaximumSize(780, 800);
            mainWindow.setSize(780, 800);
            mainWindow.setMaximizable(false);
            mainWindow.center();
        }
    } else {
        if (minimumSize[0] !== 1040) {
            mainWindow.setMinimumSize(780, 800);
            mainWindow.setMaximumSize(5000, 5000);
            mainWindow.setSize(1281, 800);
            mainWindow.setMaximizable(true);
            mainWindow.center();
        }
    }
});

ipcMain.on('setBadge', (event, count) => {
    if (isMac && count) {
        app.dock.setBadge(count > 99 ? "99+" : count.toString());
        badgeCount = count;
    } else if (isMac) {
        app.dock.setBadge('');
        badgeCount = '';
    } else if (isWin && count) {
        bagdeImage = nativeImage.createFromDataURL(count);
    } else {
        bagdeImage = null;
    }
    if (isWin) {
        showBadge();
    }
});

ipcMain.on('incomingCall', (event, caller) => {
    callWindow.webContents.send('sendUserInfo', caller);
    callWindow.show();
});

ipcMain.on('incomingGroupCall', (event, groupInfo) => {
    groupCallWindow.webContents.send('sendUserInfo', groupInfo);
    groupCallWindow.center();
    groupCallWindow.show();
});

ipcMain.on('doCallAction', (event, action) => {
    callWindow.hide();
    mainWindow.webContents.send('doCallAction', action);
    if (action !== "decline" && action !== "ignore") {
        mainWindow.setAlwaysOnTop(true);
        mainWindow.show();
        mainWindow.setAlwaysOnTop(false);
    }
});

ipcMain.on('doGroupCallAction', (event, action) => {
    groupCallWindow.hide();
    mainWindow.webContents.send('doGroupCallAction', action);
    if (action !== "decline" && action !== "ignore") {
        mainWindow.setAlwaysOnTop(true);
        mainWindow.show();
        mainWindow.setAlwaysOnTop(false);
    }
});

ipcMain.on('closeCallPopup', () => {
    try {
        callWindow.hide();

    } catch (e) {
        console.log(e);
    }
});

ipcMain.on('closeGroupCallPopup', () => {
    try {
        groupCallWindow.hide();

    } catch (e) {
        console.log(e);
    }
});

ipcMain.on('showWindow', () => {
    mainWindow.setAlwaysOnTop(true);
    mainWindow.show();
    mainWindow.setAlwaysOnTop(false);
});

ipcMain.on('openDevTools', () => {
    mainWindow.webContents.openDevTools();

    if (process.env.NODE_ENV === 'development') {
        callWindow.webContents.openDevTools();
    }
});


ipcMain.on('openMainFolder', function (event, arg) {
    return new Promise(resolve => {
        process.chdir(homePath);
        fs.access(process.cwd() + "/downloads", function (err) {
            if (err) {
                fs.mkdirSync("downloads");
            }
            process.chdir(homePath + "/downloads");
            fs.access(homePath + "/downloads/" + DOWNLOAD_FOLDER_NAME, function (err) {
                if (err) {
                    fs.mkdirSync(DOWNLOAD_FOLDER_NAME);
                }
                process.chdir(homePath + "/downloads/" + DOWNLOAD_FOLDER_NAME);
                // fs.access(homePath + "/downloads/zangi/gif", function (err) {
                //     if (err) {
                //         fs.mkdirSync("gif");
                //     }
                //     resolve("done");
                // });
            });
        });
    });
});

//
// ipcMain.on('installUpdate', function(event) {
//     force_quit = true;
//     autoUpdater.quitAndInstall();
// });
//
//
// autoUpdater.on('update-available', info => {
//     if(!update_downloading){
//         autoUpdater.downloadUpdate();
//         update_downloading = true;
//     }
// });

// autoUpdater.on('update-not-available', info => {
//     !notNotifyUpdate && mainWindow.webContents.send('updateNotAvailable');
//     notNotifyUpdate = false;
// });
//
// autoUpdater.on('error', info => {
//     notNotifyUpdate = false;
//     notifiedAboutUpdate = false;
//     setTimeout(() => {
//     autoUpdater.downloadUpdate();
//     }, 500000)
// });

// autoUpdater.on('download-progress', progressObj => {
//     !notNotifyUpdate && !notifiedAboutUpdate && mainWindow.webContents.send('updateNotAvailable');
//     notNotifyUpdate = false;
//     notifiedAboutUpdate = true;
//     if(progressObj && progressObj.percent === 100){
//         update_downloading = false;
//     }
//     mainWindow.webContents.send('logInfo',progressObj.percent);
// });
//
// autoUpdater.signals.updateDownloaded(() => {
//         notNotifyUpdate = false;
//         notifiedAboutUpdate = false;
//         mainWindow.webContents.send('updateDownloaded');
//         update_downloading = false;
// });

// ipcMain.on('checkForUpdates', function(event, notNotify) {
//     checkforUpdates(notNotify);
// });
//
//
// function checkforUpdates(notNotify) {
//     notNotifyUpdate = notNotify;
//     notifiedAboutUpdate = false;
//     if(!update_downloading){
//         autoUpdater.checkForUpdates();
//     } else if(!notNotify){
//         mainWindow.webContents.send('updateNotAvailable');
//     }
// }

function showBadge() {
    if (isWin) {
        mainWindow.setOverlayIcon(bagdeImage, "New notification");
    }
    if (isMac) {
        if (badgeCount) {
            app.setBadgeCount(0);
            app.setBadgeCount(badgeCount);
            let badgeCountText = "";
            if (badgeCount > 99) {
                badgeCountText = "99+"
            } else {
                badgeCountText = badgeCount.toString();
            }
            app.dock.setBadge(badgeCountText);
        } else {
            app.dock.setBadge('');
        }
    }
}


ipcMain.on('onLogs', (event, data) => {
    switch (data.action) {
        case 'LIST':
            logger.methods.list((err, filenames) => {
                if (err) {
                    logger.error(err);
                    return mainWindow.webContents.send('logs', {error: true, action: 'LIST',});
                }
                mainWindow.webContents.send('logs', {error: false, action: 'LIST', result: filenames, appDataPath});
            });
            break;
        case 'SEND':
            logger.methods.send({username: data.username, logName: data.logName}, (err, logName) => {
                if (err) {
                    logger.error(err);
                    return mainWindow.webContents.send('logs', {error: true, action: 'SEND', id: data.id});
                }
                mainWindow.webContents.send('logs', {error: false, action: 'SEND', result: logName, id: data.id});
            });
            break;
        case 'REMOVE':
            logger.methods.remove(data.logName, (err, logName) => {
                if (err) {
                    logger.error(err);
                    return mainWindow.webContents.send('logs', {error: true, action: 'REMOVE', id: data.id});
                }
                mainWindow.webContents.send('logs', {error: false, action: 'REMOVE', result: logName, id: data.id});
            });
            break;
        case 'FLUSH':
            logger.methods.flush((err, isFlushed) => {
                if (err) {
                    logger.error(err);
                    return mainWindow.webContents.send('logs', {error: true, action: 'FLUSH',});
                }
                mainWindow.webContents.send('logs', {error: false, action: 'FLUSH', result: isFlushed});
            });
            break;
        case 'LOG':
            const level = data.level || 'verbose';
            const message = data.message;
            const meta = data.meta;
            logger.methods.log(level, message, meta);
            break;
        default:
    }
});


// ELECTRON UPDATER


const updaterStatuses = {
    downloading: false,
    downloaded: false,
    ended: false,
    failed: false,
};

function checkForUpdatesBackground() {
    return setInterval(async () => {
        if (updaterStatuses.downloading || updaterStatuses.downloaded) {
            return;
        }
        await autoUpdater.checkForUpdates();
    }, 1000 * 3600);
}


function getUpdatingToken() {
    return new CancellationToken();
}


let updatingToken = null;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

const appVersionName = '.app_version';
const appVersionConfigPath = `${runtimeFolder}/${appVersionName}`;


if (process.env.NODE_ENV === 'development') {
    autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
}

autoUpdater.on('checking-for-update', () => {
    logger.methods.log('info', "CHECKING_FOR_UPDATE");
    mainWindow.webContents.send('appUpdate', {
        error: false,
        action: 'CHECKING_FOR_UPDATE'
    });
});

autoUpdater.on('update-available', (info) => {
    logger.methods.log('info', info, "UPDATE_AVAILABLE");

    if (updaterStatuses.downloading) {
        mainWindow.webContents.send('appUpdate', {
            error: false,
            action: 'DOWNLOADING'
        });
        return;
    }

    if (updaterStatuses.downloaded) {
        mainWindow.webContents.send('appUpdate', {
            error: false,
            action: 'UPDATE_DOWNLOADED'
        });
        return;
    }

    mainWindow.webContents.send('appUpdate', {
        error: false,
        action: 'UPDATE_AVAILABLE',
        result: info
    });
});

autoUpdater.on('update-not-available', (info) => {
    updaterStatuses.downloading = false;
    logger.methods.log('info', 'UPDATE_NOT_AVAILABLE');
    mainWindow.webContents.send('appUpdate', {
        error: false,
        action: 'UPDATE_NOT_AVAILABLE',
        result: info
    });
});

autoUpdater.on('error', (error) => {
    logger.methods.log('error', error, "ERROR");
    updaterStatuses.downloaded = false;
    updaterStatuses.downloading = false;
    mainWindow.webContents.send('appUpdate', {
        error: true,
        action: 'ERROR',
        result: 'CHECKING_FOR_UPDATE_ERROR_3',
        actualError: error,
    });
});

autoUpdater.on('download-progress', (progressObj) => {

    logger.methods.log("info", "DOWNLOAD_PROGRESS");
    logger.methods.log("info", progressObj);
    mainWindow.webContents.send('appUpdate', {
        error: false,
        action: 'DOWNLOAD_PROGRESS',
        result: progressObj,
        updatingToken
    });


});
autoUpdater.on('update-downloaded', (info) => {
    logger.methods.log("info", "UPDATE_DOWNLOADED");
    logger.methods.log("info", info);

    updaterStatuses.downloading = false;
    updaterStatuses.downloaded = true;

    mainWindow.webContents.send('appUpdate', {
        error: false,
        action: 'UPDATE_DOWNLOADED',
        result: info
    });
});




ipcMain.on('onAppUpdate', (event, data) => {

    logger.methods.log('info', data);

    switch (data.action) {
        case 'CHECK':
            if (updaterStatuses.downloading) {
                mainWindow.webContents.send('appUpdate', {
                    error: false,
                    action: 'DOWNLOADING'
                });
            } else {
                (async () => {
                    await autoUpdater.checkForUpdates();
                })().catch(error => {
                    logger.methods.log('error', error, "CHECKING_FOR_UPDATE_ERROR");
                    mainWindow.webContents.send('appUpdate', {
                        error: true,
                        action: 'ERROR',
                        result: 'CHECKING_FOR_UPDATE_ERROR_1',
                        actualError: error

                    });
                });
            }
            break;
        case 'CHECK_AND_RELOAD':
            (async () => {
                updaterStatuses.downloading = false;
                updaterStatuses.downloaded = false;
                await autoUpdater.checkForUpdates();
            })().catch(error => {
                logger.methods.log('error', error, "CHECKING_FOR_UPDATE_ERROR");
                mainWindow.webContents.send('appUpdate', {
                    error: true,
                    action: 'ERROR',
                    result: 'CHECKING_FOR_UPDATE_ERROR_2',
                    actualError: error
                });
            });
            break;
        case 'DOWNLOAD':
            if (data.cancel) {
                // updaterStatuses.downloading = false

                updatingToken.cancel();
                // mainWindow.webContents.send('appUpdate', {
                //     error: false,
                //     action: 'GETTOKEN',
                //     updatingToken
                // });
                // updatingToken = null;
                // updaterStatuses.downloading = true;

                // updatingToken = getUpdatingToken();
                // autoUpdater.downloadUpdate(updatingToken);

                // updatingToken = getUpdatingToken();
                // await autoUpdater.downloadUpdate(updatingToken);
                //
                // logger.methods.log('error', error, "DOWNLOAD_UPDATE_ERROR");
                // updaterStatuses.downloading = false;
                // updaterStatuses.downloaded = true;
                //
                // mainWindow.webContents.send('appUpdate', {
                //     error: false,
                //     action: 'UPDATE_DOWNLOADED'
                // });
            } else {
                if (updaterStatuses.downloading) {
                    mainWindow.webContents.send('appUpdate', {
                        error: false,
                        action: 'DOWNLOADING'
                    });
                } else {
                    (async () => {
                        updatingToken = getUpdatingToken();
                        updaterStatuses.downloading = true;
                        await autoUpdater.downloadUpdate(updatingToken);
                    })().catch(async error => {
                        updatingToken.cancel();
                        updatingToken = null;
                        updaterStatuses.downloading = true;

                        updatingToken = getUpdatingToken();
                        await autoUpdater.downloadUpdate(updatingToken);

                        logger.methods.log('error', error, "DOWNLOAD_UPDATE_ERROR");
                        updaterStatuses.downloading = false;
                        updaterStatuses.downloaded = true;

                        mainWindow.webContents.send('appUpdate', {
                            error: false,
                            action: 'UPDATE_DOWNLOADED'
                        });
                    });
                }
            }
            break;
        case 'CONTINUE_INTERRUPTED_DOWNLOAD':
            if (updaterStatuses.downloading) {
                updaterStatuses.downloading = false;
                updaterStatuses.downloaded = false;

                if (updatingToken) {
                    updatingToken.cancel();
                    updatingToken = null;
                }

                (async () => {
                    updatingToken = getUpdatingToken();
                    updaterStatuses.downloading = true;
                    await autoUpdater.downloadUpdate(updatingToken);
                })().catch(async error => {
                    updatingToken.cancel();
                    updatingToken = null;


                    updaterStatuses.downloading = true;

                    updatingToken = getUpdatingToken();
                    await autoUpdater.downloadUpdate(updatingToken);

                    logger.methods.log('error', error, "DOWNLOAD_UPDATE_ERROR");
                    updaterStatuses.downloading = false;
                    updaterStatuses.downloaded = true;

                    mainWindow.webContents.send('appUpdate', {
                        error: false,
                        action: 'UPDATE_DOWNLOADED'
                    });
                });
            } else {
                (async () => {
                    await autoUpdater.checkForUpdates();
                })().catch(error => {
                    logger.methods.log('error', error, "CHECKING_FOR_UPDATE_ERROR");
                    mainWindow.webContents.send('appUpdate', {
                        error: true,
                        action: 'ERROR',
                        result: 'CHECKING_FOR_UPDATE_ERROR_1',
                        actualError: error,
                    });
                });
            }
            break;
        case 'UPDATE':
            if (!updaterStatuses.downloading && updaterStatuses.downloaded) {
                force_quit = true;
                autoUpdater.quitAndInstall(true, true);
            } else if (updaterStatuses.downloading && !updaterStatuses.downloaded) {
                mainWindow.webContents.send('appUpdate', {
                    error: false,
                    action: 'DOWNLOADING',
                    result: updaterStatuses
                });
            } else if (!updaterStatuses.downloading && !updaterStatuses.downloaded) {
                (async () => {
                    updatingToken = getUpdatingToken();
                    updaterStatuses.downloading = true;
                    await autoUpdater.downloadUpdate(updatingToken);
                })().catch(async error => {
                    logger.methods.log('error', error, "DOWNLOAD_UPDATE_ERROR");

                    updatingToken.cancel();
                    updatingToken = null;
                    updaterStatuses.downloading = true;

                    updatingToken = getUpdatingToken();
                    await autoUpdater.downloadUpdate(updatingToken);

                    logger.methods.log('error', error, "DOWNLOAD_UPDATE_ERROR");
                    updaterStatuses.downloading = false;
                    updaterStatuses.downloaded = true;

                    mainWindow.webContents.send('appUpdate', {
                        error: false,
                        action: 'UPDATE_DOWNLOADED'
                    });
                });
            }
            break;
        default:
    }
});

ipcMain.on('onAppData', (event, data) => {
    logger.methods.log('info', data);

    switch (data.action) {
        case 'GET_VERSION':
            mainWindow.webContents.send('appData', {
                error: false,
                action: 'VERSION',
                result: appInstance.getVersion().toString()
            });
            break;
        default:
    }
});

// Zip Folder

ipcMain.on('onZip', (event, data) => {

    switch (data.action) {
        case 'ZIP_FOLDER':

            const result = zipFolder(data.file);

            mainWindow.webContents.send('zip', {
                action: 'ZIP_FOLDER',
                error: false,
                result
            });
            break;
        default:
    }
});

ipcMain.on('onCreateLogsFile', (event, data) => {
    const home = require("os").homedir();
    const pathDir = path.join(`${home}/Documents`, 'logs')

    if (!fs.existsSync(pathDir)) {
        fs.mkdir(path.join(`${home}/Documents`, 'logs'), (err) => {
            if (err) {
                return console.error(err);
            }



            // mainWindow.webContents.send('createLogsFile', {
            //     action: 'Create_FOLDER',
            //     error: false,
            //     result: 'file created successfully'
            // });
            console.log('Directory created successfully!');
        });
    }




    // const logpath = home + '/Documents/somefolderwhichexists/' + data.title + '.txt';
    // const logger = fs.createWriteStream(logpath);
});

async function zipFolder(file) {

    const output = fs.createWriteStream(file.path + '.zip');
    const folderName = file.path.replace(/^.*[\\\/]/, '');
    const archive = archiver('zip', {
        zlib: {level: 9}
    });

    archive.pipe(output);
    archive.directory(file.path, folderName, err => {
        if (err) throw err;
        console.log('folder was zipped');
    });

    output.on('finish', () => {
        console.log('completely done');
    });

    await archive.finalize();


    const buffer = fs.readFileSync(`${zipFolderDir}/${folderName}.zip`);
    const blob = new Blob([new Uint8Array(buffer)]);

    archive.on('error', err => {
        throw err;
    });

    fs.unlinkSync(`${zipFolderDir}/${folderName}.zip`);

    return blob;
}


//addon


function init() {
    return addon.ZAudioClient_init(function () {
        console.log("ZAudioClient_init return ", arguments)
    });
}

var result;

ipcMain.on('init', (event, data, e) => {
    let obj={}
    const date = new Date()
    obj.time = `##addon## addon -> ${date.toLocaleTimeString('en-US')}`
    obj.addon = addon
    obj.resourcesPath = path.join(process.resourcesPath, "addon.node")
    console.log("ZAudioClient_init data ", data)
    console.log("ZAudioClient_init addon ", addon)
    logger.methods.log('info', obj, "##addon## ZAudioClient_init data");
    console.log("resourcesPath ->", path.join(process.resourcesPath, "addon.node"))

    result = addon.ZAudioClient_init(function () {
        Array.from(arguments).forEach(item => {
            // logger.methods.log(`##addon## ZAudioClient_init data`, {
            //     msg: {
            //         data: item,
            //         result
            //     }
            // }, "init");
            const date = new Date()
            item.time = `##addon## init -> ${date.toLocaleTimeString('en-US')}`
       //     logger.methods.log('info', item, "##addon## ZAudioClient_init data");
            if (item.responseCommand === 'responseGetAudio') {
                item.buffer = new Float32Array(item.buffer);
       //
            }
            if (item.responseCommand !== 'responseGetAudio') {
                console.log("ZAudioClient_init return ", item)
            }

            mainWindow.webContents.send(item.responseCommand, item)
        })
    }, data.sampleRate);


})

ipcMain.on('createAudioCall', (event, data) => {
    if (!data) {
        data = {}
    }
    const date = new Date()
    data.time = `##addon## createAudioCall -> ${date.toLocaleTimeString('en-US')}`
    data.result=`${result}`
    logger.methods.log('info', data, "##addon## createAudioCall");
    console.log("createAudioCall -> ", data, result)
    // mainWindow.webContents.send("responseCreateAudioCall", {result})
    addon.ZAudioClient_createAudioCall(result, data.developerId, data.userName)
})

ipcMain.on('joinAudioCall', (event, data) => {
    if (!data) {
        data = {}
    }
    // logger.methods.log(`##addon## joinAudioCall ->`, {
    //     msg: {
    //         data: item,
    //         result
    //     }
    // }, "joinAudioCall");
    const date = new Date()
    data.time = `##addon## joinAudioCall -> ${date.toLocaleTimeString('en-US')}`
    data.result = `${result}`
    logger.methods.log('info', data, "##addon## joinAudioCall");
    console.log("joinAudioCall ->", data, result)
    addon.ZAudioClient_joinAudioCall(result, data.conferenceId, data.userName)
})

ipcMain.on('leaveAudioCall', (event, data) => {
    // logger.methods.log(`##addon## leaveAudioCall ->`, {
    //     msg: {
    //         data: item,
    //         result
    //     }
    // }, "leaveAudioCall");
    if (!data) {
        data = {}
    }
    const date = new Date()
    data.time = `##addon## leaveAudioCall -> ${date.toLocaleTimeString('en-US')}`
    data.result = `${result}`
    logger.methods.log('info', data, "##addon## leaveAudioCall");
    console.log("leaveAudioCall ->", data, result)
    addon.ZAudioClient_leaveAudioCall(result)
})

ipcMain.on('intToAll', (event, data) => {
    if (!data) {
        data = {}
    }
    // logger.methods.log(`##addon## intToAll ->`, {
    //     msg: {
    //         data: item,
    //         result
    //     }
    // }, "intToAll");
    const date = new Date()
    data.time = `##addon## intToAll -> ${date.toLocaleTimeString('en-US')}`
    data.result = `${result}`
    logger.methods.log('info', date, "##addon## intToAll");
    console.log("intToAll ->", data, result)
    addon.ZAudioClient_intToAll(result, data.value)
})


ipcMain.on('intToParticipant', (event, data) => {
    // logger.methods.log(`##addon## intToParticipant ->`, {
    //     msg: {
    //         data: item,
    //         result
    //     }
    // }, "intToParticipant");
    const date = new Date()
    data.time = `##addon## intToParticipant -> ${date.toLocaleTimeString('en-US')}`
    data.result = `${result}`
    logger.methods.log('info', date, "##addon## intToParticipant");
    console.log("intToParticipant ->", data, result)
    addon.ZAudioClient_intToParticipant(result, data.value, data.userName)
})

ipcMain.on('stringToParticipant', (event, data) => {
    if (!data) {
        data = {}
    }
    // logger.methods.log(`##addon## stringToParticipant ->`, {
    //     msg: {
    //         data: item,
    //         result
    //     }
    // }, "stringToParticipant");
    const date = new Date()
    data.time = `##addon## stringToParticipant -> ${date.toLocaleTimeString('en-US')}`
    data.result = `${result}`
    logger.methods.log('info', date, "##addon## stringToParticipant");
    console.log("stringToParticipant ->", data, result)
    addon.ZAudioClient_stringToParticipant(result, data.value, data.userName)
})

ipcMain.on('setProperty', (event, data) => {
    if (!data) {
        data = {}
    }
    // logger.methods.log(`##addon## setProperty ->`, {
    //     msg: {
    //         data: item,
    //         result
    //     }
    // }, "setProperty");
    const date = new Date()
    data.time = `##addon## setProperty -> ${date.toLocaleTimeString('en-US')}`
    data.result = `${result}`
    logger.methods.log('info', date, "##addon## setProperty");
    console.log("setProperty ->", data, result)
    addon.ZAudioClient_setProperty(result, data.propertyId, data.value, data.userName)
})

ipcMain.on('sendAudio', (event, data) => {
    if (!data) {
        return;
    }

    const date = new Date()
    data.time = `##addon## sendAudio -> ${date.toLocaleTimeString('en-US')}`
    data.result = `${result}`
    logger.methods.log('info', data, "##addon## sendAudio");
    // console.log("sendAudio ->", data, result)
    addon.ZAudioClient_sendAudio(result, new Float32Array(data.buffer))
})

ipcMain.on('getAudio', async (event, data) => {
    if (!data) {
        data = {}
    }
    // logger.methods.log(`##addon## getAudio ->`, {
    //     msg: {
    //         data: item,
    //         result
    //     }
    // }, "getAudio");
    const date = new Date()
    // data.time = `##addon## getAudio -> ${date.toLocaleTimeString('en-US')}`
    // data.result = `${result}`
    // logger.methods.log('info', date, "##addon## getAudio");
    // console.log("getAudio ->", data, result)
    addon.ZAudioClient_getAudio(result)
})

ipcMain.on('closeAudioCall', (event, data) => {
    if (!data) {
        data = {}
    }
    // logger.methods.log(`##addon## close ->`, {
    //     msg: {
    //         data: item,
    //         result
    //     }
    // }, "close");

    const date = new Date()
    data.time = `##addon## close -> ${date.toLocaleTimeString('en-US')}`
    data.result = `${result}`
    logger.methods.log('info', date, "##addon## close");
    console.log("close ->", data, result)
    addon.ZAudioClient_close(result)
})

ipcMain.on('setAudioUnit', (event, data) => {
    if (!data) {
        data = {}
    }
    // logger.methods.log(`##addon## setAudioUnit ->`, {
    //     msg: {
    //         data: item,
    //         result
    //     }
    // }, "setAudioUnit");
    const date = new Date()
    data.time = `##addon## setAudioUnit -> ${date.toLocaleTimeString('en-US')}`
    data.result = result
    logger.methods.log('info', date, "##addon## setAudioUnit");
    console.log("setAudioUnit ->", data, result)
    addon.ZAudioClient_setAudioUnit(result, data.zaudioUnit)
})

module.exports = {
    appDataPath
};
