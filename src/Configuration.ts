
let nfs
try {
    if (typeof global === 'object') {
        if (typeof global.process === 'object') {
            // node detected
            nfs = require('fs')
        }
    }
} catch(e) {

}


export enum TargetType {
    Console = 'Console',     // e.g. the Electron JS Debugger Console / (will be DevConsole on mobile).
    // location can be 'App' or 'Dev'
    Memory = 'Memory',       // output is cached as an appended string in memory under the name in 'location'
    LogFile = 'LogFile',     // requires a path name in 'location'
    Service = 'Service'      // requires a URL in 'location'
}

export enum ElementType {
    time = "time",
    function = "function",
    source = "source",
    category = "category",
    level = "level",
    message = "message"
}

export enum FormatType {
    text = "text",
    json = "json"
}

export enum ConsoleType {
    tty = "tty",
    browser = "browser"
}

export class CategoryDefinition {
    public name:string
    public description?:string
}
export class DisplayOptions {
    public format: FormatType = FormatType.text
    public order: ElementType[]
    public supportsColor: boolean
    public prefix:string = '- '
    public browserLineStyle?: string
    public colorReset?:string
}
export type ColorDef = number | string
export type ColorSet = ColorDef | [ColorDef, ColorDef]

export class ColorElementDefinition {
    public background?: ColorDef
    public browserLineStyle?: string
    public time?:ColorSet
    public func?:ColorSet
    public file?:ColorSet
    public line?:ColorSet
    public category?:ColorSet
    public level?:ColorSet
    public stack?:boolean
    public stackColor?:ColorSet
    public startGroup?:ColorSet // only in top-level default block
    public endGroup?:ColorSet   // only in top-level default block
}
export class ColorSchema extends ColorElementDefinition {
    public inherits?:string
    // plus additional ColorElementDefinition sets per named category
}
export class NamedColorScheme extends ColorSchema {
    public name:string
}
export class WriterDefinition {
    public name:string
    public type:TargetType
    public includeCategories?:string[]
    public excludeCategories?:string[]
    public includeLevels?:string[]
    public excludeLevels?:string[]
    public memoryName?:string // only for type Memory
    public consoleType?:ConsoleType // only for type console
    public filePath?:string // only for LogFile
    public serviceUrl?:string // only for Service
    public display:DisplayOptions
    public colors?:ColorSchema
}
export class LoggerDefinition {
    public name:string
    public writers:string[]
}
export class ConfigSchema {
    public categories:CategoryDefinition[]
    public colorSchemes:NamedColorScheme[]
    public writers:WriterDefinition[]
    public loggers:LoggerDefinition[]
}


export default class Configuration {
    public configSchema:ConfigSchema

    loadConfigFile(path) {
        if(!nfs) {
            throw Error('loadConfigFile is not available.')
        }
        if(nfs.existsSync(path)) {
            const contents = nfs.readFileSync(path).toString()
            this.configSchema = JSON.parse(contents)
        } else {
            throw Error(`Logger configuration file ${path} not found` )
        }

    }
    readColorScheme(schemeName):ColorSchema {
        const schemes = this.configSchema.colorSchemes || []
        for(let i = 0; i < schemes.length; i++) {
            const scheme = schemes[i]
            const {name, inherits} = scheme
            let schemeData = {}
            if(name === schemeName) {
                if(inherits) {
                    schemeData = this.readColorScheme(inherits)
                }
                schemeData = Object.assign(schemeData, scheme)
                return schemeData
            }
        }
        return {}
    }
}