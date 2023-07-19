/**
 * Base webpack config used across other specific configs
 */
const path = require('path');
const webpack = require('webpack');
const packageJson = require('./app/package.json');
// const createStyledComponentsTransformer = require('typescript-plugin-styled-components').default;
// const styledComponentsTransformer = createStyledComponentsTransformer({
//     identifiers: {
//         styled: ['styled', 'typedStyled'] // typedStyled is an additional identifier of styled API
//     }
// });
const appConfig = require("./app/config.json").zz;
appConfig["CURRENT_VERSION"] = packageJson.version;

const {
    dependencies: externals
} = require('./app/package.json');

module.exports = {
    module: {
        loaders: [{
            test: /\.tsx?$/,
            use: [
                {loader: 'react-hot-loader/webpack'},
                {
                    loader: "ts-loader",
                    options: {
                        transpileOnly: true,
                        experimentalWatchApi: true,
                        // getCustomTransformers: () => ({ before: [styledComponentsTransformer] })
                    }
                }
            ],
            exclude: /node_modules/,
        },
            {
                test: /\.node$/,
                // Converts paths from source code and resolved paths from `node-bindings-loader` to use __dirname or process.execPath
                loader: "native-ext-loader",
                options: {
                    rewritePath: `/Applications/${packageJson.name}.app/Contents/Resources`
                }
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.mp3|\.ogg$/,
                exclude: /node_modules/,
                loader: 'file-loader'
            }]
    },

    output: {
        path: path.join(__dirname, 'app'),
        filename: 'bundle.js',

        // https://github.com/webpack/webpack/issues/1114
        libraryTarget: 'commonjs2'
    },

    // https://webpack.github.io/docs/configuration.html#resolve
    resolve: {
        alias: {
            scss: path.resolve(__dirname, "app/assets/styles"),
            ajaxRequests: path.resolve(__dirname, "app/src/ajax-requests"),
            components: path.resolve(__dirname, "app/src/components"),
            containers: path.resolve(__dirname, "app/src/containers"),
            requests: path.resolve(__dirname, "app/src/requests"),
            services: path.resolve(__dirname, "app/src/services"),
            filters: path.resolve(__dirname, "app/src/filters"),
            helpers: path.resolve(__dirname, "app/src/helpers"),
            modules: path.resolve(__dirname, "app/src/modules"),
            configs: path.resolve(__dirname, "app/src/configs"),
            xmpp: path.resolve(__dirname, "app/src/xmpp"),
            config: path.resolve(__dirname, "app/config.json"),
        },
        extensions: [".js", ".jsx", ".ts", ".tsx", ".json", ".css", ".scss", ".node"],
        modules: [
            path.join(__dirname, 'app'),
            'node_modules',
        ],
    },

    plugins: [
        new webpack.DefinePlugin({
            "process.env.APP_CONFIG": JSON.stringify(appConfig)
        })
    ],

    externals: Object.keys(externals || {})
};
