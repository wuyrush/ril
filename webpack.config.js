const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin"),
  CopyWebpackPlugin = require("copy-webpack-plugin"),
  HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');

module.exports = {
  mode: "production",
  // only bundle the frontend since we need to access some backend variables from frontend, and
  // webpack bundling in production mode will alter the name of those variables(due to minification
  // etc)
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
        from: './node_modules/bulma/css/bulma.min.css',
        // the root dir of dest is set to that of output already
      },
      {
        from: './src/js/background.js',
      },
      {
        from: './src/manifest.json',
      },
      {
        from: './src/icons/page*',
        flatten: true,
      },
      {
        from: './node_modules/webextension-polyfill/dist/browser-polyfill.min.js',
      },
      {
        from: './node_modules/fuse.js/dist/fuse.min.js',
      },
    ]),
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "index.html",
      chunks: ['popup.js'],
    }),
    // so that we don't need to manually reference assets in our html markup
    new HtmlWebpackIncludeAssetsPlugin({
      assets: ['bulma.min.css', 'browser-polyfill.min.js', 'popup.js'],
      append: false,
      files: ['index.html']
    })
  ]
}
