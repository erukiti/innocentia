const yargs = require('yargs')
const logger = require('lignum').getLogger()
const InnocentiaConfig = require('./config')

const parseGeneralOptions = obj => {
    obj.handler = argv => {
        let level = 'log'
        if (argv.verbose) {
            level = 'verbose'
        }
        if (argv.debug) {
            level = 'debug'
        }

        logger.setLevel(level)
        const config = new InnocentiaConfig({
            basePath: argv.base,
            sourcePath: argv.source,
            destPath: argv.dest,
            env: argv.env,
        })
        obj._handler(argv, config)
    }
    return obj
}

const cli = () => {
    yargs
        .detectLocale(false)
        .version()
        .help()
        .usage('Usage: innocentia [options...] <subcommand> [args...]')
        .option('verbose', {
            default: false,
            type: 'boolean',
        })
        .option('debug', {
            default: false,
            type: 'boolean',
        })
        .options('base', {
            default: './',
            type: 'string'
        })
        .option('source', {
            default: '',
            type: 'string'
        })
        .option('dest', {
            default: '',
            type: 'string'
        })
        .options('env', {
            default: 'development',
            type: 'string'
        })
        .command(parseGeneralOptions(require('./run')()))
        .command(parseGeneralOptions(require('./test')()))
        .demandCommand(1, 'Need subcommand.')
        .argv
}

module.exports = cli

cli()

