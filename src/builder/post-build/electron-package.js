const fs = require('fs')
const path = require('path')
const logger = require('lignum').getLogger()
const utils = require('../../utils')


class ElectornPackagePostBuild {
    static getTarget() {
        return 'electron'
    }

    constructor(config) {
        this.config = config
    }

    finalizeMac() {
        const packageInfo = JSON.parse(fs.readFileSync('./package.json'))
        const packager = utils.requireLocal('electron-packager')
        const createInstaller = utils.requireLocal('electron-installer-dmg')
        const electronVersion = utils.readNpmVersion('electron')
        console.log(electronVersion)
        const name = packageInfo.name
        const packagerConf = {
            dir: this.config.destPath,
            out: 'release/',
            name,
            appVersion: packageInfo.version,
            arch: ['x64'],
            asar: true,
            platform: 'darwin',
            electronVersion,
            icon: path.join(this.config.destPath, 'app.icns'),
            overwrite: true
        }

        packager(packagerConf, (err, dir) => {
            if (err) {
                logger.error(err)
                return
            }
            createInstaller({
                appPath: `${dir}/${name}.app`,
                name,
                overwrite: true,
                out: 'release/'
            }, err2 => {
                if (err2) {
                    logger.error(err2.toString())
                } else {
                    console.log(`create macOS DMG -> release/${name}.dmg`)
                }
            })
        })
    }
    finalize() {
        this.finalizeMac()
    }
}

module.exports = ElectornPackagePostBuild
