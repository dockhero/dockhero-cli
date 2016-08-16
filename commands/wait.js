'use strict'
let cli = require('heroku-cli-util')

module.exports = {
  topic: 'dh',
  command: 'wait',
  description: 'dockhero-wait',
  help: 'block while dockhero machine is being provisioned',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(function (context, heroku) {
    let initial = true
    const checkVars = () => {
      return heroku.get(`/apps/${context.app}/config-vars`)
      .then(config => {
        if (initial && !config.DOCKHERO_HOST) {
          console.log('Your Docker machine is being deployed...')
        }
        initial = false
        if (config.DOCKHERO_HOST) {
          console.log('Your Docker machine was deployed successfully')
          return true
        }

        return new Promise(resolve => setTimeout(() => { resolve() }, 10000))
          .then(() => { return checkVars() })
      })
    }
    return checkVars()
  })
}
