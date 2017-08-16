const path = require('path')
const logger = require('lignum').getLogger()

const {InnocentiaBuild} = require('../../innocentia')

const builder = (conf) => {
    const cwd = process.cwd()
    const core = new InnocentiaBuild(conf)
    core.on('error', err => logger.error(err))
    core.on('warning', msg => logger.warn(msg))
    core.on('compiled', ({src, dest}) => {
        logger.verbose(`compiled: ${path.relative(cwd, src)} -> ${path.relative(cwd, dest)}`)
    })
    core.on('updated', filename => logger.verbse('unknown updated: ', filename))

    core.build([], true)
}

module.exports = builder
