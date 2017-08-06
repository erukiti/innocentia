const {InnocentiaBuild} = require('../')
const path = require('path')

if (process.argv.length < 5) {
    console.error('innocentia build <src> <dest>')
    return
}

const src = path.resolve(process.argv[3])
const dest = path.resolve(process.argv[4])

const core = new InnocentiaBuild()

core.on('error', err => console.error('ev2 error: ', err))
core.on('compiled', filename => console.log('ev2 compiled: ', filename))
core.on('updated', filename => console.log('ev2 updated: ', filename))
core.on('start', filename => console.log('ev2 start: ', filename))
core.on('accessed', filename => console.log(filename))
core.on('warning', msg => console.warn(msg))

core.build(src, dest)

