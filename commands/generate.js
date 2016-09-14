'use strict'
let common = require('./common.js')
let cli = require('heroku-cli-util')
let co  = require('co')
let fs = require('fs')

const generatorsUrl = 'https://github.com/dockhero/generators/'
const rawFilesUrl = 'https://raw.githubusercontent.com/dockhero/generators/master/'
const readmeUrlPrefix = generatorsUrl + 'blob/master/'

class GithubReader {
  constructor(generatorName) {
    this.generatorName = generatorName
  }

  rawFileUrl(fileName) {
    return rawFilesUrl + this.generatorName + '/' + fileName
  }

  readmeUrl() {
    return generatorsUrl + "tree/master/" + this.generatorName
  }

  rootUrl() {
    return this.rawFileUrl("") // README is visible in the root of the generator
  }

  got(filename) {
    return cli.got(this.rawFileUrl(filename))
  }
}

function* generate (context, heroku) {
  const reader = new GithubReader(context.args.name)
  const pkg = yield reader.got('.package.txt')
  const files = pkg.body.split("\n").map(s => s.trim());

  if (!files || files.length == 0) {
    cli.error(".package.txt not found in ", reader.rootUrl())
    process.exit(1);
  }

  cli.log("Writing files:")

  const promises = files.map(filename => {
    if (filename) {
      return reader.got(filename).then(response => {
        cli.log("--> ", filename)
        fs.writeFileSync(filename, response.body)
      })
    }
  });

  yield Promise.all(promises);
  cli.log("Stack generated successfully")
  cli.open(reader.readmeUrl())
}


module.exports = {
    topic: 'dh',
    command: 'generate',
    description: 'dockhero-generate',
    help: 'dh:generate <name> - installs the pre-defined example specified by name',
    needsApp: true,
    needsAuth: false,
    args: [{ name: 'name' }],
    run: cli.command(co.wrap(generate))
}
