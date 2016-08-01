'use strict'
let common = require('./common.js')
let cli = require('heroku-cli-util')

module.exports = {
  topic: 'dh',
  command: 'env',
  description: 'dockhero-env',
  help: 'prints env config, mimics docker-machine env',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command((context, heroku) => {
    return common.getConfig(heroku, context.app)
      .then(config => common.dockerEnv(config))
      .then(env => {
        Object.keys(env).forEach(key => {
          console.log(`export ${key}="${env[key]}"`)
        })
        console.log('# Run this command to configure your shell:')
        console.log('# eval $(heroku dh:env)')
      })
  })
}
