const path = require('path')
const express = require('express')
const browserify = require('browserify')
const watchify = require('watchify')

const entryPoints = {}

const brow = (filePath) => {
    if (entryPoints[filePath] !== undefined) {
        return Promise.resolve(entryPoints[filePath])
    }

    return new Promise((resolve, reject) => {
        const b = browserify(filePath, {debug: true, plugin: [watchify]})
        b.transform('babelify')
        b.bundle((err, buf) => {
            if (err) {
                reject(err)
            } else {
                entryPoints[filePath] = buf
                resolve(buf)
            }
        })
        b.on('update', () => {
            console.log(`update: ${filePath}`)
            b.bundle((err, buf) => {
                if (err) {
                    console.error(err)
                } else {
                    entryPoints[filePath] = buf
                }
            })
        })

    })
}

const serve = (sourcePath) => (req, res, next) => {
    process.stdout.write(`${req.url} `)

    if (req.url.substr(-3) === '.js') {
        let count = 0
        const circle = '-\\|/'
        const timer = setInterval(() => {
            process.stderr.write(`${circle[count++]}\b`)
            if (count >= 4) {
                count = 0
            }
        }, 100)

        const filePath = path.join(sourcePath, req.url)
        const time = Date.now()
        brow(filePath).then(buf => {
            console.log(`${(Date.now() - time) / 1000}s`)
            clearInterval(timer)
            res.type('js').send(buf)
        }).catch(err => {
            console.log(`${(Date.now() - time) / 1000}s`)
            clearInterval(timer)
            console.error(err)
            res.status(500).type('text/plain').send(err.toString())
        })
        return
    }
    console.log('')

    express.static(sourcePath)(req, res, next)
}

module.exports = {serve}
