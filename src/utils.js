const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')
const {getLogger} = require('lignum')
const logger = getLogger()


const getPluginPath = (pluginName, basepath = './') => {
    return path.resolve(path.join(basepath, 'node_modules', pluginName))
}

class Utils {
    static requireLocal(pluginName, basepath = './') {
        const pluginPath = getPluginPath(pluginName, basepath)
        logger.log('require', pluginPath)
        return require(pluginPath)
    }

    static checkLocalModule(pluginName, basepath = './') {
        const pluginPath = getPluginPath(pluginName, basepath)
        try {
            fs.statSync(pluginPath)
            return true
        } catch (e) {
            return false
        }
    }

    static searchPlugins(re, basepath = './') {
        const dirpath = path.join(basepath, 'node_modules')
        return fs.readdirSync(dirpath).filter(s => re.test(s))
    }

    static exec(cmd) {
        return new Promise((resolve, reject) => {
            const child = childProcess.exec(cmd)

            // FIXME: use Buffer
            let stdout = ''
            let stderr = ''
            let mixed = ''

            child.stdout.on('data', chunk => {
                stdout += chunk.toString()
                mixed += chunk.toString()
            })

            child.stderr.on('data', chunk => {
                stderr += chunk.toString()
                mixed += chunk.toString()
            })

            child.on('error', err => {
                reject(err)
            })
            child.on('exit', (code, signal) => {
                // await waitStream(child.stdout)
                // await waitStream(child.stderr)
                resolve({code, stdout, stderr, mixed})
            })
        })
    }

}

module.exports = Utils
