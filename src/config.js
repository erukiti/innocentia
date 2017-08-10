const fs = require('fs')
const os = require('os')
const path = require('path')
const logger = require('lignum').getLogger('innocentia')

class InnocentiaConfig {
    constructor(opts = {}) {
        let config
        try {
            config = JSON.parse(fs.readFileSync('./.innocentia.json'))
            this.isConfigured = true
            this.entries = config.entries
        } catch (e) {
            config = {}
            this.isConfigured = false
            this.entries = null
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

        if (opts.isTemporaryDestination || !this.destPath) {
            this.destPath = fs.mkdtempSync(path.join(os.tmpdir(), 'innocentia-'))
        }
    }
}

module.exports = InnocentiaConfig
