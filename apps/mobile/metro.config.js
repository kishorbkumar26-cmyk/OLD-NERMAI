const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders.push(workspaceRoot);

// Add html and txt to asset extensions so they can be required() by React Native.
// 'txt' is needed for the PDF.js viewer scripts (pdf.min.js.txt, pdf.worker.min.js.txt)
// which are renamed from .js to prevent Metro from transpiling them as source modules.
config.resolver.assetExts.push('html', 'txt');

module.exports = config;
