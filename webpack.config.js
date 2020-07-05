const path = require('path');

// const isProduction = typeof NODE_ENV !== 'undefined' && NODE_ENV === 'production';
isProduction = false;
const mode = isProduction ? 'production' : 'development';
const devtool = isProduction ? false : 'inline-source-map';
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
    {
        entry: './src/app/components/index.tsx',
        target: 'web',
        mode,
        devtool,
        devServer: {
            contentBase: './',
            hot: true,
            inline: true
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                    exclude: /node_modules/,
                    options: {
                        compilerOptions: {
                            "sourceMap": !isProduction,
                        }
                    }
                }
            ]
        },
        resolve: {
            extensions: [ '.tsx', '.ts', '.js' ]
        },
        output: {
            filename: 'index.js',
            path: path.join(__dirname, 'dist', 'public')
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './index.html'
            })
        ]
    }
];