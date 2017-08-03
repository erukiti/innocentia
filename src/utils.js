const path = require('path')
const fs = require('fs')
const {getLogger} = require('lignum')
const logger = getLogger('innocentia')

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
}

module.exports = Utils
