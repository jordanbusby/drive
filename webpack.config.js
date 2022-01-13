/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './bin/front/index.js',

  output: {
    path: path.resolve(__dirname, 'public', 'js'),
    filename: 'bundle.js'
  },
  watch: true,
  watchOptions: {
    ignored: [
      'node_modules', 'src', 'public'
    ]
  }
};
