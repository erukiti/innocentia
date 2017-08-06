const fs = require('fs')
const path = require('path')
const {getLogger} = require('lignum')
const logger = getLogger('innocentia')

class InnocentiaConfig {
    constructor(opts = {}) {
        let config
        try {
            config = JSON.parse(fs.readFileSync('./.innocentia.json'))
        } catch (e) {
            config = {}
            logger.log(e)
        }
        logger.log(config)

        if (!('directories' in config)) {
            config['directories'] = {}
        }

        this.basePath = opts.basePath || './'
        this.sourcePath = opts.sourcePath || config['directories']['source']
        this.destPath = opts.destPath || config['directories']['destination']
        this.webpack = opts.webpack || config['webpack']
        this.env = opts.env || 'development'
    }
}

module.exports = InnocentiaConfig
