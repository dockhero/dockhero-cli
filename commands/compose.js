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
        fs.stat('./dockhero-compose.yml', function(err, stats) {
          if (!err) {
            resolve()
          }
          else if (err.code == 'ENOENT') {
            console.log('Please create a dockhero-compose.yml file or use dh:install to get a sample one')
          }
          else {
            return reject(err);
          }
        })
      })
      .then(() => common.getConfig(heroku, context.app))
      .then(config => common.dockerEnv(config))
      .then(env => common.runCommand('docker-compose', args, env))
  })
}
