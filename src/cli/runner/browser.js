const path = require('path')
const express = require('express')
const {getLogger} = require('lignum')
const {InnocentiaExpress} = require('../../innocentia')


const run = conf => {
    const logger = getLogger()
    const app = express()
    const {sourcePath} = conf
    const core = new InnocentiaExpress(conf)

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
}

module.exports = run
