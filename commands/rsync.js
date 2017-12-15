let addonApi = require('./addon_api')
let certStorage = require('./cert_storage')
let utils = require('./utils')
let cli = require('heroku-cli-util')
let co = require('co')

function replacePrefix (dockheroConfig, arg) {
  let volumePrefix = `${dockheroConfig.ssh_user}@${dockheroConfig.ip}:/var/lib/docker/volumes/`
  return arg.indexOf('dh://') === 0 ? arg.replace('dh://', volumePrefix) + '/_data' : arg
}

function checkExitCode (code) {
  if (code === 127) {
    cli.error('rsync binary was not found in $PATH. Is rsync client installed on your computer?')
    process.exit(1)
  }
}

function * openRsync (context, heroku) {
  let [, dockheroConfig] = yield addonApi.getConfigs(context, heroku)
  let certPath = yield certStorage.persistCert(dockheroConfig)

  let args = [
    '-avz',
    '-e',
    `"ssh -i ${certPath}/id_rsa"`,
    '--progress',
    '--rsync-path="sudo rsync"',
    replacePrefix(dockheroConfig, context.args[0]),
    replacePrefix(dockheroConfig, context.args[1])
  ].concat(context.args.slice(2))

  yield utils.runCommand('rsync', args, {}, {shell: true}).then(checkExitCode)
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
