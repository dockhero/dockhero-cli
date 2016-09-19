let addonApi = require('./addon_api')
let utils = require('./utils')
let cli = require('heroku-cli-util')
let co = require('co')

function * docker (context, heroku) {
  let [, dockheroConfig] = yield addonApi.getConfigs(context, heroku)
  let env = yield addonApi.dockerEnv(dockheroConfig)
  yield utils.runCommand('docker', context.args, env)
}

module.exports = {
  topic: 'dh',
  command: 'docker',
  description: 'dockhero-docker',
  help: 'run docker against dockhero machine',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(docker))
}
