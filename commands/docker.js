'use strict'
let common = require('./common.js')
let cli = require('heroku-cli-util')

module.exports = {
  topic: 'dh',
  command: 'docker',
  description: 'dockhero-docker',
  help: 'run docker against dockhero machine',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command((context, heroku) => {
    return heroku.get(`/apps/${context.app}/config-vars`)
      .then(config => common.prepareEnv(config))
      .then(env => common.runCommand('docker', context.args, env))
  })
}
