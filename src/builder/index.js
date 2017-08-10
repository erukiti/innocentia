const {EventEmitter} = require('events')
const path = require('path')
const {getLogger} = require('lignum')

const logger = getLogger('innocentia')

const BrowserifyBuilder = require('./browserify')
const WebpackBuilder = require('./webpack')
const CopyBuilder = require('./copy')
const ElectronIconBuilder = require('./electron-icon')

class Builder {
    constructor(opts = {}) {
        // this.builder = new BrowserifyBuilder(opts)
        this.builder = new WebpackBuilder(opts)
        this.copyBuilder = new CopyBuilder(opts)
        this.electronIconBuilder = new ElectronIconBuilder(opts)
        this.ev = new EventEmitter()
        this.builders = {
            copy: this.copyBuilder,
            'electron-icon': this.electronIconBuilder,
            'electron-renderer': this.builder,
            'web': this.builder,
        }

        this.sourcePath = opts.sourcePath
        this.destPath = opts.destPath
    }

    on(name, callback) {
        switch (name) {
            case 'compiled':
            case 'all_compiled': {
                this.ev.on(name, callback)
                return this
            }
            default: {
                this.builder.on(name, callback)
                this.copyBuilder.on(name, callback)
                this.electronIconBuilder.on(name, callback)
                return this
            }
        }
    }

    _completeEntries(entries) {
        return entries.map(entry => {
            const src = path.resolve(entry.src)
            let dest = null
            if (entry.dest) {
                dest = path.resolve(entry.dest)
            } else if (this.destPath) {
                dest = src.replace(this.sourcePath, this.destPath)
            }
            return {src, dest, type: entry.type}
        })
    }

    build(entries, isWatch = false) {
        const perBuilders = {}
        let isAllCompiled = false

        this._completeEntries(entries).forEach(entry => {
            if (!this.builders[entry.type]) {
                logger.log(`not found ${entry.type}`)
                return
            }

            if (!perBuilders[entry.type]) {
                perBuilders[entry.type] = {
                    entries: [entry],
                    isCompiled: [],
                }
            } else {
                perBuilders[entry.type].entries.push(entry)
            }
        })

        Object.keys(perBuilders).forEach(key => {
            const builder = this.builders[key]
            builder.on('compiled', ({index, buf}) => {
                perBuilders[key].isCompiled[index] = true
                const {src, dest} = perBuilders[key].entries[index]
                this.ev.emit('compiled', {src, dest, buf})

                if (isAllCompiled) {
                    return
                }

                const nComplete = Object.keys(perBuilders).map(key2 => {
                    const nFlags = perBuilders[key2].isCompiled.filter(flag => flag).length
                    return nFlags === perBuilders[key2].entries.length
                }).filter(flag => flag).length
                if (nComplete === Object.keys(perBuilders).length) {
                    this.ev.emit('all_compiled')
                    isAllCompiled = true
                }
            })
            if (isWatch) {
                builder.watch(perBuilders[key].entries)
            } else {
                builder.build(perBuilders[key].entries)
            }
        })

    }

    run(src) {
        this.builder.run(src)
    }
}

module.exports = Builder
