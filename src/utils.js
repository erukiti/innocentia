const path = require('path')

class Utils {
    static requireLocal(pluginName, basepath = './') {
        const pluginPath = path.resolve(path.join(basepath, 'node_modules', pluginName))
        return require(pluginPath)
    }
}

module.exports = Utils
