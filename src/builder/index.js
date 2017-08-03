const {EventEmitter} = require('events')
const BrowserifyBuilder = require('./browserify')
const WebpackBuilder = require('./webpack')

class Builder {
    constructor(opts = {}) {
        // this.builder = new BrowserifyBuilder(opts)
        this.builder = new WebpackBuilder(opts)
    }

    on(name, callback) {
        this.builder.on(name, callback)
    }

    build(entries) {
        this.builder.build(entries)
    }

    watch(entries) {
        this.builder.watch(entries)
    }

    run(src) {
        this.builder.run(src)
    }
}

module.exports = Builder
