let cli = require('heroku-cli-util')
let certStorage = require('./cert_storage')
let herokuApi = require('./heroku_api')
let utils = require('./utils')
let ora = require('ora')
let Promise = require('bluebird')
let fs = Promise.promisifyAll(require('fs'))
let mkdirp = Promise.promisify(require('mkdirp'))

let configVarsMissing = `Required config vars are missing, perhaps addon provisioning is still in progress
Please use heroku addons:open dockhero to check provisioning status`

function * getConfigs (context, heroku) {
  let configVars = yield herokuApi.getConfigVars(context, heroku)
  if (!configVars.DOCKHERO_CONFIG_URL) {
    throw new Error(configVarsMissing)
  }

  if (!configVars.DOCKHERO_HOST) {
    let stateUrl = configVars.DOCKHERO_CONFIG_URL + '/status'
    let spinner = null
    yield waitForProvisioning(getStateProvider(stateUrl), {
      onProgress: eta => {
        spinner = spinner || ora().start()
        spinner.text = `Add-on provisioning will finish soon...  ${getMinutesRemaining(eta)}`
      },
      onSuccess: () => spinner && spinner.succeed(),
      onFailed: status => {
        spinner && spinner.fail()
        throw new Error('Sorry, add-on provisioning failed. Please remove the add-on and install it once again.')
      }
    })
    configVars = yield herokuApi.getConfigVars(context, heroku)
  }

  let dockheroConfig = yield getDockheroConfigCached(configVars.DOCKHERO_CONFIG_URL)
  return [configVars, dockheroConfig]
}

function * waitForProvisioning (stateProvider, callbacks) {
  while (true) {
    let state = yield stateProvider()
    switch (state.status) {
      case 'creating':
        callbacks.onProgress(state.provision_eta)
        yield utils.delay(5000)
        break
      case 'running':
        callbacks.onSuccess()
        return true
      case 'failed':
        callbacks.onFailed()
        return false
      default:
        throw new Error(`Invalid status: ${state.status}`)
    }
  }
}

function * getDockheroConfigCached (configUrl) {
  const cacheFile = `/tmp/dockhero/${configUrl.replace(/\W+/g, '_')}.tmp`

  const cacheExists = yield fs.statAsync(cacheFile).then(() => true).catch(() => false)
  if (!cacheExists) {
    const config = yield cli.got(configUrl, {json: true}).then(response => response.body)
    mkdirp('/tmp/dockhero/').then(() => fs.writeFileAsync(cacheFile, config))
    return config
  }
  return yield fs.readFileAsync(cacheFile)
}

function getStateProvider (stateUrl) {
  return () => cli.got(stateUrl, {json: true}).then(response => response.body)
}

function getMinutesRemaining (eta) {
  let seconds = Math.floor((new Date(eta) - new Date()) / 1000)
  if (seconds < 0) {
    return 'almost done...'
  }
  return [Math.floor(seconds / 60), ':', ('0' + (seconds % 60)).slice(-2)].join('')
}

function dockerEnv (config) {
  return certStorage.persistCert(config).then(certPath => {
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
  getConfigs,
  dockerEnv
}
