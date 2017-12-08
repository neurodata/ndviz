/**
 * @license
 * Copyright 2016 Google Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpackLinkPlugin = require('webpack-link');
const original_webpack_helpers = require(path.resolve('node_modules/neuroglancer/config/webpack_helpers'));
const resolveReal = require(path.resolve('node_modules/neuroglancer/config/resolve_real'));
const AliasPlugin = require('./webpack_alias_plugin');

function modifyViewerOptions(options) {
  options = options || {};
  options.resolveLoaderRoots = [
    ...(options.resolveLoaderRoots || []),

    // Allow loader modules to be resolved from node_modules directory of this
    // project in addition to the node_modules directory of neuroglancer.
    resolveReal(__dirname, '../node_modules')
  ];

  // This references the tsconfig.json file of this project, rather than of
  // neuroglancer.
  options.tsconfigPath = resolveReal(__dirname, '../tsconfig.json');

  // This references the main.ts of this project, rather than of
  // neuroglancer.
  options.frontendModules = options.python ? options.frontendModules : [resolveReal(__dirname, '../client/main.ts')];

  // Custom supported layers for ndviz 
  options.supportedLayers = [
    'ndviz/image_user_layer',
    'ndviz/vector_graphics_user_layer',
    'ndviz/segmentation_user_layer',
    'ndviz/single_mesh_user_layer',
    'ndviz/annotation/user_layer',
  ];

  // Custom htmlPlugin for all builds
  options.htmlPlugin = new HtmlWebpackPlugin({
    template: resolveReal(__dirname, '../client/index.html'), 
  });

  return options;
}

function getViewerConfig(options) {
  let config = original_webpack_helpers.getViewerConfig(modifyViewerOptions(options));

  // Add JSX support by overwriting the resolved extensions list 
  config[0]['resolve']['extensions'] = [ '.ts', '.tsx', '.js', '.jsx' ];

  // Add JSX/TSX loaders 
  config[0]['module']['rules'][0]['test'] = /\.tsx?$/;
  config[0]['module']['rules'].push({ test: /\.jsx$/, loader: 'babel-loader', query: { presets: ['react'] } });

  return config; 
};

function makePythonClientOptions(options) {
  const srcDir = resolveReal(__dirname, '../client');
  options = Object.assign({}, options);
  options.extraDataSources = [...(options.extraDataSources || []),
                              {source: 'neuroglancer/datasource/python', register: null},
                             ];
  options.frontendModules = [resolveReal(__dirname, '../client/main_python.ts')];
  options.registerCredentials = false;
  options.python = true;
  return options;
}

function getViewerConfigFromEnv(options, env) {
  env = env || 'dev';
  const envParts = new Set(env.split('-'));
  options = Object.assign({}, options);
  if (envParts.has('min')) {
    options.minify = true;
  }
  if (envParts.has('python')) {
    options = makePythonClientOptions(options);
  }
  
  return getViewerConfig(options);
}

exports.getViewerConfig = getViewerConfig;
exports.getViewerConfigFromEnv = getViewerConfigFromEnv;
