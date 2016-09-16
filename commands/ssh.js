'use strict'
let common = require('./common.js');
let cli = require('heroku-cli-util');
let co = require('co');

function* openSsh(context, heroku) {
  let [configVars, dockheroConfig] = yield common.getConfigs(context, heroku);
  let certPath = yield common.persistCert(dockheroConfig);

  let args = [`${dockheroConfig.ssh_user}@${dockheroConfig.ip}`, '-i', `${certPath}/id_rsa`];
  yield common.runCommand('ssh', args);
}

module.exports = {
  topic: 'dh',
  command: 'ssh',
  description: 'dockhero-ssh',
  help: 'run ssh to dockhero machine',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(openSsh))
}
