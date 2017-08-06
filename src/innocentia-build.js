const InnocentiaCore = require('./innocentia-core')

class InnocentiaBuild extends InnocentiaCore {
    build(entries) {
        this.builder.on('compiled', ({src}) => this.ev.emit('compiled', src))
        this.builder.on('info', info => this.ev.emit('info', info))
        this.builder.build(entries)
    }
}

module.exports = InnocentiaBuild
