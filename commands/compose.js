let addonApi = require('./addon_api')
let herokuApi = require('./heroku_api')
let utils = require('./utils')
let cli = require('heroku-cli-util')
let fs = require('fs')
let co = require('co')

function * checkComposeFileExist () {
  yield new Promise((resolve, reject) => {
    fs.stat('./dockhero-compose.yml', (err, stats) => {
      if (!err) {
        return resolve()
      } else if (err.code === 'ENOENT') {
        reject(new Error('Please create a dockhero-compose.yml file or use dh:install to get an example'))
      }
      reject(err)
    })
  })
}

function * compose (context, heroku) {
  yield checkComposeFileExist()
  let [[configVars, dockheroConfig], appInfo] = yield [
    addonApi.getConfigs(context, heroku),
    herokuApi.getAppInfo(context, heroku)
  ]

  let env = yield addonApi.dockerEnv(dockheroConfig)
  env = Object.assign({HEROKU_APP_URL: appInfo.web_url, HEROKU_APP_NAME: appInfo.name}, configVars, env)
  let args = ['-f', 'dockhero-compose.yml', '-p', 'dockhero'].concat(context.args)

  try {
    yield utils.runCommand('docker-compose1', args, env)
  }
  catch(err) {
    if (err.code == 'ENOENT') {
      cli.error("Couldn't find docker-compose tool installed locally")
      cli.warn("Did you install Docker?")
      cli.warn(`Please see https://docs.docker.com/engine/installation/`)
      process.exit(1)
    }
    throw err
  }
}

module.exports = {
  topic: 'dh',
  command: 'compose',
  description: 'dockhero-compose',
  help: 'run docker-compose against dockhero machine',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(compose))
}
