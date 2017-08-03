const childProcess = require('child_process')
const path = require('path')

const InnocentiaCore = require('../')

if (process.argv.length < 4) {
    console.error('innocentia run <src> [buildTemp]')
    return
}

const src = path.resolve(process.argv[3])
const dest = path.resolve(4 in process.argv ? path.join(process.argv[4], 'index.js') : './build/index.js')

const core = new InnocentiaCore()

const run = filename => {
    const child = childProcess.exec(`node ${dest}`)
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)

    child.on('error', err => {
        console.error(err)
        process.exit(1)
    })

    child.on('exit', (code, signal) => {
        console.log(`exit: ${code}`)
        process.exit(code)
    })
}

core.on('error', err => {
    console.error(err)
    process.exit(1)
})
core.on('compiled', () => {
    run(dest)
})
core.on('warning', msg => console.warn(msg))

core.build([{src, dest}])

