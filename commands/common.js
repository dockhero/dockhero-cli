'use strict'

let cli = require('heroku-cli-util')
let spawn = require('child_process').spawn
let request = require('request')
let fs = require('fs')
let mkdirp = require('mkdirp')
let targz = require('tar.gz')
let utils = require('./utils')
let co = require('co')
let ora = require('ora')

let configVarsMissing = `Required config vars are missing, perhaps addon provisioning is still in progress
Please use heroku addons:open dockhero to check provisioning status`

function getConfigVars (heroku, app) {
  return heroku.get(`/apps/${app}/config-vars`)
}

function getAppInfo (heroku, app) {
  return heroku.get(`/apps/${app}`)
}

function getDockheroConfig (configVars) {
  return new Promise((resolve, reject) => {
    if (!configVars['DOCKHERO_CONFIG_URL']) {
      throw new Error(configVarsMissing)
    }

    request({uri: configVars['DOCKHERO_CONFIG_URL'], headers: {Accept: '*/*'}}, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        return resolve(JSON.parse(body))
      }
      reject(error)
    })
  })
}

function getConfig (heroku, app) {
  return getConfigVars(heroku, app)
  .then(configVars => {
    return getDockheroConfig(configVars)
    .then(dockheroConfig => Object.assign(configVars, dockheroConfig))
  })
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

function* waitForProvision(statusUrl, spinner = null) {
  let data = yield cli.got(configVars.DOCKHERO_STAGING_CONFIG_URL, {json: true}).then(response => response.body);

  if (data.status === 'failed') {
    if (spinner){
      spinner.fail();
    }
    throw new Error('Sorry, add-on provisioning failed. Please remove the add-on and install it once again.');
  }

  if (data.status === 'creating') {
    spinner = spinner || ora().start();
    spinner.text = `Add-on provisioning will finish soon.....  ${getMinutesRemaining(data.provision_eta)}`;
    return yield utils.delay(5000).then(() => co(waitForProvision(statusUrl, spinner)));
  }

  if (data.status === 'running') {
    if (spinner){
      spinner.succeed();
    }
    return true;
  }
}

function* getConfigs(context, heroku) {
  let configVars = yield heroku.get(`/apps/${context.app}/config-vars`);
  if (!configVars.DOCKHERO_STAGING_CONFIG_URL) {
    throw new Error(configVarsMissing);
  }

  if (!configVars.DOCKHERO_STAGING_HOST) {
    yield waitForProvision(configVars.DOCKHERO_STAGING_CONFIG_URL + '/status');
    configVars = yield heroku.get(`/apps/${context.app}/config-vars`);
  }

  let dockheroConfig = yield cli.got(configVars.DOCKHERO_STAGING_CONFIG_URL, {json: true}).then(response => response.body);
  console.log(dockheroConfig);
  return [configVars, dockheroConfig];
}

function getMinutesRemaining(eta) {
  let seconds = Math.floor((new Date(eta) - new Date())/1000);
  return seconds < 0 ? 'almost done...' : [Math.floor(seconds / 60), ':', ('0' + (seconds % 60)).slice(-2)].join();
}

module.exports = {
  getConfigVars,
  getAppInfo,
  getDockheroConfig,
  getConfig,
  getConfigs,
  persistCert,
  dockerEnv,
  runCommand,
}
