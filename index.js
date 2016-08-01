'use strict'
exports.topic = {
  name: 'dh',
  description: 'run dockhero commands'
}

exports.commands = [
  require('./commands/compose.js'),
  require('./commands/docker.js'),
  require('./commands/sh.js'),
  require('./commands/ssh.js'),
  require('./commands/env.js')
]
