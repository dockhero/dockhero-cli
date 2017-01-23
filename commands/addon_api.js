const cli = require('heroku-cli-util')
const certStorage = require('./cert_storage')
const herokuApi = require('./heroku_api')
const utils = require('./utils')
const ora = require('ora')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const mkdirp = Promise.promisify(require('mkdirp'))
const Url = require('url')

const configVarsMissing = `ERROR: DOCKHERO_CONFIG_URL is not found. Please make sure dockhero plugin is successfully installed and try again.`
const cacheTtl = 8 * 60 * 60 * 1000

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
        yield utils.delay(500)
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
  const cacheFile = `/tmp/dockhero/${Url.parse(configUrl).path.replace(/\W+/g, '')}.tmp`

  const cacheStats = yield fs.statAsync(cacheFile).catch(() => null)
  if (!cacheStats || (new Date() - cacheStats.mtime) > cacheTtl) {
    const config = yield cli.got(configUrl, {json: true}).then(response => response.body)
    mkdirp('/tmp/dockhero/').then(() => fs.writeFileAsync(cacheFile, JSON.stringify(config)))
    return config
  }
  return yield fs.readFileAsync(cacheFile).then(data => JSON.parse(data))
}

function getState (stateUrl, cache) {
  return cli.got(stateUrl, {json: true})
  .then(response => response.body)
  .then(state => {
    cache.lastCheck = new Date()
    cache.state = state
    return state
  })
}

function getStateProvider (stateUrl) {
  let cache = {}
  const checkPeriod = 5 * 1000
  return () => {
    if (cache.state) {
      if (new Date() - cache.lastCheck > checkPeriod) {
        getState(stateUrl, cache)
      }
      return Promise.resolve(cache.state)
    }

    if (!cache.state) {
      return getState(stateUrl, cache)
    }
  }
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
