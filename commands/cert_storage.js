const fs = require('fs')
const mkdirp = require('mkdirp')
const tar = require('tar')
const cli = require('heroku-cli-util')

function persistCert(config) {
  let dockerMachinesFolder = process.env['HOME'] + '/.docker/machine/machines/'
  let machineDir = dockerMachinesFolder + config.name

  if (fs.existsSync(machineDir + "/key.pem")) {
    return new Promise(resolve => resolve(machineDir))
  }

  mkdirp.sync(machineDir)
  const tgzStream = tar.x({ C: machineDir })
  const httpStream = cli.got.stream(config.certs).pipe(tgzStream)

  return new Promise((resolve, reject) => {
    httpStream.on('finish', () => resolve(machineDir))
    httpStream.on('error', reject)
  })
}

module.exports = {
  persistCert
}
