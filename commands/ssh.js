let addonApi = require('./addon_api')
let certStorage = require('./cert_storage')
let utils = require('./utils')
let cli = require('heroku-cli-util')
let co = require('co')

function * openSsh (context, heroku) {
  let [, dockheroConfig] = yield addonApi.getConfigs(context, heroku)
  let certPath = yield certStorage.persistCert(dockheroConfig)

  let args = [`${dockheroConfig.ssh_user}@${dockheroConfig.ip}`, '-i', `${certPath}/id_rsa`]
  yield utils.runCommand('ssh', args)
}

module.exports = {
  topic: 'dh',
  command: 'ssh',
  description: 'dockhero-ssh',
  help: 'run ssh to dockhero machine',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(openSsh))
}
