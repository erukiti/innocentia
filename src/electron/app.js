const fs = require('fs')
const path = require('path')
const {app} = require('electron')
const logger = require('logger').getLogger()

let destPath = null
const renderers = []
let browserApp = null

let mode = null


process.argv.slice(2).forEach(s => {
    switch (mode) {
        case 'b': {
            browserApp = s
            break
        }
        case 't': {
            destPath = s
            mode = null
            break
        }

        case 'r': {
            renderers.push(s)
            mode = null
            break
        }

        case null: {
            switch (s) {
                case '-d':
                case '--dest': {
                    mode = 'd'
                    break
                }
                case '-r':
                case '--renderer': {
                    mode = 'r'
                    break
                }
                case '-b':
                case '--browser': {
                    mode = 'b'
                    break
                }
            }
            break
        }

        default: {
            console.error('unknown options')
            process.exit(1)
        }
    }
})

logger.log('destination', destPath)
logger.log('--browser', browserApp)
logger.log('--renderers', renderers)

const setElectron = () => {
    const {name, version, desktopName} = JSON.parse(fs.readFileSync('./package.json').toString())
    app.setName(name)
    app.setVersion(version)
    app.setDesktopName(desktopName || `${name}.desktop`)
    app.on('browser-window-created', (ev, win) => {
        // client.create(win, {sendBounds: false})
    })
}

setElectron()

if (renderers.length === 0) {
    const projectPath = path.resolve('./')

    const getAppFilePath = () => {
        if (browserApp) {
            return browserApp
        }
        const packageJsonPath = path.join(projectPath, 'package.json')
        const {main} = JSON.parse(fs.readFileSync(packageJsonPath).toString())
        return main
    }
    const appFilePath = getAppFilePath()
    logger.log(appFilePath)

    const getRelative = s => {
        const relative = path.resolve(__dirname).substr(projectPath.length + 1).split('/').map(() => '..').join('/')
        return `${relative}/${s}`
    }

    const appRelative = getRelative(appFilePath)

    const old = require.extensions['.js']
    require.extensions['.js'] = (m, filename) => {
        if (filename.substr(0, projectPath.length) !== projectPath) {
            old(m, filename)
            return
        }

        const replaced = fs.readFileSync(filename).toString().replace(
            /\.loadURL\(([^)]+)\)/,
            '.loadURL(__urlConv($1))'
        )

        const code = `
    const __urlConv = s => s.replace('file://${projectPath}', 'file://${destPath}/')
    ${replaced}`
        m._compile(code, filename)
    }

    require(appRelative)
} else {
    const {BrowserWindow, ipcMain} = require('electron')

    app.on('window-all-closed', () => {
        app.quit()
    })

    const windows = []
    let windowNumber = 0

    const createWindow = ({url, x = 0, y = 0, width = 800, height = 600}) => {
        logger.log(`loading: ${url}`)
        const win = new BrowserWindow({width, height, x, y})
        win.loadURL(url)
        win.on('closed', () => {
            windows[windowNumber] = null
        })

        windows[windowNumber] = win
        windowNumber++
    }

    app.on('ready', () => {
        renderers.forEach(file => {
            // createWindow({url: `file://${__dirname}/../examples/pomodoro-timer/index.html`})
            createWindow({url: `http://localhost:${port}/${file}`})
        })

        // ipcMain.on('log', (ev, arg) => {
        //     windows[1].webContents.send('log', arg)
        // })
    })

}
