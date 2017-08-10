const {EventEmitter} = require('events')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const utils = require('../utils')

class BrowserifyBuild {
    static isInstalled() {
        return utils.checkLocalModule('browserify')
    }

    static getTypes() {
        return ['web', 'electron-browser', 'electron-renderer']
    }

    constructor(opts = {}) {
        this.ev = new EventEmitter()
        this.opts = opts

        this.browserify = utils.requireLocal('browserify')
        this.plugin = []

        utils.checkLocalModule('watchify') && this.plugin.push(utils.requireLocal('watchify'))
        utils.checkLocalModule('tsify') && this.plugin.push(utils.requireLocal('tsify'))

        this.babelify = utils.checkLocalModule('babelify') ? utils.requireLocal('babelify') : null
    }

    _setupBrowserify(src) {
        const b = this.browserify(src, {
            debug: true,
            plugin: this.plugin,
            ignoreMissing: true,
            extensions: ['.js', '.jsx', 'ts', 'tsx'] // FIXME
        })
        if (this.babelify) {
            try {
                const filePath = path.resolve(path.join(this.opts.sourcePath || '.', '.babelrc'))
                const babelrc = JSON.parse(fs.readFileSync(filePath))
                b.transform(this.babelify, babelrc)
            } catch (e) {
                console.error(e)
            }
        }
        return b
    }

    _bundle(b, src, dest, label) {
        b.bundle((err, buf) => {
            if (err) {
                this.ev.emit('error', err.toString())
                return
            }
            this.ev.emit(label, {src, buf})
            if (dest) {
                mkdirp.sync(path.dirname(path.resolve(dest)))
                fs.writeFileSync(path.resolve(dest), buf)
            }
        })

    }

    _build(entries, isWatch) {
        entries.forEach(({src, dest}) => {
            const b = this._setupBrowserify(src)
            this._bundle(b, src, dest, 'compiled')
            if (isWatch) {
                b.on('update', () => {
                    this._bundle(b, src, dest, 'updated')
                })
            }
        })
    }

    build(entries) {
        this._build(entries, false)
    }

    watch(entries) {
        this._build(entries, true)
    }

    on(name, handler) {
        this.ev.on(name, handler)
    }
}

module.exports = BrowserifyBuild
