let cli = require('heroku-cli-util')
let certStorage = require('./cert_storage')
let herokuApi = require('./heroku_api')
let utils = require('./utils')
let ora = require('ora')
let co = require('co')

function* getConfigs(context, heroku) {
  let configVars = yield herokuApi.getConfigVars(context, heroku)
  if (!configVars.DOCKHERO_STAGING_CONFIG_URL) {
    throw new Error(configVarsMissing)
  }

  if (!configVars.DOCKHERO_STAGING_HOST) {
    yield waitForProvision(configVars.DOCKHERO_STAGING_CONFIG_URL + '/status')
    configVars = yield herokuApi.getConfigVars(context, heroku)
  }

  let dockheroConfig = yield cli.got(configVars.DOCKHERO_STAGING_CONFIG_URL, {json: true}).then(response => response.body)
  return [configVars, dockheroConfig]
}

function* waitForProvision(statusUrl, spinner = null) {
  let data = yield cli.got(statusUrl, {json: true}).then(response => response.body);

  if (data.status === 'failed') {
    if (spinner){
      spinner.fail();
    }
    throw new Error('Sorry, add-on provisioning failed. Please remove the add-on and install it once again.');
  }

  if (data.status === 'creating') {
    spinner = spinner || ora().start();
    spinner.text = `Add-on provisioning will finish soon...  ${getMinutesRemaining(data.provision_eta)}`;
    return yield utils.delay(5000).then(() => co(waitForProvision(statusUrl, spinner)));
  }

  if (data.status === 'running') {
    if (spinner){
      spinner.succeed();
    }
    return true;
  }
}

function getMinutesRemaining(eta) {
  let seconds = Math.floor((new Date(eta) - new Date())/1000);
  return seconds < 0 ? 'almost done...' : [Math.floor(seconds / 60), ':', ('0' + (seconds % 60)).slice(-2)].join();
}

function dockerEnv(config) {
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
