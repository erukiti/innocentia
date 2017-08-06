const {InnocentiaExpress} = require('../')
const path = require('path')
const express = require('express')
const {getLogger} = require('lignum')

const logger = getLogger('innocentia')
const app = express()
const sourcePath = path.resolve(process.argv.length <= 3 ? './' : process.argv[3])
const core = new InnocentiaExpress({sourcePath})

core.on('error', err => console.error(err))
core.on('compiled', src => logger.log('compiled', src))
core.on('updated', src => logger.log('updated', src))
core.on('cached', src => logger.log('cached', src))
core.on('start', src => logger.log('compile start', src))
core.on('accessed', filename => console.log(filename))
core.on('warning', msg => console.warn(msg))

app.use(core.serve())
app.use(express.static(sourcePath))

app.listen(3000, () => {
    console.log('http://localhost:3000/')
})

/*
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
    const ev = compileJS(filePath, ev)
    ev.on('compiled', )
    .then(buf => {
        console.log(`${(Date.now() - time) / 1000}s`)
        clearInterval(timer)
        res.type('js').send(buf)
    }).catch(err => {
        console.log(`${(Date.now() - time) / 1000}s`)
        clearInterval(timer)
        console.error(err)
        res.send(`console.log(${JSON.stringify(err, null, '  ')})`)
    })
*/
