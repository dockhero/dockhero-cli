let cli = require('heroku-cli-util')
let fs = require('fs')
let co = require('co')

const dockheroComposeV1 = `
web:
  image: dockhero/dockhero-docs:hello
  ports:
    - "80:8080"
`

const dockheroComposeV2 = `
version: '2'
services:
  web:
    image: dockhero/dockhero-docs:hello
    ports:
      - "80:8080"
`

function * install (context, heroku) {
  const dockheroCompose = context.args[0] === 'v2'
    ? dockheroComposeV2
    : dockheroComposeV1
  yield new Promise((resolve, reject) => {
    fs.writeFile('./dockhero-compose.yml', dockheroCompose.trimLeft(), function (err) {
      if (err) {
        reject(err)
      }
      console.log('Sample dockhero-compose.yml file has been generated')
      resolve()
    })
  })
}

module.exports = {
  topic: 'dh',
  command: 'install',
  description: 'dockhero-install',
  help: 'dh:install - generates sample dockhero-compose.yml file',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command(co.wrap(install))
}
