const builder = require('./builder')

const buildCommand = () => ({
    command: 'build',
    describe: 'build',
    _handler: (argv, conf) => {
        builder(conf)
    }
})

module.exports = buildCommand
