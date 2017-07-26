const fs = require('fs')
const path = require('path')
const logger = require('logger').getLogger('innocentia')

const InnocentiaCore = require('./innocentia-core')
const Utils = require('./utils')



const defaultDecideSource = filePath => {
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

// const defaultBuildSource = (src, dest, ev) => {
//     const rollup = Utils.requireLocal('rollup')
//     const conf = require(path.resolve(path.join('./', 'rollup.config.js')))
//     conf['entry'] = src

//     rollup.rollup(conf).then(b => {
//         const res = b.generate({format: 'cjs', moduleName: 'test'})
//         ev.emit('compiled', {dest, buf: res.code})
//     }).catch(e => {
//         ev.emit('error', e)
//     })
// }

const browserify = Utils.requireLocal('browserify')
const watchify = Utils.requireLocal('watchify')
const defaultBuildSource = (src, dest, ev) => {
    const b = browserify(src, {
        debug: true,
        plugin: [watchify],
        ignoreMissing: true,
        extensions: ['.js', '.jsx', 'ts', 'tsx']
    })
    if (Utils.checkLocalModule('tsify')) {
        b.plugin('tsify')
        logger.log('Use tsify')
    }
    if (Utils.checkLocalModule('babelify')) {
        try {
            const babelrc = JSON.parse(fs.readFileSync('.babelrc'))
            logger.log(babelrc)
            b.transform('babelify', babelrc)
            logger.log('Use babelify')
        } catch (e) {
            logger.error('.babelrc not found')
        }
    }

    b.bundle((err, buf) => {
        if (err) {
            ev.emit('error', err.toString())
        } else {
            ev.emit('compiled', {dest, buf})
        }
    })
    b.on('update', () => {
        b.bundle((err, buf) => {
            if (err) {
                ev.emit('error', err.toString())
            } else {
                ev.emit('updated', {dest, buf})
            }
        })
    })
}


module.exports = (decideSource = defaultDecideSource, buildSource = defaultBuildSource) => {
    return new InnocentiaCore(decideSource, buildSource)
}
