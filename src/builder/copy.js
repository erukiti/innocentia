const mkdirp = require('mkdirp')
const {EventEmitter} = require('events')
const path = require('path')
const fs = require('fs')
const {getLogger} = require('lignum')
const logger = getLogger('innocentia')

class CopyBuilder {
    static isInstalled() {
        return true
    }

    static getTypes() {
        return ['copy']
    }

    constructor(config = {}) {
        this.ev = new EventEmitter()
        this.sourcePath = path.resolve(config.sourcePath)
        this.destPath = path.resolve(config.destPath)
    }

    on(name, handler) {
        this.ev.on(name, handler)
    }

    _copy(src, dest, callback) {
        mkdirp.sync(path.dirname(dest))
        fs.createReadStream(src).pipe(fs.createWriteStream(dest))
        callback()
    }

    _copyAll(entries) {
        entries.forEach(({src, dest}, index) => {
            this._copy(src, dest, () => {
                this.ev.emit('compiled', {src, dest, index})
            })
        })
    }

    build(entries) {
        this._copyAll(entries)
    }

    watch(entries) {
        this._copyAll(entries)
        entries.forEach(({src, dest}) => {
            fs.watch(src, (event, filename) => {
                this._copy(src, dest, () => this.ev.emit('updated', {src, dest}))
            })
        })
    }
}

module.exports = CopyBuilder
