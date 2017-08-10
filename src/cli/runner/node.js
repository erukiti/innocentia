const childProcess = require('child_process')
const path = require('path')
const {getLogger} = require('lignum')

const {InnocentiaBuild} = require('../../innocentia')
const logger = getLogger()

const run = filename => {
    logger.info(`run ${path.relative('.', filename)}`)
    const child = childProcess.exec(`node ${filename}`)
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)

    child.on('error', err => {
        logger.error(err)
        process.exit(1)
    })

    child.on('exit', (code, signal) => {
        logger.info(`exit: ${code}`)
        process.exit(code)
    })
}

const runNode = config => {
    const build = new InnocentiaBuild(config)
    build.on('compiled', ({dest, buf}) => {
        run(dest)
    })

    build.on('error', err => {
        logger.error(err)
        process.exit(1)
    })
    build.on('warn', warn => logger.warn(warn))
    build.build(config.entries)
}

module.exports = runNode
