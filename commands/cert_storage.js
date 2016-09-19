let fs = require('fs')
let mkdirp = require('mkdirp')
let targz = require('tar.gz')
let cli = require('heroku-cli-util')

function persistCert (config) {
  let dockerMachinesFolder = process.env['HOME'] + '/.docker/machine/machines/'
  let machineDir = dockerMachinesFolder + config.name

  if (fs.existsSync(machineDir)) {
    return new Promise(resolve => resolve(machineDir))
  }

  console.log('getting certs...')
  mkdirp.sync(machineDir)
  let tgzStream = targz().createWriteStream(machineDir)
  let httpStream = cli.got.stream(config.certs).pipe(tgzStream)

  return new Promise((resolve, reject) => {
    httpStream.on('finish', () => resolve(machineDir))
    httpStream.on('error', reject)
  })
}

module.exports = {
  persistCert
}
