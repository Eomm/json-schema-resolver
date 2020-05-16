'use strict'
const clone = require('rfdc')({ proto: true, circles: false })

module.exports = function giveMe (whatYouWant) {
  return clone(require(`./schemas/${whatYouWant}`))
}
