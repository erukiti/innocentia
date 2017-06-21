const logger = require('lignum').getLogger()

const run = (type, conf) => {
    switch (type) {
        case 'electron': {
            const runElectron = require('./electron')
            runElectron(conf)
            break
        }
        case 'node': {
            const runNode = require('./node')
            runNode(conf)
            break
        }
        case 'browser': {
            const runBrowser = require('./browser')
            runBrowser(conf)
            break
        }
        default: {
            logger.error('unknown types')
        }
    }
}

module.exports = run
