let addonApi = require('./addon_api')
let herokuApi = require('./heroku_api')
let utils = require('./utils')
let cli = require('heroku-cli-util')
let co = require('co')

function * deploy (context, heroku) {
  yield utils.checkComposeFileExist()

  let [[configVars, dockheroConfig], appInfo] = yield [
    addonApi.getConfigs(context, heroku),
    herokuApi.getAppInfo(context, heroku)
  ]

  let env = yield addonApi.dockerEnv(dockheroConfig)
  env = Object.assign({HEROKU_APP_URL: appInfo.web_url, HEROKU_APP_NAME: appInfo.name}, configVars, env)
  let args = ['stack', 'deploy', '--compose-file', 'dockhero-compose.yml', 'dockhero'].concat(context.args)

  utils.checkComposeFileValid(env)

  yield utils.runCommandOrExit('docker', args, env)
}

module.exports = {
  topic: 'dh',
  command: 'deploy',
  description: 'docker stack deploy',
  help: 'run docker stack deploy against dockhero machine',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(deploy))
}
