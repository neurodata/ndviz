var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './viewer/app.js',
  output: {
    path: './templates/static/js',
    filename: 'app.bundle.js',
    publicPath: 'http://localhost:8090/build'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
};
