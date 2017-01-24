let addonApi = require('./addon_api')
let herokuApi = require('./heroku_api')
let utils = require('./utils')
let cli = require('heroku-cli-util')
let fs = require('fs')
let co = require('co')
let _ = require('lodash')

const PLACEHOLDER_REGEXP = new RegExp(/\$\{[\w\d_]+\}/, 'g')

function * checkComposeFileExist () {
  yield new Promise((resolve, reject) => {
    fs.stat('./dockhero-compose.yml', (err, stats) => {
      if (!err) {
        return resolve()
      } else if (err.code === 'ENOENT') {
        reject(new Error('Please create a dockhero-compose.yml file or pick one from https://github.com/dockhero/generators'))
      }
      reject(err)
    })
  })
}

function checkComposeFileValid (herokuEnv) {
  const contents = fs.readFileSync('./dockhero-compose.yml', 'utf8')
  const placeholders = contents.match(PLACEHOLDER_REGEXP)
  const badPlaceholders = _.filter(placeholders, function (ph) {
    const varName = ph.substr(2, ph.length - 3)
    return !_.has(process.env, varName) && !_.has(herokuEnv, varName)
  })

  if (badPlaceholders.length > 0) {
    cli.warn('Please set the following variables in Heroku Config:')
    _.each(badPlaceholders, function (ph) {
      cli.warn('--> ' + ph)
    })
    cli.warn('See https://docs.dockhero.io/features/variables-substitution.html for more help')
    throw new Error('dockhero-compose.yml references some undefined environment variables. Aborted.')
  }
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

  checkComposeFileValid(env)

  try {
    yield utils.runCommand('docker-compose', args, env)
  } catch (err) {
    if (err.code === 'ENOENT') {
      cli.error("Couldn't find docker-compose binary installed locally")
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
