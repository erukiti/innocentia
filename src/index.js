const fs = require('fs')

const InnocentiaCore = require('./innocentia-core')
const Utils = require('./utils')

const browserify = Utils.requireLocal('browserify')
const watchify = Utils.requireLocal('watchify')

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

const defaultBuildSource = (src, dest, ev) => {
    const isTypeScript = filename => /\.tsx?$/.test(filename)

    const b = browserify(src, {
        debug: true,
        plugin: [watchify],
        extensions: ['.js', '.jsx', 'ts', 'tsx']
    })

    if (isTypeScript(src)) {
        b.plugin('tsify')
    }

    b.transform('babelify', {
        presets: ['es2016', 'react'],
        plugins: ['transform-react-jsx']
    })
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
