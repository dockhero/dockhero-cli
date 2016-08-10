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

        let protocol = 'http'
        if (argument === '443' || argument === 'https') {
          protocol += 's'
        }

        let port = `:${argument}`
        if (protocol === 'https' || port === ':80' || port === ':') {
          port = ''
        }

        let host = protocol === 'https'
          ? config.DOCKHERO_FLEXIBLE_SSL_HOST
          : config.DOCKHERO_HOST

        common.runCommand('open', [`${protocol}://${host}${port}`], {})
      })
  })
}
