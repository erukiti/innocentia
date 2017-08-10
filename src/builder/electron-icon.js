'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const utils = require('../utils')
const {EventEmitter} = require('events')
const {getLogger} = require('lignum')
const logger = getLogger()

class ElectronIconBuilder {
    static isInstalled() {
        return utils.checkLocalModule('icon-gen') && utils.checkLocalModule('jimp')
    }

    static getTypes() {
        return ['electron-icon']
    }

    constructor(config) {
        this.ev = new EventEmitter()
    }

    on(name, handler) {
        this.ev.on(name, handler)
        return this
    }

    _generateIcon(entry, callback) {
        const icongen = utils.requireLocal('icon-gen')
        const Jimp = utils.requireLocal('jimp')

        const temp = fs.mkdtempSync('/tmp/ws-')
        Jimp.read(entry.src).then(image => {
            Promise.all([16, 24, 32, 48, 64, 128, 256, 512, 1024].map(size => {
                return new Promise((resolve, reject) => {
                    image.clone().resize(size, size).write(path.join(temp, `${size}.png`), () => {
                        resolve()
                    })
                })
            })).then(() => {
                const name = path.basename(entry.src, '.png')
                logger.log(name, path.dirname(entry.dest))

                return icongen(temp, path.dirname(entry.dest), {
                    type: 'png',
                    modes: ['ico', 'icns'],
                    names: {ico: name, icns: name},
                    sizes: {},
                }).catch(err => this.ev.emit('error', err))
            }).then(result => {
                logger.log(result)
                callback()
            }).catch(err => this.ev.emit('error', err))
        }).catch(err => this.ev.emit('error', err))
    }

    _run(entries) {
        entries.map((entry, index) => {
            this._generateIcon(entry, () => this.ev.emit('compiled', {index}))
        })
    }

    run(entries) {
        this._run(entries)
    }

    watch(entries) {
        this._run(entries)
        entries.forEach(entry => {
            fs.watch(entry.src, () => {
                this._generateIcon(entry, () => this.ev.emit('updated', {src: entry.src}))
            })
        })
    }
}

module.exports = ElectronIconBuilder
