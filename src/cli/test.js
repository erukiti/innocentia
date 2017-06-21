const tester = require('./tester')

const testCommand = () => ({
    command: 'test',
    describe: 'test',
    builder: (yargs) => {

    },
    _handler: (argv, conf) => {
        tester(conf)
    }
})

module.exports = testCommand
