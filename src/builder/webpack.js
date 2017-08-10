const {EventEmitter} = require('events')
const fs = require('fs')
const path = require('path')
const utils = require('../utils')
const {getLogger} = require('lignum')
const logger = getLogger('innocentia')

class WebpackBuilder {
    static isInstalled() {
        return utils.checkLocalModule('webpack')
    }

    static getTypes() {
        return ['web', 'electron-browser', 'electron-renderer']
    }

    constructor(config) {
        this.ev = new EventEmitter()
        this.sourcePath = path.resolve(config.sourcePath)
        this.destPath = path.resolve(config.destPath)
        this.env = config.env

        this.webpack = utils.requireLocal('webpack')

        if (config.webpack) {
            this.rules = config.webpack.rules.map(rule => {
                rule.test = new RegExp(rule.test)
                return rule
            })
        } else {
            this.rules = []
            if (utils.checkLocalModule('babel-loader')) {
                this.rules.push({
                    test: /\.jsx?$/,
                    use: [{
                        loader: 'babel-loader',
                        options: {
                            sourceMap: true
                        }
                    }]
                })
            }
        }
    }

    on(name, handler) {
        this.ev.on(name, handler)
    }

    build(entries) {
        try {
            const compiler = this._getCompiler(entries)
            compiler.run((err, stats) => this._compiled(err, stats, entries))
        } catch (e) {
            console.error(e)
        }
    }

    watch(entries) {
        const compiler = this._getCompiler(entries)
        compiler.watch({}, (err, stats) => this._compiled(err, stats, entries))
    }

    _getCompiler(entries) {
        const conf = entries.map(entry => {
            logger.log(JSON.stringify(entry))
            return this._createConfig(entry)
        })

        return this.webpack(conf)
    }

    _createConfig({src, dest, target}) {
        return {
            entry: src,
            output: {
                path: path.dirname(dest),
                filename: path.basename(dest)
            },
            resolve: {
                extensions: ['.js', '.jsx', 'ts', 'tsx']
            },
            module: {rules: this.rules},
            devtool: '#source-map',
            target,
            plugins: [
                new this.webpack.DefinePlugin({
                    'process.env.NODE_ENV': JSON.stringify(this.env)
                })
            ],
            stats: {
                warnings: true,
                errors: true,
                errorDetails: true,
            }
        }
    }

    _compiled(err, stats, entries) {
        if (err) {
            this.ev.emit('error', err)
            return
        }

        // see. https://webpack.js.org/api/node/#stats-tostring-options-
        const webpackCompileInfo = stats.toString({colors: true})
        if (webpackCompileInfo) {
            this.ev.emit('info', webpackCompileInfo)
        }
        if (stats.hasErrors()) {
            this.ev.emit('error', webpackCompileInfo || 'webpack compile error')
            return
        }

        entries.forEach(({src, dest}, index) => {
            this.ev.emit('compiled', {src, dest, index})
        })
    }
}

module.exports = WebpackBuilder
