const addonApi = require('./addon_api')
const utils = require('./utils')
const cli = require('heroku-cli-util')
const co = require('co')

function* openRemoteShell(context, heroku) {
  const [, dockheroConfig] = yield addonApi.getConfigs(context, heroku)
  const env = yield addonApi.dockerEnv(dockheroConfig)
  const args = ['run',
    '-v', '/:/root',
    '-it', 'centos',
    'sh', '-c', "chroot /root"
  ]
  yield utils.runCommandOrExit('docker', args, env)
}

module.exports = {
  topic: 'dh',
  command: 'ssh',
  description: 'dockhero-ssh',
  help: 'run interactive shell on dockhero machine',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(openRemoteShell))
}
