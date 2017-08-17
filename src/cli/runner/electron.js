const childProcess = require('child_process')
const path = require('path')
const http = require('http')
const {EventEmitter} = require('events')
const fs = require('fs')
const logger = require('lignum').getLogger()
const WebSocket = require('ws')
const {requireLocal} = require('../../utils')
const {InnocentiaBuild} = require('../../innocentia')
const express = require('express')

const runElectron = config => {
    const app = express()
    const build = new InnocentiaBuild(config)
    const server = http.createServer(app).listen()
    const wss = new WebSocket.Server({server})
    const port = server.address().port
    wss.on('connction', (ws, req) => {
        ws.on('message', msg => {
            console.log('innocentia electron ws received:', msg)
        })

        build.on('updated', filename => {
            ws.send(JSON.stringify({type: 'updated', filename}))
        })
    })

    let appPath = null

    if (build.config.isConfigured) {
        const {main} = JSON.parse(fs.readFileSync('./package.json'))
        appPath = path.resolve(main)
    } else {
        appPath = path.join(__dirname, '..', 'src', 'app.js')
    }
    const args = [appPath, ...process.argv.slice(2)]
    const env = Object.assign({}, {'INNOCENTIA_PORT': port}, process.env)

    const electron = requireLocal('electron')

    const cwd = process.cwd()
    const relative = (filename) => path.relative(cwd, filename)

    build.on('error', err => logger.error(err))
    build.on('compiled', ({src, dest}) => logger.info(`compiled ${relative(src)} -> ${relative(dest)}`))
    build.on('updated', ({src, dest}) => logger.info(`updated ${relative(src)} -> ${relative(dest)}`))
    build.on('start', filename => logger.verbose('start', filename))
    build.watch().on('all_compiled', () => {
        logger.info('all compiled.')
        const child = childProcess.spawn(electron, args, {stdio: 'inherit', env})
        child.on('close', code => {
            process.exit(code)
        })
    })
}

module.exports = runElectron
