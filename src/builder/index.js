const {EventEmitter} = require('events')
const path = require('path')
const {getLogger} = require('lignum')

const logger = getLogger()

const utils = require('../utils')
const BrowserifyBuilder = require('./browserify')
const WebpackBuilder = require('./webpack')
const CopyBuilder = require('./copy')

class Builder {
    constructor(opts = {}) {
        this.sourcePath = opts.sourcePath
        this.destPath = opts.destPath
        this.ev = new EventEmitter()
        this.builders = []
        this.buildersFromTarget = {}

        this._registerBuilder(CopyBuilder, opts)
        if (utils.checkLocalModule('icon-gen')) {
            const ElectronIconBuilder = require('./electron-icon')
            this._registerBuilder(ElectronIconBuilder, opts)
        }
        if (utils.checkLocalModule('webpack')) {
            this._registerBuilder(WebpackBuilder, opts)
        }

    }

    _registerBuilder(Klass, opts) {
        if (!Klass.isInstalled()) {
            logger.warn(`${Klass.name} is not installed`)
            return
        }
        const builder = new Klass(opts)
        if (!this.builders.includes(builder)) {
            this.builders.push(builder)
        }
        Klass.getTypes().forEach(target => {
            if (this.buildersFromTarget[target]) {
                logger.error(`conflict builder: ${target}`)
                return
            }
            this.buildersFromTarget[target] = builder
        })
    }

    on(name, callback) {
        switch (name) {
            case 'compiled':
            case 'all_compiled': {
                this.ev.on(name, callback)
                return this
            }
            default: {
                this.builders.forEach(builder => builder.on(name, callback))
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
                if (/\.[tj]sx?$/.test(dest)) {
                    dest = dest.replace(/\.[a-z]+$/, '.js')
                }
            }
            return {src, dest, type: entry.type}
        })
    }

    build(entries, isWatch = false) {
        const perBuilders = {}
        let isAllCompiled = false

        this._completeEntries(entries).forEach(entry => {
            if (!this.buildersFromTarget[entry.type]) {
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
            const builder = this.buildersFromTarget[key]
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
        console.log('errrorororororor!')
        process.exit(-1)
    }
}

module.exports = Builder
