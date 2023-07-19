const appConfig = require("./config.json")[process.argv[5]];

module.exports = {
        "productName": appConfig.APP_NAME,
        "appId": appConfig.BUNDLE_ID,
        "protocols": {
            "name": "zangi.dl",
            "schemes": [
                "zangi"
            ]
        },
        "afterSign": "./afterSignHook.js",
        "copyright": `Copyright © year 2019, ${appConfig.COPYRIGHT}`,
        "publish": [
            {
                "provider": "s3",
                "bucket": appConfig.BUCKETS.desktopReleases,
                "region": appConfig.S3.region,
                "path": appConfig.S3.path
            }
        ],
        "mac": {
            "extendInfo": {
                "CFBundleURLTypes": [
                    "zangi"
                ],
                "NSMicrophoneUsageDescription": "Need microphone access",
                "NSCameraUsageDescription": "Need camera access"
            },
            "hardenedRuntime": true,
            "entitlements": "./build/entitlements.mac.plist",
            "entitlementsInherit": "./build/entitlements.mac.plist",
            "gatekeeperAssess": false
        },
        "dmg": {
            "contents": [
                {
                    "x": 410,
                    "y": 150,
                    "type": "link",
                    "path": "/Applications"
                },
                {
                    "x": 130,
                    "y": 150,
                    "type": "file"
                }
            ]
        },
        "asar": true,
        "files": [
            "dist/",
            "node_modules/",
            "runtime/",
            "app.html",
            "callPopup.html",
            "loader.html",
            "newCallPopup.html",
            "js/",
            "assets/",
            "preload.js",
            "main.js",
            "main.js.map",
            "package.json",
            "config.json",
            "!**/*.node",
        ],
        "extraResources": [
            {
                "from": "app/icons/",
                "to": "."
            },
            {
                "from": "node_modules/zangi-addon/build/Release",
                "to": "/Applications/Zangi.app/Contents/Resources",
                "filter": "*.node"
            }
        ],
        "directories": {
            "buildResources": "resources",
            "output": "release"
        },
        "win": {
            "target": "nsis"
        },
        "linux": {
            "target": [
                "deb",
                "AppImage"
            ]
        },
        "nsis": {
            "deleteAppDataOnUninstall": true,
            "oneClick": false,
            "perMachine": true,
            "allowToChangeInstallationDirectory": true,
            "displayLanguageSelector": true
        }
};
