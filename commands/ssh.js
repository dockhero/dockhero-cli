'use strict'
let common = require('./common.js')
let cli = require('heroku-cli-util')

module.exports = {
  topic: 'dh',
  command: 'ssh',
  description: 'dockhero-ssh',
  help: 'run ssh to dockhero machine',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command((context, heroku) => {
    return common.getConfig(heroku, context.app).then(config => {
      return common.persistCert(config).then(certPath => {
        let args = [`${config.ssh_user}@${config.ip}`, '-i', `${certPath}/id_rsa`]
        return common.runCommand('ssh', args)
      })
    })
  })
}
