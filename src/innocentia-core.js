const path = require('path')
const express = require('express')
const {EventEmitter} = require('events')
const fs = require('fs')

const createBuilder = require('./builder')

class InnocentiaCore {
    constructor(opts) {
        this.requests = {}
        this.ev = new EventEmitter()
        this.sourcePath = opts.sourcePath
        this.builder = createBuilder(opts)
    }

    on(name, handler) {
        this.ev.on(name, handler)
    }

    _init() {
/*
        let packageObj = {}
        try {
            const filename = path.resolve(path.join(this.sourcePath, 'package.json'))
            packageObj = JSON.parse(fs.readFileSync(filename).toString())
            // logger.info(packageObj)

            const installed = fs.readdirSync(path.join(projectPath || sourcePath, 'node_modules'))


        } catch (err) {
            console.error(err)
        }
*/

        this.builder.on('error', err => {
            this.ev.emit('error', err)
        })
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

    serve() {
        this._init()

        this.builder.on('compiled', ({src, buf}) => {
            if (!this.requests[src]) {
                this.ev.emit('warning', `missing compiled: ${src}`)
            } else if (this.requests[src].cache) {
                this.ev.emit('warning', 'already sent: %{src}')
            } else {
                this.requests[src].cache = buf
                this.requests[src].resList.forEach(res => res.type('js').send(buf))
                this.requests[src].resList = []
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
        })

        return (req, res, next) => {
            this.ev.emit('accessed', req.url)
            if (req.url.substr(-3) !== '.js') {
                return next()
            }

            // FIXME
            const dest = path.resolve(path.join(this.sourcePath, req.url))
            const src = this.decideSource(dest)

            if (!this.requests[src]) {
                this.requests[src] = {
                    dest,
                    resList: [res],
                    cache: null,
                }
                this.builder.watch(src)
                return
            }

            if (this.requests[src].cache) {
                this.ev.emit('cached', dest)
                res.type('js').send(this.requests[src].cache)
                return
            }

            this.requests[src].resList.push(res)
        }
    }
}

module.exports = InnocentiaCore
