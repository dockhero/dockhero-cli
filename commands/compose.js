'use strict'
let common = require('./common.js')
let cli = require('heroku-cli-util')
let fs = require('fs')

module.exports = {
  topic: 'dh',
  command: 'compose',
  description: 'dockhero-compose',
  help: 'run docker-compose against dockhero machine',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command((context, heroku) => {
    let args = ['-f', 'dockhero-compose.yml', '-p', 'dockhero'].concat(context.args)

    return new Promise((resolve, reject) => {
      fs.stat('./dockhero-compose.yml', function (err, stats) {
        if (!err) {
          return resolve()
        } else if (err.code === 'ENOENT') {
          console.log('Please create a dockhero-compose.yml file or use dh:install to get an example')
        }
        reject(err)
      })
    })
    .then(() => Promise.all([
      common.getConfigVars(heroku, context.app),
      common.getAppInfo(heroku, context.app)
    ]))
    .then(values => {
      const configVars = values[0]
      const appInfo = values[1]

      return common.getDockheroConfig(configVars)
      .then(config => common.dockerEnv(config))
      .then(env => Object.assign({HEROKU_APP_URL: appInfo.web_url, HEROKU_APP_NAME: appInfo.name}, configVars, env))
    })
    .then(env => common.runCommand('docker-compose', args, env))
  })
}
