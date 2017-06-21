const {EventEmitter} = require('events')
const {getLogger} = require('lignum')
const logger = getLogger()

const Builder = require('../builder')

class InnocentiaCore {
    constructor(conf) {
        this.requests = {}
        this.ev = new EventEmitter()
        this.config = conf

        this.builder = new Builder(this.config)
        this.builder.on('error', err => {
            this.ev.emit('error', err)
        })
    }

    on(name, handler) {
        this.ev.on(name, handler)
        return this
    }
}

module.exports = InnocentiaCore
