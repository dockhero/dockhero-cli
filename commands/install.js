'use strict'
let cli = require('heroku-cli-util')
let fs = require('fs')

const dockheroComposeYml = `
version: '2'
services:
  web:
    image: dockhero/dockhero-docs:hello
    ports:
      - "80:8080"
`

module.exports = {
  topic: 'dh',
  command: 'install',
  description: 'dockhero-install',
  help: 'dh:install - generates sample dockhero-compose.yml file',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command((context, heroku) => {
    return new Promise((resolve, reject) => {
      fs.writeFile('./dockhero-compose.yml', dockheroComposeYml.trim(), function (err) {
        if (err) {
          reject(err)
        }
        console.log('Sample dockhero-compose.yml file has been generated')
        resolve()
      })
    })
  })
}
