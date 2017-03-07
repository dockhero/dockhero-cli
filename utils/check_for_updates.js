var pjson = require('../package.json');
const cli = require('heroku-cli-util')
const presets = require('./presets')

function * checkForUpdates() {
  let response = yield cli.got(apiUrl('plugin_versions', pjson.version.replace(/\./g, "_"));
  console.log(response.body);
}

module.exports = { checkForUpdates };
