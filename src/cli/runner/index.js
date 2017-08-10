
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
        default: {
            console.error('unknown types')
        }
    }
}

module.exports = run
