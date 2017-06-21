const InnocentiaCore = require('./innocentia-core')

class InnocentiaBuild extends InnocentiaCore {
    _completeEntries(entries) {
        if (Array.isArray(entries) && entries.length > 0) {
            return entries
        }
        return this.config.entries
    }

    build(entries = []) {
        this.builder
        .on('compiled', ({src, dest, buf}) => this.ev.emit('compiled', {src, dest, buf}))
        .on('info', info => this.ev.emit('info', info))
        .on('all_compiled', () => this.ev.emit('all_compiled'))

        this.builder.build(this._completeEntries(entries), false)

        return this
    }
    watch(entries = []) {
        this.builder
        .on('compiled', ({src, dest, buf}) => this.ev.emit('compiled', {src, dest, buf}))
        .on('info', info => this.ev.emit('info', info))
        .on('all_compiled', () => this.ev.emit('all_compiled'))
        this.builder.build(this._completeEntries(entries), true)

        return this
    }
}

module.exports = InnocentiaBuild
