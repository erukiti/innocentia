const path = require('path')
const express = require('express')
const {EventEmitter} = require('events')
const fs = require('fs')
const mkdirp = require('mkdirp')
const {getLogger} = require('lignum')
const logger = getLogger('innocentia')

const Builder = require('./builder')

class InnocentiaCore {
    constructor(opts = {}) {
        this.requests = {}
        this.ev = new EventEmitter()
        this.sourcePath = opts.sourcePath || './'
        this.builder = new Builder(opts)
        this.builder.on('error', err => {
            this.ev.emit('error', err)
        })
    }

    on(name, handler) {
        this.ev.on(name, handler)
    }
    build(entries) {
        this.builder.on('compiled', ({src}) => this.ev.emit('compiled', src))
        this.builder.on('info', info => this.ev.emit('info', info))
        this.builder.build(entries)
    }

    decideSource(dest) {
        const isExists = filename => {
            try {
                const stat = fs.statSync(filename)
                return true
            } catch (err) {
                return false
            }
        }

        for (let ext of ['.js', '.jsx', '.ts', '.tsx']) {
            const filename = dest.replace(/\.js$/, ext)
            if (isExists(filename)) {
                return filename
            }
        }
        return dest
    }

    // FIXME: serve と build 同時にしたら混戦する
    serve() {
        this.builder.on('compiled', ({src, buf}) => {
            if (!this.requests[src]) {
                this.ev.emit('warning', `missing compiled: ${src}`)
            } else if (this.requests[src].cache) {
                this.ev.emit('warning', 'already sent: %{src}')
            } else {
                this.requests[src].cache = buf
                this.requests[src].resList.forEach(res => res.type('js').send(buf))
                this.requests[src].resList = []
                this.ev.emit('compiled', src)
            }
        })

        this.builder.on('updated', ({src, buf}) => {
            if (!this.requests[src]) {
                this.ev.emit('warning', `missing updated: ${src}`)
                return
            }

            this.requests[src].cache = buf
            this.requests[src].resList.forEach(res => res.type('js').send(buf))
            this.requests[src].resList = []
            this.ev.emit('updated', src)
        })

        return (req, res, next) => {
            this.ev.emit('accessed', req.url)
            if (req.url.substr(-3) !== '.js') {
                return next()
            }

            const src = this.decideSource(path.resolve(path.join(this.sourcePath, req.url)))

            this.ev.emit('start', src)

            if (!this.requests[src]) {
                this.requests[src] = {
                    resList: [res],
                    cache: null,
                }
                this.builder.watch([{src}])
                return
            }

            if (this.requests[src].cache) {
                this.ev.emit('cached', src)
                res.type('js').send(this.requests[src].cache)
                return
            }

            this.requests[src].resList.push(res)
        }
    }
}

module.exports = InnocentiaCore
