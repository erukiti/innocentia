const {exec} = require('../../utils')
const logger = require('lignum').getLogger()

const test = (conf) => {
    if (typeof conf.testers !== 'object') {
        return
    }

    Promise.all(Object.keys(conf.testers).map(key => {
        return exec(conf.testers[key]).then(({code, stdout, stderr, mixed}) => {
            console.log(mixed)
            console.log(`${key}: ${code === 0 ? 'OK' : 'NG'}`)
            console.log('')
        })
    })).then(() => console.log('all test finished.'))
    .catch(err => logger.error(err))
}

module.exports = test
