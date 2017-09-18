let spawn = require('child_process').spawn
let cli = require('heroku-cli-util')
let fs = require('fs')
let _ = require('lodash')

const PLACEHOLDER_REGEXP = new RegExp(/\$\{[\w\d_]+\}/, 'g')

function delay (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}

function runCommand (command, args = [], env = {}) {
  let dockerEnv = Object.assign({}, process.env, env)
  let child = spawn(command, args, {env: dockerEnv, stdio: [0, 1, 2]})

  return new Promise((resolve, reject) => {
    child.on('close', resolve)
    child.on('error', reject)
  })
}

function * runCommandOrExit (command, args, env) {
  try {
    yield runCommand(command, args, env)
  } catch (err) {
    if (err.code === 'ENOENT') {
      cli.error(`Couldn't find ${command} binary installed locally`)
      cli.warn(`Please see https://docs.docker.com/engine/installation/`)
      process.exit(1)
    }
    throw err
  }
}

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

module.exports = {
  delay,
  runCommand,
  runCommandOrExit,
  checkComposeFileExist,
  checkComposeFileValid
}
