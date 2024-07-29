import F, {formatV} from '@tremho/gen-format'

import Configuration, {ConfigSchema, DisplayOptions, ElementType, FormatType, nfs, TargetType} from "./Configuration"
import {FuncFileLine, StackLineParser} from "./StackLineParser";
import {getSourceMap} from "./SourceMap";

let npath:any
if(nfs) {
    npath = require('path')
}


/*
const trace = require('tns-core-modules/trace')
const application = require('tns-core-modules/application')
const sauceCode = require('~/util/SauceCode')

const { FileSystemAccess } = require('tns-core-modules/file-system/file-system-access')

// we use our formatter
const formatter = require('~/util/Formatter')

// We hook ourselves into Telemetry
const Telemetry = require('~/modules/Telemetry')
*/

/*
Categories for Thunderbolt are:
- Default - no specified category
- Page  - code the developer writes in pages
- Component - code that comes from a component
- Extension (api extension) - code the developer writes as app core extensions
- Service - code that reaches out to a service (developer or framework)
- Framework - code that comes from the framework and/or implementation tech

categories should be kept in a list that can be added to by developer and selected like others
it's just a string from a set of strings known by convention.

writers attach to targets and may include filtered categories and levels

By config, developer chooses which categories are routed to which target.
By default:
Default, Page, Component, App-extension -- to App Console (Electron debug window)
Back-extension, Service, and Framework -- to Dev Console
(For Nativescript, all go Dev Console by default, since there is no app console)

Loggers are kept by category, so we import the loggers we need
```
import * as Logging from 'Log'
const Log = Logging.getLogger('Page')
```
or
```
import {getLogger} from 'Log'
const ExtLog = getLogger('Extension')
const ServiceLog = getLogger('Service')
```
or, in a pinch (no clear category)
```
const Log = getLogger('Default')
```


 */

// ------------ start of api section --------------------------------

const levelNames = ["trace", "debug", "log", "info", "warn", "error", "exception", "fatal"]

let memoryCaches:any = {}
let definedLoggers:any = {}
let knownCategories:string[] = []

export function createLogFileWriter(name:string, filePath:string):LogWriter {
    const target = new LogTarget(name, TargetType.LogFile, filePath)
    target.displayOptions.format = FormatType.json
    target.outputLogToDestination = (location:string, formatted:string, category:string, level:string, stack:string|null, xargs:any[]|null) => {
        if(!target.state) {
            target.state = { open: rotateLogFile(filePath) }
        }
        const file = target.state.open
        try {
            nfs.appendFileSync(file, formatted+'\n')
        } catch(e) {
            console.error('Error writing to logfile '+filePath, e)
        }
    }
    return new LogWriter(target)
}

function rotateLogFile(filePath:string) {
    if(!nfs) {
        console.warn("no file interface available")
        return filePath;
    }
    const logDir = npath.dirname(filePath)
    if(!nfs.existsSync(logDir)) nfs.mkdirSync(logDir, {recursive: true})

    if(!nfs.existsSync(filePath)) return filePath

    let hn = 0;
    let logName = npath.basename(filePath)
    let xi = logName.lastIndexOf('.')
    if(xi !== -1) logName = logName.substring(0, xi)
    const ext = npath.extname(filePath)
    const files = nfs.readdirSync(logDir)
    for (let f of files) {
        xi = f.lastIndexOf('.')
        if(xi !== -1) f = f.substring(0, xi)
        if (f.startsWith(logName)) {
            const n = Number(f.substring(f.length - 1))
            if (n > hn) hn = n
        }
    }
    return npath.join(logDir, logName)+(hn+1)+ext;

}

/**
 * Returns the set of established categories as defined in configuration.
 */
export function getCategories() {
    return knownCategories
}

/**
 * Adds a new category to the set of known categories
 * @param category
 */
export function addCategory(category:string) {
    knownCategories.push(category)
}

/**
 * Removes a category from the set of known categories
 * @param category
 */
export function removeCategory(category:string) {
    let n = knownCategories.indexOf(category)
    if(n !== -1) {
        knownCategories.splice(n,1)
    }
}

/**
 * Loads the logger configuration JSON from the given path and sets the configuration.
 * This establishes the loggers and output writers, as well as category and level
 * definitions, color settings, and output formats to use.
 * See the documentation section on Configuration for more information.
 *
 * Available in Node settings.  For browser-based contexts, load your config
 * via a script or AJAX operation and call `setLoggerConfig` rather than use this method.
 *
 * @throws Error if Node is not available or file is not found at path.
 *
 * @param path
 */
export function loadLoggerConfig(path:string) {
    const cfg = new Configuration()
    cfg.loadConfigFile(path)
    setLoggerConfig(cfg.configSchema)
}

/**
 * Sets the configuration from a JSON text string.
 * If you've loaded a parsed script, or have constructed a JS object,
 * call `setLoggerConfig` instead.
 * @param json
 */
export function setLoggerConfigJSON(json:string) {
    const cfg = new Configuration()
    const config = JSON.parse(json)
    setLoggerConfig(config)
}

/**
 * Creates and returns a default logger suitable for general console purposes
 * It has a single writer ('Console') that outputs in color.
 */
export function createDefaultLogger() : Logger {
    setLoggerConfig( {
        loggers: [
            {
                name: 'Default',
                writers: ['Console']
            }
        ],
        writers: [
            {
                name: 'Console',
                type: 'Console',
                colors: { inherits: 'Standard' },
                display: {
                    supportsColor: true
                }
            }
        ],
        colorSchemes : [
            {
                name: 'Standard',
                default: {
                    time: 1,
                    message: 4,
                    func: 24,
                    file: 240,
                    line: 0,
                    startGroup: ["#FFF", "#00F"],
                    endGroup: ["#555", "#ACA"],
                    trace: {
                        level: 8,
                        message: 8
                    },
                    debug: {
                        level: 142,
                        message: 108
                    },
                    log: {
                        level: 2,
                        message: 22
                    },
                    info: {
                        level: 45,
                        message: 18
                    },
                    warn: {
                        level: [0,11],
                        message: 3
                    },
                    error: {
                        level: [0,1],
                        message: 1,
                        stack: true,
                        stackColor: 242
                    },
                    fatal: {
                        level: ["#FFF", "#000"],
                        message: 1,
                        stack: true,
                        stackColor: 8
                    },
                    exception: {
                        level: [0, 1],
                        message: 6,
                        stack: true,
                        stackColor: 242
                    }
                }
            }
        ]
    })
    return getLogger('Default')
}

/**
 * Use to set the Logger configuration from an object resolved from JSON or
 * constructed dynamically.
 * Use in browser-based contexts, since `loadLoggerConfig` in unavailable without Node support.
 * This establishes the loggers and output writers, as well as category and level
 * definitions, color settings, and output formats to use.
 * See the documentation section on Configuration for more information.
 * @param config
 */
export function setLoggerConfig(config:ConfigSchema) {
    // reset categories to start
    knownCategories = ['Default']
    if(config.categories) {
        for(let i=0; i<config.categories.length; i++) {
            addCategory(config.categories[i].name)
        }
    }
    // create the set of writers
    const writers = config.writers || []
    const writerSet:any = {}
    for(let i=0; i<writers.length; i++) {
        const writer = writers[i]
        let location
        switch(writer.type) {
            case TargetType.Console:
                location = writer.consoleType ? writer.consoleType.toString() : 'tty'
                break
            case TargetType.Memory:
                location = writer.memoryName || writer.name
                break
            case TargetType.LogFile:
                location = writer.filePath
                break
            case TargetType.Service:
                location = writer.serviceUrl
                break
        }
        const isColor = writer.display && writer.display.supportsColor
        const target = new LogTarget(writer.name, writer.type, location, isColor)

        if(isColor) {
            // set the color configuration
            target.supportsColor = isColor
            target.location = location
            if(target.type === TargetType.Console && target.location === 'browser') {
                target.supportsColor = false; // ansi color off for google color on
            }
            target.displayOptions.colorReset = writer.display.colorReset || '\u001b[0m'
            if(target.type === TargetType.Console && target.location === 'browser') {
                // ansi color off for google color on
                target.supportsColor = false;
                target.displayOptions.colorReset = ''
            }

            let colors:any = writer.colors
            if(colors) {
                if(colors.inherits) {
                    const cfg = new Configuration()
                    cfg.configSchema = config
                    const base = cfg.readColorScheme(colors.inherits)
                    colors = Object.assign(colors, base)

                }
                // Map from the config organization to the organization used by the code
                target.colorCategories = {}
                for(let i=0; i<knownCategories.length; i++) {
                    let catName = knownCategories[i]
                    if(catName === 'Default') catName = 'default'
                    if(colors[catName]) {
                        target.colorCategories[catName] = colors[catName]
                    }
                }
                colors = colors['default'] || {}
                target.colorLevels = {}
                for(let i=0; i<levelNames.length; i++) {
                    let lvlName = levelNames[i]
                    if(colors[lvlName]) {
                        target.colorLevels[lvlName] = colors[lvlName]
                    }
                    for(let n=0; n<10; n++) {
                        if(colors[lvlName+n]) {
                            target.colorLevels[lvlName+n] = colors[lvlName+n]
                        }
                    }
                    // if(colors['exception']) {
                    //     target.colorLevels['error1'] = colors['exception']
                    // }
                    // if(colors['crash']) {
                    //     target.colorLevels['error2'] = colors['crash']
                    // }
                    // if(colors['fatal']) {
                    //     target.colorLevels['error2'] = colors['fatal']
                    // }
                }
            }
        }
        if(writer.display) {
            if (writer.display.format) target.displayOptions.format = writer.display.format
            if (writer.display.order) target.displayOptions.order = writer.display.order
        } else {
            target.displayOptions.format = FormatType.text
            target.displayOptions.order = [
                ElementType.time,
                ElementType.function,
                ElementType.source,
                ElementType.category,
                ElementType.level,
                ElementType.message
            ]
        }

        if(writerSet[writer.name]) {
            throw Error(`LogWriter "${writer.name}" has already been defined`)
        }
        writerSet[writer.name] = new LogWriter(target)
    }
    // now create our set of loggers and bind to their writers
    definedLoggers = {}
    const loggers = config.loggers || []
    for(let i=0; i< loggers.length; i++) {
        const logger = loggers[i]
        const lgr = new Logger()
        const lgrwrts = logger.writers || []
        for(let n=0; n<lgrwrts.length; n++) {
            const lgwrt = lgrwrts[n]
            lgr.addWriter(writerSet[lgwrt])
        }
        if(!definedLoggers[logger.name]) {
            definedLoggers[logger.name] = lgr
        } else {
            throw Error(`Logger "${logger.name}" has already been defined`)
        }
    }
}

/**
 * Return a configured Logger by name
 * @param name
 */
export function getLogger(name:string) {
    const logger =  definedLoggers[name]
    if(!logger) {
        throw Error('Logger "'+name+'" not defined')
    }
    return logger
}

/**
 * Read the accumulated text in the named memory log.
 * Note that the name of a Memory log is established with the 'memoryName' property of
 * the writer configuration, or the name of the writer itself if no 'memoryName' is provided.
 * See the section on Configuration for more info.
 *
 * @param name
 */
export function readMemoryLog(name:string) {
    return memoryCaches[name]
}

/**
 * Clears the memory buffer text for this Memory log.
 * @param name
 */
export function clearMemoryLog(name:string) {
    memoryCaches[name] = ''
}

// ------------ end of api section --------------------------------


// const defaultLevelColors = {
//     background: '',
//     time: 1,
//     message: 4,
//     func: 24,
//     file: 240,
//     line: 0,
//     trace: {
//       ???
//     },
//     debug: {
//         level: 142,
//         message: 108,
//         stack: false,
//         stackColor: 0
//     },
//     log: {
//         level: 2,
//         message: 22,
//         stack: false,
//         stackColor: 0
//     },
//     info: {
//         level: 45,
//         message: 18,
//         stack: false,
//         stackColor: 0
//     },
//     warn: {
//         level: [0, 11],
//         message: 3,
//         stack: false,
//         stackColor: 0
//     },
//     error: {
//         level: [15, 1],
//         message: 1,
//         stack: true,
//         stackColor: 242
//     },
//     error1: {
//         level: [0, 208],
//         message: 208,
//         stack: true,
//         stackColor: 242
//     }
// }

/**
 * The writer output callback for custom writers
 */
interface LogWriterOutput {
    outputLogToDestination?: (location: string, formatted: string, category: string, level: string, stack: string | null, xargs: any[] | null) => void
}

/**
 * A target names the target type and location
 */
export class LogTarget implements LogWriterOutput {
    public name: string
    public type: TargetType | string
    public location?: string // file path or service url for LogFile or Service type; App/Dev for Console
    public supportsColor?: boolean // true if ANSI color codes are supported on this device
    public colorCategories?: any
    public colorLevels?: any
    public state?:any
    public displayOptions: DisplayOptions = new DisplayOptions()

    constructor(name: string, type: TargetType | string, location?: string, color?: boolean) {
        this.name = name
        this.type = type
        this.location = location
        this.supportsColor = color || false // N.B. intentionally redundant to displayOptions.supportsColor
        this.colorLevels = {}
        this.colorCategories = {default: {}}
        this.displayOptions = {
            supportsColor: color || false,
            colorReset: color ? '\u001b[0m' : '',
            prefix: '- ',
            format: FormatType.text, // default, config may change
            order: [ElementType.time, ElementType.function, ElementType.source, ElementType.category, ElementType.level, ElementType.message], // default
        }
    }

    outputLogToDestination(location: string, formatted: string, category: string, level: string, stack: string | null, xargs: any[] | null) {
        console.warn(`>> outputToDestination must be immplemented in custom writer for logger ${this.name}>>`)
    }

}

/**
 * Defines where the output will appear, and what categories/levels are filtered
 */
export class LogWriter {
    public target: LogTarget
    private categoryExcludes: string[] = []
    private levelExcludes: string[] = []

    constructor(target:LogTarget) {
        this.target = target
    }

    includeCategory(category:string, ...more:string[]) {
        let n = this.categoryExcludes.indexOf(category)
        if(n !== -1) {
            this.categoryExcludes.splice(n, 1)
        }
        if(more && more.length) {
            let next = more.shift()
            if(next) this.includeCategory(next, ...more)
        }

    }
    excludeCategory(category:string, ...more:string[]) {
        if (this.categoryExcludes.indexOf(category) === -1) {
            this.categoryExcludes.push(category)
        }
        if (more && more.length) {
            let next = more.shift()
            if (next) this.excludeCategory(next, ...more)
        }
    }

    includeLevel(level:string, ...more:string[]) {
        let n = this.levelExcludes.indexOf(level)
        if(n !== -1) {
            this.levelExcludes.splice(n, 1)
        }
        if(more && more.length) {
            let next = more.shift()
            if(next) this.includeLevel(next, ...more)
        }
    }

    excludeLevel(level:string, ...more:string[]) {
        if (this.levelExcludes.indexOf(level) === -1) {
            this.levelExcludes.push(level)
        }
        if (more && more.length) {
            let next = more.shift()
            if (next) this.excludeLevel(next, ...more)
        }
    }

    clearLevelExclusions() {
        this.levelExcludes = []
    }

    clearCategoryExclusions() {
        this.categoryExcludes = []
    }

     isCategoryExcluded(category:string) {
        return this.categoryExcludes.indexOf(category) !== -1
    }

    isLevelExcluded(level:string) {
        let lvlType = level.substring(0, level.length-1)
        return this.levelExcludes.indexOf(level) !== -1 || this.levelExcludes.indexOf(lvlType) !== -1
    }

    outputLog(formatted:string, category:string, level:string, stack:string|null, xargs:any[]|null) {
        switch(this.target.type) {
            case TargetType.Console: {
                const googleColor = this.target.location === 'browser'
                if(googleColor) {
                    const c = this.getColors(category, level)
                    let lineStyle = googleColor ? c.browserLineStyle : '' //this.target.googleLineStyle
                    if(!xargs) xargs = []
                    console.log(formatted, lineStyle, ...xargs, stack || '')
                } else {
                    return console.log(formatted, stack || '')
                }
            }
            case TargetType.Memory: {
                const name = this.target.location as string
                let str = memoryCaches[name] || ''
                str += formatted + '\n'
                memoryCaches[name] = str
                return
            }
            default: { // LogFile and Service
                this.target.outputLogToDestination(this.target.location ?? '', formatted, category, level, stack, xargs)
                return
            }
        }
    }

    startGroup(indent:number, groupName:string) {
        if(this.target.displayOptions.format !== FormatType.json) {
            if (this.target.type === TargetType.Console) {
                const c = this.target.colorCategories['default'] || {}
                if (this.target.location === 'browser') {
                    console.groupCollapsed('%c ' + groupName, c.groupStyle || '')
                } else {
                    const pad = indent ? ' '.repeat(indent * 2) : ''
                    const reset = (this.target.displayOptions.colorReset) || ''
                    console.log(pad + applyColor(c.startGroup) + ' <' + groupName + '> ' + reset)
                }
            }
        }
    }
    endGroup(indent:number, groupName:string) {
        if(this.target.displayOptions.format !== FormatType.json) {
            if (this.target.type === TargetType.Console) {
                const c = this.target.colorCategories['default'] || {}
                if (this.target.location === 'browser') {
                    console.groupEnd()
                } else {
                    const pad = indent ? ' '.repeat(indent * 2) : ''
                    const reset = (this.target.displayOptions.colorReset) || ''
                    console.log(pad + applyColor(c.endGroup) + ' </' + groupName + '> ' + reset)
                }
            }
        }
    }

    /**
     * Returns the colors to use per display item for a given category and level
     * @param category
     * @param level
     * @returns Object containing color info
     */
    private getColors (category:string, level:string) {

        let glevel = level && isFinite(Number(level.charAt(level.length - 1))) && level.substring(0, level.length - 1)
        if(!glevel) glevel = ''
        const def = this.target.colorCategories['default'] || {}
        const lvl = this.target.colorLevels[level] || this.target.colorLevels[glevel] || def[level] || def[glevel] || {}
        const cat = this.target.colorCategories[category] || {}
        const catLevel = cat[level] || {}
        const catGlevel = cat[glevel] || {}

        return {
            browserLineStyle: catLevel.browserLineStyle || catGlevel.browserLineStyle || cat.browserLineStyle || lvl.browserLineStyle || def.browserLineStyle,
            time: applyColor(catLevel.time || catGlevel.time || cat.time || lvl.time || def.time),
            file: applyColor(catLevel.file || catGlevel.file || cat.file || lvl.file || def.file),
            func: applyColor(catLevel.func || catGlevel.func || cat.func || lvl.func || def.func),
            line: applyColor(catLevel.line || catGlevel.line || cat.line || lvl.line || def.line),
            level: applyColor(catLevel.level || catGlevel.level || cat.level || lvl.level || def.level),
            category: applyColor(catLevel.category || catGlevel.category || cat.category || lvl.category || def.category),
            message: applyColor(catLevel.message || catGlevel.message || cat.message || lvl.message || def.message),
            stack: lvl.stackColor? applyColor(lvl.stack && lvl.stackColor) : lvl.stack
        }
    }

    /**
     * Support output as JSON
     */
    composeJSON(time:number, category:string, level:string, ffl:FuncFileLine, fmesg:string, stackdump:string):string {
        const job:any = {}
        const include:any = {}
        const ps = this.target.displayOptions.order || []
        ps.forEach(p => {
            include[p] = true
        })
        const { file, func, line } = (ffl || {})
        job.time = include.time && time
        job.function = include.function && func
        job.file = include.source && file
        job.line = include.source && line
        job.category = include.category && category
        job.level = include.level && level
        job.message = include.message && fmesg
        if(stackdump) job.stack = stackdump

        return JSON.stringify(job)
    }

    /**
     * Format the log output
     */
    logFormat (time:number, category:string, level:string, ffl:FuncFileLine, stackParser:StackLineParser, message:string, ...args:any[]) {
        let fmesg = ''
        const { file, func, line, column } = (ffl || {})
        const sfx = Number(level.charAt(level.length - 1)) || 0
        let dlvl = level.toUpperCase()
        if (!sfx) dlvl = dlvl.substring(0, dlvl.length - 1)
        // if (dlvl === 'ERROR1') dlvl = 'EXCEPTION'
        // if (dlvl === 'ERROR2') {
        //     dlvl = 'FATAL'
        // }

        const c = this.getColors(category, level)
        if (category === 'Default') category = ''
        if (category) category = '[' + category + ']'

        const googleColor = (this.target.type === TargetType.Console && this.target.location === 'browser')
        let xargs,stackdump
        let out = googleColor ? '%c ': ''
        out += this.target.displayOptions.prefix
        if (this.target.supportsColor) {
            out += this.target.displayOptions.colorReset || ''
        }
        if (this.target.displayOptions.order?.indexOf(ElementType.time) !== -1) {
            if (this.target.supportsColor) {
                out += c.time
            }
            out += F('date?local|hhhh:mm:ss.sss', time)
            if (this.target.supportsColor) {
                out += this.target.displayOptions.colorReset || ''
            }
            out += ' '
        }
        if (this.target.displayOptions.order?.indexOf(ElementType.source) !== -1) {
            if (this.target.supportsColor) {
                out += c.func
            }
            out += `${func || ''}`
            if (this.target.supportsColor) {
                out += this.target.displayOptions.colorReset || ''
            }
            out += '('
            if (this.target.supportsColor) {
                out += c.file
            }
            out += `${file || ''}`
            if (this.target.supportsColor) {
                out += this.target.displayOptions.colorReset || ''
            }
            out += ':'
            if (this.target.supportsColor) {
                out += c.line
            }
            out += `${line || ''}`
            // out += `:${column || ''}`
            if (this.target.supportsColor) {
                out += this.target.displayOptions.colorReset || ''
            }
            out += ') '
        }
        if (this.target.displayOptions.order?.indexOf(ElementType.category) !== -1) {
            if (this.target.supportsColor) {
                out += c.category
            }
            out += `${category || ''}`
            if (this.target.supportsColor) {
                out += this.target.displayOptions.colorReset || ''
            }
            if (category) out += ' '
        }
        if (this.target.displayOptions.order?.indexOf(ElementType.level) !== -1) {
            if (this.target.supportsColor) {
                out += c.level
            }
            out += ` ${dlvl || ''} `
            if (this.target.supportsColor) {
                out += this.target.displayOptions.colorReset || ''
            }
            out += ' '
        }
        if (this.target.displayOptions.order?.indexOf(ElementType.message) !== -1) {
            if (this.target.supportsColor) {
                out += c.message
            }

            // count the number of format specs we have in string
            let matches = message.match(/\$[\d[a-z]*\([a-z|A-Z|0-9|\.|,]*\)/g) || []
            if(matches.length < args.length) {
                xargs = args.slice(matches.length)
                if(!googleColor) {
                    // chrome will format the object for us, but we need to turn it to a string ourselves.
                    for (let i = matches.length+1; i <= args.length; i++) {
                        if (i > 1) message += ', '
                        message += '$(,)'
                    }
                }
            }
            // if we have a $ in the message, but no args, treat this literally by making a single arg message
            if (!args.length && matches.length) {
                args.push(message)
                message = '$1(,)'
            }

            if(!googleColor) {
                // chrome displays objects nicely, but we need to pretty print them for a standard console
                for (let i = 0; i < args.length; i++) {
                    if (typeof args[i] === 'object' && !Array.isArray(args[i])) {
                        try {
                            args[i].toString = () => {
                                try {
                                    let rt = JSON.stringify(args[i], expandObject, 2)
                                    if (rt.charAt(0) === '{') rt = '\n' + rt
                                    return rt
                                } catch (e) {
                                    return '\n{-unparseable-} ' + (e || '!')
                                }
                            }
                        } catch (e) {
                        }
                        args[i] = args[i] ? args[i].toString() : '[null]'
                    }
                }
            }

            fmesg = formatV(message || '', ...args)
            out += fmesg
        }
        if (this.target.supportsColor) {
            out += this.target.displayOptions.colorReset || ''
        }
        if (c.stack) {
            stackdump = ''
            const stackLines = ffl.stackLines
            if(this.target.supportsColor) stackdump += c.stack
            while (stackLines.length) {
                const ln = stackLines.shift()
                if (ln) {
                    const sffl:any = stackParser.parseLine(ln)
                    const smap = getSourceMap(sffl)
                    stackdump += '\n    at ' + smap.func + ' (' + smap.file + ' ' + smap.line + ')'
                }
            }
        }
        out += this.target.displayOptions.colorReset || ''
        if(this.target.displayOptions.format === FormatType.json) {
            out = this.composeJSON(time, category, level, ffl, fmesg, stackdump ?? '')
        }
        return {out, xargs, stackdump}
    }

}

export class Logger {
    private writers:LogWriter[] = []
    private groups:string[] = []
    private stackParser:StackLineParser = new StackLineParser()


    /**
     * return the array of writers attached to this logger
     */
    getWriters():LogWriter[] {
        return this.writers
    }

    /**
     * Add a new writer to this logger
     * @param writer
     */
    addWriter(writer:LogWriter) {
        if(!this.findWriter(writer.target.name)) {
            this.writers.push(writer)
        }
    }

    /**
     * Remove a writer from this logger
     * @param writer
     */
    removeWriter(writer:LogWriter) {
        let targetName = writer.target.name
        for(let i=0; i<this.writers.length; i++) {
            const wr = this.writers[i]
            if (wr.target.name === targetName) {
                this.writers.splice(i,1)
                return;
            }
        }
    }

    /**
     * Find a writer by name that belongs to this Logger
     * @param targetName
     */
    findWriter(targetName:string):LogWriter|null {
        for(let i=0; i<this.writers.length; i++) {
            const wr = this.writers[i]
            if (wr.target.name.toUpperCase() === targetName.toUpperCase()) {
                return wr
            }
        }
        return null
    }

    /**
     * Include all the levels in the writer output
     * @param writerName - name of writer to affect
     */
    includeAllLevels(writerName:string) {
        const wr = this.findWriter(writerName)
        if(wr) {
            wr.clearLevelExclusions()
        }
    }

    /**
     * Exclude all levels from the writer output
     * @param writerName - name of writer to affect
     */
    excludeAllLevels(writerName:string) {
        const wr = this.findWriter(writerName)
        if(wr) {
            wr.excludeLevel('trace', ...levelNames)
        }

    }

    /**
     * Include a level for the named writer to output
     *
     * @param writerName - name of writer to affect
     * @param level - name of level. note that granular levels are not supported. Only primary level names.
     */
    includeLevel(writerName:string, level:string) {
        const wr = this.findWriter(writerName)
        if(wr) {
            wr.includeLevel(level.toLowerCase())
        }

    }
    /**
     * Exclude a level for the named writer.
     * The writer will ignore all logs for this level
     *
     * @param writerName - name of writer to affect
     * @param level - name of level. note that granular levels are not supported. Only primary level names.
     */
    excludeLevel(writerName:string, level:string) {
        const wr = this.findWriter(writerName)
        if(wr) {
            wr.excludeLevel(level.toLowerCase())
        }
    }

    /**
     * Set a minimum level.
     * This level and above will be output by the writer.
     * levels below this will be excluded.
     *
     * @param writerName - name of writer to affect
     * @param level - name of level. note that granular levels are not supported. Only primary level names.
     */
    setMininumLevel(writerName:string, minLevel:string) {
        const wr = this.findWriter(writerName)
        const pick = levelNames.indexOf(minLevel.toLowerCase())
        if(pick !== -1) {
            const pickedLevels = levelNames.slice(pick)
            if (wr) {
                this.excludeAllLevels(writerName)
                wr.includeLevel(minLevel, ...pickedLevels)
            }
        }

    }
    /**
     * Include all the categories in the writer output
     * @param writerName - name of writer to affect
     */
    includeAllCategories(writerName:string) {
        const wr = this.findWriter(writerName)
        if(wr) {
            wr.clearCategoryExclusions()
        }
    }
    /**
     * Exclude all levels from the writer output
     * @param writerName - name of writer to affect
     */
    excludeAllCategories(writerName:string) {
        const wr = this.findWriter(writerName)
        if(wr) {
            wr.excludeCategory('trace', ...levelNames)
        }

    }
    /**
     * Include a category for the named writer to output
     *
     * @param writerName - name of writer to affect
     * @param category - name of category.
     */
    includeCategory(writerName:string, level:string) {
        const wr = this.findWriter(writerName)
        if(wr) {
            wr.includeCategory(level)
        }

    }

    /**
     * Exclude a category for the named writer.
     * This writer will ignore logs in this category.
     *
     * @param writerName - name of writer to affect
     * @param category -- name of category
     */
    excludeCategory(writerName:string, category:string) {
        const wr = this.findWriter(writerName)
        if(wr) {
            wr.excludeCategory(category)
        }

    }

    /**
     * Private method that converts a string 'level' (e.g. 'info', 'debug3', etc)
     * into the corresponding type (number) and suffix granularity.
     * @param level
     * @returns {{type, granularity}) (both properties are integers)
     * @private
     */
    _levelToType (level = '') {
        let lvl, type
        let sfx = level.charAt(level.length - 1)
        if (sfx >= '0' && sfx <= '9') {
            lvl = level.substring(0, level.length - 1)
        } else {
            lvl = level
        }
        type = lvl
        let granularity = Number(sfx) || 0
        return { type, granularity }
    }

    /**
     * Direct output to all writers, subject to filtering.
     * @param {number} time  in milliseconds
     * @param {{file, func, line, stack}} ffl
     * @param {string} category
     * @param {string} level
     * @param {string} message
     * @param {*} args arguments used for formatting message
     */
    outToWriters (time:number, ffl:FuncFileLine, category:string, level:string, message:string, ...args:any[]) {
        const typeGran = this._levelToType(level)
        for (let i = 0; i < this.writers.length; i++) {
            const writer = this.writers[i]
            // filter by category is done by the trace module already at an enabled scope; here we filter per writer
            if (writer.isCategoryExcluded(category)) {
                continue
            }

            // filter by level and granularity (granularity compared here as 1-10 instead of 9-0 for easier ordering)
            if (writer.isLevelExcluded(level)) {
                continue
            }
            // having passed filtering, output the log
            const {out, xargs, stackdump} = writer.logFormat(time, category, level, ffl, this.stackParser,message,  ...args)
            const formatted = out
            if (!formatted) {
                continue
            }
            // groups introduce indents
            const pad = this.groups.length ? ' '.repeat(this.groups.length * 2) : ''
            // trace.write(pad + formatted, category, typeGran.type)
            writer.outputLog(pad+formatted, category, typeGran.type, stackdump ?? '', xargs ?? null)
        }
    }

    /**
     * Handles passing category, message, args or simply message, args for any log level.
     * @param level
     * @param args
     * @private
     */
    _morph (level:string, ...args:any[]) {
        // TODO:Check
        // if (global.__snapshot) return; // disallow if we are in snapshot release mode

        let category = ''
        let message = ''
        let a = [...args]
        if (a.length <= 1) {
            // arg is message if it's a string and there are no other parameters
            if (typeof a[0] === 'string') {
                message = a.shift() || ''
            }
            category = 'Default'
        } else {
            if (typeof a[0] !== 'string') {
                message = a.shift()
            } else {
                // is it a registered category?
                if(knownCategories.indexOf(a[0]) !== -1) {
                    category = a.shift()
                    message = a.shift()
                } else {
                    category = 'Default'
                    message = a.shift()
                    // throw Error(`Unknown Logger Category ${a[0]}`)
                }
            }
        }
        const ffl = this.stackParser.getFuncFileLine()
        this.outToWriters(Date.now(), ffl, category, level, message, ...a)
    }

    /** Outputs log at the named level granularity */
    trace9 (...args:any[]) {
        this._morph('trace9', ...args)
    }
    /** Outputs log at the named level granularity */
    trace8 (...args:any[]) {
        this._morph('trace8', ...args)
    }
    /** Outputs log at the named level granularity */
    trace7 (...args:any[]) {
        this._morph('trace7', ...args)
    }
    /** Outputs log at the named level granularity */
    trace6 (...args:any[]) {
        this._morph('trace6', ...args)
    }
    /** Outputs log at the named level granularity */
    trace5 (...args:any[]) {
        this._morph('trace5', ...args)
    }
    /** Outputs log at the named level granularity */
    trace4 (...args:any[]) {
        this._morph('trace4', ...args)
    }
    /** Outputs log at the named level granularity */
    trace3 (...args:any[]) {
        this._morph('trace3', ...args)
    }
    /** Outputs log at the named level granularity */
    trace2 (...args:any[]) {
        this._morph('trace2', ...args)
    }
    /** Outputs log at the named level granularity */
    trace1 (...args:any[]) {
        this._morph('trace1', ...args)
    }
    /** Outputs log at the named level granularity */
    trace0 (...args:any[]) {
        this._morph('trace0', ...args)
    }
    /** Synonymous with trace0 */
    trace (...args:any[]) {
        this.trace0(...args)
    }


    /** Outputs log at the named level granularity */
    debug9 (...args:any[]) {
        this._morph('debug9', ...args)
    }

    /** Outputs log at the named level granularity */
    debug8 (...args:any[]) {
        this._morph('debug8', ...args)
    }

    /** Outputs log at the named level granularity */
    debug7 (...args:any[]) {
        this._morph('debug7', ...args)
    }

    /** Outputs log at the named level granularity */
    debug6 (...args:any[]) {
        this._morph('debug6', ...args)
    }

    /** Outputs log at the named level granularity */
    debug5 (...args:any[]) {
        this._morph('debug5', ...args)
    }

    /** Outputs log at the named level granularity */
    debug4 (...args:any[]) {
        this._morph('debug4', ...args)
    }

    /** Outputs log at the named level granularity */
    debug3 (...args:any[]) {
        this._morph('debug3', ...args)
    }

    /** Outputs log at the named level granularity */
    debug2 (...args:any[]) {
        this._morph('debug2', ...args)
    }

    /** Outputs log at the named level granularity */
    debug1 (...args:any[]) {
        this._morph('debug1', ...args)
    }

    /** Outputs log at the named level granularity */
    debug0 (...args:any[]) {
        this._morph('debug0', ...args)
    }

    /** Synonymous with debug0 */
    debug (...args:any[]) {
        this.debug0(...args)
    }

    /** Outputs log at the named level granularity */
    log9 (...args:any[]) {
        this._morph('log9', ...args)
    }

    /** Outputs log at the named level granularity */
    log8 (...args:any[]) {
        this._morph('log8', ...args)
    }

    /** Outputs log at the named level granularity */
    log7 (...args:any[]) {
        this._morph('log7', ...args)
    }

    /** Outputs log at the named level granularity */
    log6 (...args:any[]) {
        this._morph('log6', ...args)
    }

    /** Outputs log at the named level granularity */
    log5 (...args:any[]) {
        this._morph('log5', ...args)
    }

    /** Outputs log at the named level granularity */
    log4 (...args:any[]) {
        this._morph('log4', ...args)
    }

    /** Outputs log at the named level granularity */
    log3 (...args:any[]) {
        this._morph('log3', ...args)
    }

    /** Outputs log at the named level granularity */
    log2 (...args:any[]) {
        this._morph('log2', ...args)
    }

    /** Outputs log at the named level granularity */
    log1 (...args:any[]) {
        this._morph('log1', ...args)
    }

    /** Outputs log at the named level granularity */
    log0 (...args:any[]) {
        this._morph('log0', ...args)
    }

    /** Synonymous with log0 */
    log (...args:any[]) {
        this.log0(...args)
    }

    /** Outputs log at the named level granularity */
    info9 (...args:any[]) {
        this._morph('info9', ...args)
    }

    /** Outputs log at the named level granularity */
    info8 (...args:any[]) {
        this._morph('info8', ...args)
    }

    /** Outputs log at the named level granularity */
    info7 (...args:any[]) {
        this._morph('info7', ...args)
    }

    /** Outputs log at the named level granularity */
    info6 (...args:any[]) {
        this._morph('info6', ...args)
    }

    /** Outputs log at the named level granularity */
    info5 (...args:any[]) {
        this._morph('info5', ...args)
    }

    /** Outputs log at the named level granularity */
    info4 (...args:any[]) {
        this._morph('info4', ...args)
    }

    /** Outputs log at the named level granularity */
    info3 (...args:any[]) {
        this._morph('info3', ...args)
    }

    /** Outputs log at the named level granularity */
    info2 (...args:any[]) {
        this._morph('info2', ...args)
    }

    /** Outputs log at the named level granularity */
    info1 (...args:any[]) {
        this._morph('info1', ...args)
    }

    /** Outputs log at the named level granularity */
    info0 (...args:any[]) {
        this._morph('info0', ...args)
    }

    /** Synonymous with info0 */
    info (...args:any[]) {
        this.info0(...args)
    }

    /** Outputs log at the named level granularity */
    warn9 (...args:any[]) {
        this._morph('warn9', ...args)
    }

    /** Outputs log at the named level granularity */
    warn8 (...args:any[]) {
        this._morph('warn8', ...args)
    }

    /** Outputs log at the named level granularity */
    warn7 (...args:any[]) {
        this._morph('warn7', ...args)
    }

    /** Outputs log at the named level granularity */
    warn6 (...args:any[]) {
        this._morph('warn6', ...args)
    }

    /** Outputs log at the named level granularity */
    warn5 (...args:any[]) {
        this._morph('warn5', ...args)
    }

    /** Outputs log at the named level granularity */
    warn4 (...args:any[]) {
        this._morph('warn4', ...args)
    }

    /** Outputs log at the named level granularity */
    warn3 (...args:any[]) {
        this._morph('warn3', ...args)
    }

    /** Outputs log at the named level granularity */
    warn2 (...args:any[]) {
        this._morph('warn2', ...args)
    }

    /** Outputs log at the named level granularity */
    warn1 (...args:any[]) {
        this._morph('warn1', ...args)
    }

    /** Outputs log at the named level granularity */
    warn0 (...args:any[]) {
        this._morph('warn0', ...args)
    }

    /** Synonymous with warn0 */
    warn (...args:any[]) {
        this.warn0(...args)
    }

    /** Used to output a log related to an error. */
    error (...args:any[]) {
        this._morph('error0', ...args)
    }

    /** Used to output a log related to an exception.*/
    exception (...args:any[]) {
        let maybeErr:any = args[0]
        if(typeof maybeErr === 'function') {
            maybeErr = maybeErr()
        }
        if(maybeErr instanceof Error) {
            args[0] = maybeErr.message
            const stack = maybeErr.stack
            if(stack) {
                const firstLine = stack.split('\n')[1].trim()
                const ffl = getSourceMap(this.stackParser.parseLine(firstLine))
                args.push(` on line ${ffl.line} of ${ffl.file}`)
            }
        }
        this._morph('exception0', ...args)
    }

    /** Used to output a log related to non-recoverable crash.*/
    fatal (...args:any[]) {
        this._morph('fatal0', ...args)
    }
    /** alias for fatal */
    crash (...args:any[]) {
        this.fatal(...args)
    }

    /** alias for trace */
    Trace(...args:any[]) {
        this.trace(...args)
    }
    /** alias for debug */
    Debug(...args:any[]) {
        this.debug(...args)
    }
    /** alias for log */
    Log(...args:any[]) {
        this.log(...args)
    }
    /** alias for info */
    Info(...args:any[]) {
        this.info(...args)
    }
    /** alias for warb */
    Warn(...args:any[]) {
        this.warn(...args)
    }
    /** alias for error */
    Error(...args:any[]) {
        this.error(...args)
    }
    /** alias for fatal */
    Critical(...args:any[]) {
        this.fatal(...args)
    }
    /** alias for exception */
    Exception(...args:any[]) {
        this.exception(...args)
    }


    /**
     * Declares the start of a contextual group of related log statements.
     * In the ConsoleWriter, Log statements following a group declaration appear slightly indented so as to form
     * a visually grouped collection.  The group block is preceded by a label tag announcing the name of the group.
     *
     * Other Writer implementations may handle `group` blocks in different ways.  Interactive log clients may support
     * collapsible sections.
     *
     * Groups are concluded with `groupEnd` statments.
     *
     * Groups initiated when another group is active appear nested within the former group.
     *
     * @param name
     */
    group (name:string) {
        const writers = this.writers || []
        writers.forEach(writer => {
            writer.startGroup(this.groups.length, name)
        })
        this.groups.push(name)
    }

    /**
     * Marks the end of the current group.
     */
    groupEnd () {
        const name = this.groups.pop()
        const writers = this.writers || []
        if(name) {
            writers.forEach(writer => {
                writer.endGroup(this.groups.length, name)
            })
        }
    }

}


//------------------------------------

/*
 * Applies color for the ColorWriter.
 * If an array is used, the first element represents the color of the foreground, and the second of the background.
 * If a string is given, it is used as the foreground color.
 *
 * Colors may be a direct ANSI number (8-bit extended), a three digit hex ('#ABC'), six-digit hex ('#123456'),
 * or 'rgb()' statement.
 *
 * Undefined or '' entries are no-ops.
 *
 * @param strOrArray
 * @returns {string}
 */
function applyColor (strOrArray:string|string[]) {
    if (!Array.isArray(strOrArray)) {
        strOrArray = [strOrArray]
    }
    const sFg = '' + (strOrArray[0] || '')
    const sBg = '' + (strOrArray[1] || '')
    let out = ''
    if (sFg) {
        let code = rgb2ansiCode(sFg)
        if (code) out = '\u001b[38;5;' + code + 'm'
    }
    if (sBg) {
        let code = rgb2ansiCode(sBg)
        if (code) out += '\u001b[48;5;' + code + 'm'
    }
    return out
}

// Used by applyColor
function parseColor (str = '') {
    if (str.substring(0, 3).toLowerCase() === 'rgb') {
        // rgb(red, green, blue)
        let s = str.indexOf('(') + 1
        if (s) {
            let e = str.lastIndexOf(')')
            let rgb = str.substring(s, e).split(',')
            let r = ((Number(rgb[0]) || 0) & 255) / 255
            let g = ((Number(rgb[1]) || 0) & 255) / 255
            let b = ((Number(rgb[2]) || 0) & 255) / 255
            return { r, g, b }
        }
    } else if (str.charAt(0) === '#') {
        str = str.substring(1)
        if (str.length === 3) {
            // #RGB
            const rgb = []
            for (let i = 0; i < 3; i++) {
                let v = parseInt(str.charAt(i), 16)
                rgb.push(((v || 0) & 15) / 15)
            }
            return { r: rgb[0], g: rgb[1], b: rgb[2] }
        }
        if (str.length === 6) {
            const rgb = []
            for (let i = 0; i < 6; i++) {
                let v = parseInt(str.charAt(i), 16)
                rgb.push(((v || 0) & 255) / 255)
            }
            return { r: rgb[0], g: rgb[1], b: rgb[2] }
        }
    } else {
        const n = parseInt(str)
        if (isFinite(n) && n >= 0 && n <= 255) {
            return n
        }
    }
    return ''
}

// TODO: Handle the first 16 colors (primary, bright)

// Used by applyColor
function rgb2ansiCode (str:string) {
    const rgb = parseColor(str)
    if (typeof rgb === 'number') return rgb // direct code
    if (!rgb) return ''
    const R = Math.floor(rgb.r * 255)
    const G = Math.floor(rgb.g * 255)
    const B = Math.floor(rgb.b * 255)
    let code = 0
    if (R === G && R === B) {
        if (R !== 0 && R !== 255) {
            let g = Math.floor(R / 11)
            code = 232 + g // codes 232-255 are grayscale minus black and white
        }
    }
    if (!code) {
        // codes 16-231 are a 6x6x6 color cube
        // We approximate the mapping here
        code = 16 + Math.floor(R / 51) * 36 + Math.floor(G / 51) * 6 + Math.floor(B / 51)
    }
    return code
}

// -----------------------

function expandObject (key:string, value:any) {
    if (typeof value === 'undefined') return 'undefined'
    if (value instanceof RegExp) {
        return '[RegEx]: ' + new RegExp(value).toString()
    }
    if (value instanceof Promise) {
        return '[Promise]'
    }
    if (value instanceof Error) {
        return '[' + value.name + ']: ' + value.message
    }
    return value
}
