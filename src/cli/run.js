const runner = require('./runner')

const runCommand = () => ({
    command: 'run [target]',
    describe: 'run',
    builder: (yargs) => {
        // yargs
        //     .option('target', {
        //         describe: 'run target environment',
        //         type: 'string'
        //     })
    },
    _handler: (argv, conf) => {
        runner(argv.target || conf.target, conf)
    }
})

module.exports = runCommand
