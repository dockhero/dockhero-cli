'use strict'

let cli = require('heroku-cli-util')
let spawn = require('child_process').spawn
let request = require('request')
let fs = require('fs')
let mkdirp = require('mkdirp')
let targz = require('tar.gz')

let configVarsMissing = `Required config vars are missing, perhaps addon provisioning is still in progress
Please use heroku addons:open dockhero to check provisioning status`

function getConfig (heroku, app) {
  return heroku.get(`/apps/${app}/config-vars`)
    .then(config => new Promise((resolve, reject) => {
      if (!config['DOCKHERO_CONFIG_URL']) {
        throw new Error(configVarsMissing)
      }

      request({uri: config['DOCKHERO_CONFIG_URL'], headers: {Accept: '*/*'}}, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          resolve(JSON.parse(body))
        } else {
          reject(error)
        }
      })
    }))
}

function persistCert (config) {
  let dockerMachinesFolder = process.env['HOME'] + '/.docker/machine/machines/'
  let machineDir = dockerMachinesFolder + config.name

  if (fs.existsSync(machineDir)) {
    return new Promise(resolve => resolve(machineDir))
  }

  cli.log('getting certs...')
  mkdirp.sync(machineDir)
  let read = request.get(config.certs)
  let write = targz().createWriteStream(machineDir)
  let stream = read.pipe(write)

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(machineDir))
    stream.on('error', reject)
  })
}

function runCommand (command, args = [], env = {}) {
  let dockerEnv = Object.assign({}, process.env, env)
  let child = spawn(command, args, {env: dockerEnv, stdio: [0, 1, 2]})

  let promise = new Promise((resolve, reject) => {
    child.on('close', resolve)
    child.on('error', reject)
  })

  return promise
}

function dockerEnv (config) {
  return persistCert(config).then(certPath => {
    let env = {
      DOCKER_HOST: config.docker_host,
      DOCKER_CERT_PATH: certPath,
      DOCKER_MACHINE_NAME: config.name,
      DOCKER_TLS_VERIFY: '1'
    }

    return env
  })
}

module.exports = {
  getConfig,
  persistCert,
  dockerEnv,
  runCommand
}
