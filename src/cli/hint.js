const path = require('path')
const process = require('process')
const logger = require('lignum').getLogger()

const hintCommand = () => ({
    command: 'hint',
    describe: 'hint',
    _handler: (argv, conf) => {
        logger.info(conf.isConfigured ? 'configured by .innocent.json': 'no configuration')
        logger.info('environment:', conf.env)
        logger.info('base path:', conf.basePath)
        logger.info('source path:', conf.sourcePath)
        logger.info('destination path:', conf.destPath)
        logger.info('build target:', conf.target)
        logger.info('testcommand:')
        Object.keys(conf.testers).forEach(key => logger.info(conf.testers[key]))
        if (typeof conf.webpack === 'object' && Object.keys(conf.webpack).length > 0) {
            logger.info('use Webpack')
        }
        conf.entries && conf.entries.forEach(({src, type}) => {
            logger.info('build:', src, type)
        })
    }
})

module.exports = hintCommand
