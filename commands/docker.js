'use strict'

let cli = require('heroku-cli-util')
let spawn = require('child_process').spawn
let request = require('request')
let fs = require('fs')
let mkdirp = require('mkdirp')
let targz = require('tar.gz')

let composeFile = 'dockhero-compose.yml'

function docker(args, env) {
  let dockerEnv = Object.assign({}, process.env, env)
  let child = spawn('docker', args, {env: dockerEnv, stdio: [0,1,2]})

  let promise = new Promise((resolve, reject) => {
    child.on("close", resolve)
    child.on("error", reject)
  })

  return promise
}

function prepare_env(config) {
  if(!config['DOCKHERO_CERT_PATH'] || !config['DOCKHERO_HOST'] || !config['DOCKHERO_MACHINE_NAME'])
    throw new Error("Some environment variables missing, please attach dockhero addon first")

  let dockerMachinesFolder = process.env['HOME'] + '/.docker/machine/machines/'
  let machineName = config['DOCKHERO_MACHINE_NAME']
  let machineDir = dockerMachinesFolder + machineName

  let env = {
    DOCKER_HOST: config['DOCKHERO_HOST'],
    DOCKER_CERT_PATH: machineDir,
    DOCKER_MACHINE_NAME: machineName,
    DOCKER_TLS_VERIFY: '1'
  }

  if (!fs.existsSync(machineDir)){
    cli.log('getting certs...')
    mkdirp.sync(machineDir)
    let read = request.get(config['DOCKHERO_CERT_PATH'])
    let write = targz().createWriteStream(machineDir)
    let stream = read.pipe(write)

    let promise = new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(env));
    })
    return promise
  }

  return env
}

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
      .then(config => prepare_env(config))
      .then(env => docker(context.args, env))
  })
}
