
const _ = require('lodash')

const DOCKHERO_API_HOST = process.env['DOCKHERO_API_HOST'] || "dockhero.herokuapp.com"
const DOCKHERO_API_BASE = "https://" + DOCKHERO_API_HOST + "/api"

function apiUrl() {
  return _.join(_.concat(DOCKHERO_API_BASE, arguments), '/')
}

module.export = { apiUrl }
