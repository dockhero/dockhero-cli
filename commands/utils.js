let spawn = require('child_process').spawn

function delay(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}

function runCommand(command, args = [], env = {}) {
  let dockerEnv = Object.assign({}, process.env, env)
  let child = spawn(command, args, {env: dockerEnv, stdio: [0, 1, 2]})

  let promise = new Promise((resolve, reject) => {
    child.on('close', resolve)
    child.on('error', reject)
  })

  return promise
}

module.exports = {
  delay,
  runCommand
}
