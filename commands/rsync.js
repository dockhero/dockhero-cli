let addonApi = require('./addon_api')
let certStorage = require('./cert_storage')
let utils = require('./utils')
let cli = require('heroku-cli-util')
let co = require('co')

let prefix = 'dh://'

function * openRsync (context, heroku) {
  let [, dockheroConfig] = yield addonApi.getConfigs(context, heroku)
  let certPath = yield certStorage.persistCert(dockheroConfig)

  let volumePrefix = `${dockheroConfig.ssh_user}@${dockheroConfig.ip}:/var/lib/docker/volumes/`
  let volumeSuffix = '/_data'

  let fromPath = context.args[0].indexOf(prefix)==0 ? context.args[0].replace('dh://',volumePrefix)+volumeSuffix : context.args[0]
  let toPath = context.args[1].indexOf(prefix)==0 ? context.args[1].replace('dh://',volumePrefix)+volumeSuffix : context.args[1]

  let args = [
    '-avz',
    '-e',
    `"ssh -i ${certPath}/id_rsa"`,
    '--progress',
    '--rsync-path="sudo rsync"',
    fromPath,
    toPath
  ].concat(context.args.slice(2))

  yield utils.runCommand('rsync', args, {}, {shell: true})
}

module.exports = {
  topic: 'dh',
  command: 'rsync',
  description: 'dockhero-rsync',
  help: 'run rsync to dockhero machine',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(openRsync))
}
