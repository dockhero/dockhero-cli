let cli = require('heroku-cli-util')
let addonApi = require('./addon_api')
let co = require('co')

function * wait (context, heroku) {
  yield addonApi.getConfigs(context, heroku)
}

module.exports = {
  topic: 'dh',
  command: 'wait',
  description: 'dockhero-wait',
  help: 'block while dockhero machine is being provisioned',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(wait))
}
