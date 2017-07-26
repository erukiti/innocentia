const path = require('path')
const express = require('express')
const {EventEmitter} = require('events')
const fs = require('fs')

const cache = {}

class InnocentiaCore {
    constructor(decideSource, buildSource) {
        this.decideSource = decideSource
        this.buildSource = buildSource
    }

    serve(opts) {
        let {ev: ev2, sourcePath, projectPath} = opts

        let packageObj = {}
        try {
            const filename = path.join(projectPath || sourcePath, 'package.json')
            packageObj = JSON.parse(fs.readFileSync(filename).toString())
            // logger.info(packageObj)

            const installed = fs.readdirSync(path.join(projectPath || sourcePath, 'node_modules'))


        } catch (err) {
            console.error(err)
        }

        return (req, res, next) => {
            if (req.url.substr(-3) !== '.js') {
                return next()
            }

            const dest = path.resolve(path.join(sourcePath, req.url))
            // FIXME

            if (cache[dest]) {
                ev2 && ev2.emit('cached', dest)
                res.type('js').send(cache[dest])
                return
            }

            const ev = new EventEmitter()
            ev.on('error', err => {
                ev2 && ev2.emit('error', err)
            })
            ev.on('compiled', result => {
                if (cache[result.dest]) {
                    console.error('already sent: ', result.dest)
                    return
                }
                cache[result.dest] = result.buf
                ev2 && ev2.emit('compiled', result.dest)
                res.type('js').send(result.buf)
            })
            ev.on('updated', result => {
                if (cache[result.dest]) {
                    cache[result.dest] = result.buf
                    ev2 && ev2.emit('updated', result.dest)
                } else {
                    cache[result.dest] = result.buf
                    ev2 && ev2.emit('compiled', result.dest)
                    res.type('js').send(result.buf)
                }
            })

            ev2 && ev2.emit('start', dest)
            const src = this.decideSource(dest)
            this.buildSource(src, dest, ev)
        }
    }
}

module.exports = InnocentiaCore
