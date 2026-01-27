const path = require('path');
const { basePath } = require('./paths');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

module.exports = {
    entry: [path.resolve(basePath, 'src/index.ts')],
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    output: {
        path: path.resolve(basePath, 'dist'),
        library: {
            name: 'Highlighter',
            type: 'umd',
        },
    },
    resolve: {
        plugins: [new TsconfigPathsPlugin()],
        extensions: ['.ts', '.tsx', '.js'],
    },
};
