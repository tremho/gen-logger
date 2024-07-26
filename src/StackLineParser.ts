
import {getSourceMap} from "./SourceMap";

export class FuncFileLine {
    public func: string // function name
    public file: string  // source file name
    public filePath: string // target file full path
    public sourcePath: string // source file full path
    public line: number // source file line
    public column: number // source column
    public stackLines:string[] = [] // stack to this point
}
export class StackLineParser {

    getFuncFileLine() {
        let stack
        if (typeof Error === 'function') {
            stack = new Error().stack
        }
        if (stack && typeof stack === 'string') {
            const stackLines = stack.split('\n')
            for(let n = 0; n<stackLines.length; n++) {
                const ln = stackLines[n]
                let ffl = this.parseLine(ln)
                let fn = ffl.func
                if(fn && fn.indexOf('StackLineParser') === -1 && fn.indexOf('Logger') === -1) {
                    ffl.stackLines = stackLines.slice(n+1)
                    return getSourceMap(ffl)
                }
            }
        }
    }
    parseLine(ln) {
        //     at Object.<anonymous> (/Users/sohmert/tbd/gen-logger/build/index.js:15:5)
        //     at StackLineParser.getFuncFileLine (file:///Users/sohmert/tbd/tbtest/build/front/bundle.js:8394:21)

        const ffl = new FuncFileLine()
        let func, file, line, column
        let st = ln.indexOf('at ')
        if (st !== -1) {
            st += 3
            let pi = ln.indexOf('(', st)
            if (pi !== -1) {
                func = ln.substring(st, pi) // function full
            } else {
                func = '(anonymous)'
                pi = st
            }
            let fpx = ln.indexOf(':/', pi)
            if(fpx === -1) fpx = pi
            else fpx += 2
            let pne = ln.indexOf(':', fpx)
            if (pne !== 1) {
                file = ln.substring(fpx + 1, pne) // full path
                let ce = ln.lastIndexOf(':')
                if (ce !== -1) {
                    let lns = pne
                    if (file === 'webpack-internal') {
                        lns = ln.lastIndexOf(':', ce - 1)
                        file = ln.substring(pne + 4, lns) // full path
                    }
                    line = Number(ln.substring(lns + 1, ce))
                    let pe = ln.indexOf(')', ce)
                    if (pe === -1) pe = ln.length
                    column = Number(ln.substring(ce + 1, pe))
                    ffl.filePath = file
                    ffl.file = file.substring(file.lastIndexOf('/') + 1)
                    ffl.func = func
                    ffl.line = line
                    ffl.column = column
                }
            }
        }
        return ffl
    }
}