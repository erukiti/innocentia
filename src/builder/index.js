const BrowserifyBuild = require('./browserify')

const createBuilder = opts => new BrowserifyBuild(opts)

module.exports = createBuilder
