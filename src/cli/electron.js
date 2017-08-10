const childProcess = require('child_process')
const path = require('path')
const http = require('http')
const {EventEmitter} = require('events')
const fs = require('fs')
const logger = require('lignum').getLogger('innocentia')
const WebSocket = require('ws')
const {requireLocal} = require('../utils')
const {InnocentiaBuild} = require('../')
const express = require('express')

const app = express()
const build = new InnocentiaBuild()
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

build.on('error', err => console.error('ev2 error: ', err))
build.on('compiled', filename => console.log('ev2 compiled: ', filename))
build.on('updated', filename => console.log('ev2 updated: ', filename))
build.on('start', filename => console.log('ev2 start: ', filename))
build.watch().on('all_compiled', () => {
    console.log('all_compiled')
    const child = childProcess.spawn(electron, args, {stdio: 'inherit', env})
    child.on('close', code => {
        process.exit(code)
    })
})


