'use strict'
exports.topic = {
  name: 'dh',
  description: 'run dockhero commands'
}

exports.commands = [
  require('./commands/compose.js'),
  require('./commands/docker.js')
]
