let cli = require('heroku-cli-util')
let co = require('co')
let addonApi = require('./addon_api')
let utils = require('./utils')

function isValidPortNumber (port) {
  return port === (parseInt(port, 10) + '') && port > 0 && port < (1 << 16)
}

function * open (context, heroku) {
  let [configVars] = yield addonApi.getConfigs(context, heroku)
  let argument = context.args[0] || ''
  if (argument && argument !== 'https' && !isValidPortNumber(argument)) {
    throw new Error('Invalid port')
  }

  if (argument === '443' || argument === 'https') {
    return yield cli.open(configVars.DOCKHERO_FLEXIBLE_SSL_URL);
  }

  let url = 'http://' + configVars.DOCKHERO_HOST
  if (argument !== '80' || argument !== '') {
    url += ':' + argument
  }

  yield cli.open(url);
}

module.exports = {
  topic: 'dh',
  command: 'open',
  description: 'dockhero-open',
  help: 'dh:open [<port>|https] - opens dockhero host in a web browser',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(open))
}
