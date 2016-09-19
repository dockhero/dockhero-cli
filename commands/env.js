let addonApi = require('./addon_api')
let cli = require('heroku-cli-util')
let co = require('co')

function* env(context, heroku) {
  let [configVars, dockheroConfig] = yield addonApi.getConfigs(context, heroku)
  let env = yield addonApi.dockerEnv(dockheroConfig)
  Object.keys(env).forEach(key => {
    console.log(`export ${key}="${env[key]}"`)
  })
  console.log('# Run this command to configure your shell:')
  console.log('# eval $(heroku dh:env)')
}

module.exports = {
  topic: 'dh',
  command: 'env',
  description: 'dockhero-env',
  help: 'prints env config, mimics docker-machine env',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(env))
}
