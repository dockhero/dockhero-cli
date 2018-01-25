function getAppInfo (context, heroku) {
  if (process.env.PREFER_LOCAL_ENV) {
    return Promise.resolve({name: process.env.HEROKU_APP_NAME, web_url: "https://" + process.env.HEROKU_APP_NAME + ".herokuapp.com"})
  } else {
    return heroku.get(`/apps/${context.app}`)
  }
}

function getConfigVars (context, heroku) {
  if (process.env.PREFER_LOCAL_ENV) {
    return Promise.resolve(process.env)
  } else {
    return heroku.get(`/apps/${context.app}/config-vars`)
  }
}

module.exports = {
  getAppInfo,
  getConfigVars
}
