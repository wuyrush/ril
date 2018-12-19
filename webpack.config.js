const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin"),
  CopyWebpackPlugin = require("copy-webpack-plugin"),
  HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');

module.exports = {
  mode: "production",
  entry: "./src/js/popup.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "popup.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader"
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "css-loader"
          }
        ]
      },
    ]
  },
  plugins: [
    // copy over assets from other places
    // https://github.com/webpack-contrib/copy-webpack-plugin#to
    new CopyWebpackPlugin([
      {
        from: "./node_modules/bulma/css/bulma.min.css",
        // the root dir of dest is set to that of output already
      },
      {
        from: "./src/js/background.js",
        // the root dir of dest is set to that of output already
      },
      {
        from: "./src/manifest.json",
        // the root dir of dest is set to that of output already
      }
    ]),
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "index.html"
    }),
    // so that we don't need to manually reference assets in our html markup
    new HtmlWebpackIncludeAssetsPlugin({
      assets: ['bulma.min.css', 'popup.js'],
      append: true,
      files: ['index.html']
    })
  ]
}
