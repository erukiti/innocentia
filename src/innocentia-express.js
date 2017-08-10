const path = require('path')
const express = require('express')
const os = require('os')
const fs = require('fs')
const mkdirp = require('mkdirp')

const InnocentiaCore = require('./innocentia-core')

class InnocentiaExpress extends InnocentiaCore {
    _decideSource(dest) {
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
        const getBuf = (dest, buf2) => {
            let buf
            if (buf2) {
                return buf2
            } else if (dest) {
                return fs.readFileSync(dest)
            } else {
                this.ev.emit('unknown bugs.')
                return new Buffer()
            }
        }

        const setCacheAndSend = (src, buf) => {
            this.requests[src].cache = buf
            this.requests[src].resList.forEach(res => res.type('js').send(buf))
            this.requests[src].resList = []
        }

        this.builder.on('compiled', ({src, dest, buf: buf2}) => {
            const buf = getBuf(dest, buf2)
            if (!this.requests[src]) {
                this.ev.emit('warning', `missing compiled: ${src}`)
            } else if (this.requests[src].cache) {
                this.ev.emit('warning', 'already sent: %{src}')
            } else {
                this.ev.emit('compiled', src)
                setCacheAndSend(src, buf)
            }
        })

        this.builder.on('updated', ({src, dest, buf: buf2}) => {
            const buf = getBuf(dest, buf2)
            if (!this.requests[src]) {
                this.ev.emit('warning', `missing updated: ${src}`)
                return
            }

            setCacheAndSend(src, buf)
            this.ev.emit('updated', src)
        })

        const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'innocentia-'))
        return (req, res, next) => {
            this.ev.emit('accessed', req.url)
            if (req.url.substr(-3) !== '.js') {
                return next()
            }

            const src = this._decideSource(path.resolve(path.join(this.config.basePath, req.url)))
            const dest = path.join(temp, req.url)
            this.ev.emit('start', src)

            if (!this.requests[src]) {
                this.requests[src] = {
                    resList: [res],
                    cache: null,
                }
                this.builder.build([{src, dest, target: 'web'}], true)
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

module.exports = InnocentiaExpress
