const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = env => [
  {
    entry: "./src/app/components/index.tsx",
    target: "web",
    mode: env.production ? "production" : "development",
    devtool: env.production ? false : "inline-source-map",
    devServer: {
      contentBase: "./",
      hot: true,
      inline: true
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          exclude: /node_modules/,
          options: {
            compilerOptions: {
              sourceMap: !env.production
            }
          }
        }
      ]
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"]
    },
    optimization: {
      minimizer: env.production
        ? [
            () => {
              return () => ({
                terserOptions: {
                  mangle: {
                    reserved: ["Td", "Tr", "Th", "Thead"]
                  }
                }
              });
            }
          ]
        : []
    },
    output: {
      filename: "index.js",
      path: path.join(__dirname, "dist", "public")
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./index.html"
      })
    ]
  }
];
