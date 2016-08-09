'use strict'
let common = require('./common.js')
let cli = require('heroku-cli-util')

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

    return common.getConfig(heroku, context.app)
      .then(config => common.dockerEnv(config))
      .then(env => common.runCommand('docker-compose', args, env))
  })
}
