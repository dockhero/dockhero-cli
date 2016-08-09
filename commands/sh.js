'use strict'
let common = require('./common.js')
let cli = require('heroku-cli-util')

let infoMessage = `Now DOCKER is configured with Dockhero's Swarm endpoint
This is a temporary change affecting the current shell session only`

module.exports = {
  topic: 'dh',
  command: 'sh',
  description: 'dockhero-shell',
  help: 'run shell with dockhero env variables',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command((context, heroku) => {
    return common.getConfig(heroku, context.app)
      .then(config => common.dockerEnv(config))
      .then(env => {
        console.log(infoMessage)
        common.runCommand(process.env['SHELL'], context.args, env)
      })
  })
}
