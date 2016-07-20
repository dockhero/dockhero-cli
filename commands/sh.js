'use strict'
let common = require('./common.js')
let cli = require('heroku-cli-util')

module.exports = {
  topic: 'dh',
  command: 'sh',
  description: 'dockhero-shell',
  help: 'run shell with dockhero env variables',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command((context, heroku) => {
    return heroku.get(`/apps/${context.app}/config-vars`)
      .then(config => common.prepareEnv(config))
      .then(env => common.runCommand(process.env['SHELL'], context.args, env))
  })
}
