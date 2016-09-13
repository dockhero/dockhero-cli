'use strict'
let common = require('./common.js')
let cli = require('heroku-cli-util')
let fs = require('fs')
let unzip = require('unzip')

const s3UrlPrefix = 'https://dockhero-generators.s3.amazonaws.com/'
const generatorsUrl = 'https://github.com/dockhero/generators/'
const readmeUrlPrefix = generatorsUrl + 'blob/master/'

function s3Url(generatorName) {
    return s3UrlPrefix + zipFileName(generatorName)
}

function zipFileName(generatorName) {
    return generatorName + '.zip'
}

function readmeUrl(generatorName) {
    return readmeUrlPrefix + generatorName + '/README.md'
}

module.exports = {
    topic: 'dh',
    command: 'generate',
    description: 'dockhero-generate',
    help: 'dh:generate <name> - installs the pre-defined example specified by name',
    needsApp: true,
    needsAuth: true,
    args: [{ name: 'name' }],
    run: cli.command((context, heroku) => {
        return common.getConfig(heroku, context.app)
            .then(config => {
                let generatorName = context.args.name || ''
                let success = false
                cli.got.stream(s3Url(generatorName))
                    .on('response', function() {
                        success = true
                        cli.debug("Check readme file at " + readmeUrl(generatorName))
                    })
                    .on('error', error => {
                        success = false
                        cli.error('Generator "' + generatorName + '" could not be found.\n' +
                                  'Please check the list of all available generators at ' + generatorsUrl)
                    } )
                    .pipe(fs.createWriteStream(zipFileName(generatorName)))
                    .on('finish', function() {
                        cli.debug(success ? 'Successfully Done' : 'Unsuccessfully Done')
                    })
            })
        })
}
