function getAppInfo (context, heroku) {
  return heroku.get(`/apps/${context.app}`)
}

function getConfigVars (context, heroku) {
  return heroku.get(`/apps/${context.app}/config-vars`)
}

module.exports = {
  getAppInfo,
  getConfigVars
}
