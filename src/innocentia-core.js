const {EventEmitter} = require('events')
const {getLogger} = require('lignum')
const logger = getLogger('innocentia')

const Config = require('./config')
const Builder = require('./builder')

class InnocentiaCore {
    constructor(opts = {}) {
        this.requests = {}
        this.ev = new EventEmitter()
        this.config = new Config(opts)

        this.builder = new Builder(this.config)
        this.builder.on('error', err => {
            this.ev.emit('error', err)
        })
    }

    on(name, handler) {
        this.ev.on(name, handler)
    }
}

module.exports = InnocentiaCore
