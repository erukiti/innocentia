const fs = require('fs')
const os = require('os')
const path = require('path')
const {getLogger} = require('lignum')
const logger = getLogger()

class InnocentiaConfig {
    constructor(opts = {}) {
        this.basePath = opts.basePath || './'

        let config
        try {
            config = JSON.parse(fs.readFileSync(path.join(this.basePath, '.innocentia.json')))
            this.isConfigured = true
            this.entries = config.entries
        } catch (e) {
            config = {}
            this.isConfigured = false
            this.entries = null
            logger.verbose(e)
        }
        logger.debug(JSON.stringify(config))

        if (!('directories' in config)) {
            config['directories'] = {}
        }

        this.sourcePath = opts.sourcePath || config['directories']['source']
        this.destPath = opts.destPath || config['directories']['destination']
        this.webpack = opts.webpack || config['webpack']
        this.env = opts.env || 'development'
        this.target = config['target']
        this.testers = config['testers'] || {}

        if (opts.isTemporaryDestination || !this.destPath) {
            this.destPath = fs.mkdtempSync(path.join(os.tmpdir(), 'innocentia-'))
        }
    }
}

module.exports = InnocentiaConfig
