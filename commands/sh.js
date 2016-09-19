let cli = require('heroku-cli-util')
let co = require('co')
let addonApi = require('./addon_api')
let utils = require('./utils')

let infoMessage = `Now DOCKER is configured with Dockhero's Swarm endpoint
This is a temporary change affecting the current shell session only`

function * sh (context, heroku) {
  let [, dockheroConfig] = yield addonApi.getConfigs(context, heroku)
  let env = yield addonApi.dockerEnv(dockheroConfig)
  console.log(infoMessage)
  yield utils.runCommand(process.env['SHELL'], context.args, env)
}

module.exports = {
  topic: 'dh',
  command: 'sh',
  description: 'dockhero-shell',
  help: 'run shell with dockhero env variables',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(sh))
}
