const {EventEmitter} = require('events')
const fs = require('fs')
const path = require('path')

const utils = require('../utils')

class BrowserifyBuild {
    static isInstalled() {
        return utils.checkLocalModule('browserify')
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

    build(src) {
        return new Promise((resolve, reject) => {
            const b = this._setupBrowserify(src)

            b.bundle((err, buf) => {
                if (err) {
                    reject(err)
                } else {
                    resolve({src, buf})
                }
            })
        })
    }

    watch(src) {
        const b = this._setupBrowserify(src)

        b.bundle((err, buf) => {
            if (err) {
                this.ev.emit('error', err.toString())
            } else {
                this.ev.emit('compiled', {src, buf})
            }
        })
        b.on('update', () => {
            b.bundle((err, buf) => {
                if (err) {
                    this.ev.emit('error', err.toString())
                } else {
                    this.ev.emit('upated', {src, buf})
                }
            })
        })
    }

    on(name, handler) {
        this.ev.on(name, handler)
    }
}

module.exports = BrowserifyBuild
