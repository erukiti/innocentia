const path = require('path')
const express = require('express')
const browserify = require('browserify')
const watchify = require('watchify')
const fs = require('fs')

const cache = {}

const compileJS = (filePath, ev = null) => {
    if (cache[filePath] !== undefined) {
        return Promise.resolve(cache[filePath])
    }

    return new Promise((resolve, reject) => {
        const decideSource = () => {
            const isExists = filename => {
                try {
                    const stat = fs.statSync(filename)
                    return true
                } catch (err) {
                    return false
                }
            }

            for (let ext of ['.js', '.jsx', '.ts', '.tsx']) {
                const filename = filePath.replace(/\.js$/, ext)
                if (isExists(filename)) {
                    return filename
                }
            }
            return filePath
        }

        const b = browserify(decideSource(), {
            debug: true,
            plugin: [watchify],
            extensions: ['.js', '.jsx', 'ts', 'tsx']
        })
        b.plugin('tsify')
        b.transform('babelify')
        b.bundle((err, buf) => {
            if (err) {
                reject(err)
            } else {
                cache[filePath] = buf
                ev && ev.emit('compiled', filePath)
                resolve(buf)
            }
        })
        b.on('update', () => {
            console.log(`update: ${filePath}`)
            b.bundle((err, buf) => {
                if (err) {
                    console.error(err)
                } else {
                    cache[filePath] = buf
                    ev && ev.emit('updated', filePath)
                }
            })
        })

    })
}

const serve = (sourcePath, ev = null) => (req, res, next) => {
    if (req.url.substr(-3) !== '.js') {
        console.log(req.url)
        next()
        return
    }

    process.stdout.write(`${req.url} `)

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
    compileJS(filePath, ev).then(buf => {
        console.log(`${(Date.now() - time) / 1000}s`)
        clearInterval(timer)
        res.type('js').send(buf)
    }).catch(err => {
        console.log(`${(Date.now() - time) / 1000}s`)
        clearInterval(timer)
        console.error(err)
        res.send(`console.log(${JSON.stringify(err, null, '  ')})`)
    })
}

module.exports = {serve}
