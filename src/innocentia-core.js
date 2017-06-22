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
            console.log(packageObj)

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

            let count = 0

            const ev = new EventEmitter()
            ev.on('error', err => {
                ev2 && ev2.emit('error', err)
                res.type('js').send(`console.log(${JSON.stringify(err, null, '  ')})`)
            })
            ev.on('compiled', result => {
                cache[result.target] = result.buf
                ev2 && ev2.emit('compiled', result.target)
                res.type('js').send(result.buf)
            })
            ev.on('updated', result => {
                cache[result.target] = result.buf
                ev2 && ev2.emit('updated', result.target)
            })

            ev2 && ev2.emit('start', dest)
            const src = this.decideSource(dest)
            this.buildSource(src, dest, ev)
        }
    }
}

module.exports = InnocentiaCore
