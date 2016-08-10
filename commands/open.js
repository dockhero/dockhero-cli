'use strict'
let common = require('./common.js')
let cli = require('heroku-cli-util')

function isValidPortNumber (port) {
  return port === (parseInt(port, 10) + '') && port > 0 && port < (1 << 16)
}

module.exports = {
  topic: 'dh',
  command: 'open',
  description: 'dockhero-open',
  help: 'dh:open [<port>|https] - opens dockhero host in a web browser',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command((context, heroku) => {
    return common.getConfig(heroku, context.app)
      .then(config => {
        let argument = context.args[0] || ''
        if (argument && argument !== 'https' && !isValidPortNumber(argument)) {
          throw new Error('Invalid port')
        }

        if (argument === '443' || argument === 'https') {
          return common.runCommand('open', [config.DOCKHERO_FLEXIBLE_SSL_URL], {})
        }

        let url = 'http://' + config.DOCKHERO_HOST
        if (argument !== '80' || argument !== '') {
          url += ':' + argument
        }

        common.runCommand('open', [url], {})
      })
  })
}
