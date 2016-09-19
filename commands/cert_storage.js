let fs = require('fs')
let mkdirp = require('mkdirp')
let request = require('request')
let targz = require('tar.gz')

function persistCert (config) {
  let dockerMachinesFolder = process.env['HOME'] + '/.docker/machine/machines/'
  let machineDir = dockerMachinesFolder + config.name

  if (fs.existsSync(machineDir)) {
    return new Promise(resolve => resolve(machineDir))
  }

  console.log('getting certs...')
  mkdirp.sync(machineDir)
  let read = request.get(config.certs)
  let write = targz().createWriteStream(machineDir)
  let stream = read.pipe(write)

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(machineDir))
    stream.on('error', reject)
  })
}

module.exports = {
  persistCert
}
