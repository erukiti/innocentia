const path = require('path')
const express = require('express')
const browserify = require('browserify')

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
        const b = browserify(filePath, {debug: true})
        b.transform('babelify')
        b.bundle((err, buf) => {
            clearInterval(timer)
            console.log(`${(Date.now() - time) / 1000}s`)
            if (err) {
                console.error(err)
            } else {
                res.type('js').send(buf)
                return
            }
        })
        return
    }
    console.log('')

    express.static(sourcePath)(req, res, next)
}

module.exports = {serve}
