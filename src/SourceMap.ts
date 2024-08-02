
declare global {
    interface Window { _smxInfo: any; }
}

let nfs:any,path:any
try {
    if (typeof global === 'object') {
        if (typeof global.process === 'object') {
            // node detected
            nfs = require('fs')
            path = require('path')
        }
    }
} catch(e) {

}

// This code runs directly when this module is imported and loads in the smx-info.js file generated
// by the smx tool, if there.  This file maps data found in webpack bundle.js to original .ts sources.
// will not be there in N/A scenarios.
let smxInfo:any
let oneTime:boolean

function getSmxInfo() {
    if(smxInfo) return smxInfo
    let gsmx
    if(typeof global !== 'undefined') {
        gsmx = ((global.window as any) || {})._smxInfo;
    } else if(typeof window !== 'undefined') {
        gsmx = ((window as any) || {})._smxInfo;
    }
    if(gsmx) {
        smxInfo = gsmx
        return smxInfo
    } else {
        if(!oneTime) {
            // console.log(">>>> didn't load source map info")
            // couldn't find the generated map.  We'll have to read the map files at runtime, which we can do if we are
            // running under Node.  Otherwise, we have no source map capability
            if (!nfs) {
                console.warn('')
                console.warn('Source Mapping is unavailable')
                console.warn('')
            }
        }
        oneTime = true
    }
}

import * as smCodec from '@jridgewell/sourcemap-codec'
import * as base64 from 'base-64'

/**
 * Read the target (.js) file and find the //# sourceMappingURL= tag
 * then, either decode the date or read the referenced map file depending upon url type
 *
 * Record this as the mapData for this file path for later lookup.
 * Note that in 'Sniff' the first part (making a mapData table) is done as a post-build tool activity
 * and the resulting JSON is read in so we have a preconstructed source map table at the start.
 *
 * @param filePath Path of the file (note: full path, not just the name)
 */
function readMapData(filePath) {
    let mapData
    if(!nfs || !path) return;

    if(nfs.existsSync(filePath)) {
        const contents = nfs.readFileSync(filePath).toString()
        const tag = '//# sourceMappingURL='
        const n = contents.lastIndexOf(tag)
        if (n !== -1) {
            const snip = contents.substring(n+tag.length)
            const b64tag = 'data:application/json;charset=utf-8;base64,'
            const dn = snip.indexOf(b64tag)
            let b64
            if (dn !== -1) {
                // read the embedded data
                b64 = snip.substring(dn + b64tag.length)
            }
            let mapText
            if(!b64) {
                // read the referenced map file
                let mapPath = filePath.substring(0, filePath.lastIndexOf('/')+1) + snip
                if(nfs.existsSync(mapPath)) {
                    mapText = nfs.readFileSync(mapPath).toString()

                }
            } else {
                mapText = base64.decode(b64)
            }
            mapData = JSON.parse(mapText)
        }
        // mapData = null // if return is null, it means there is no embedded map data
        // if it is undefined it means the source file was not found
    }
    return mapData
}

/**
 * From the already parsed FuncFileLine data from StackLineParser,
 * find the referenced source map data and decode it to find the corresponding
 * source file and line values.  Update the FFL object in place.
 * Resulting FFL will also contain the source file path.
 *
 * @param ffl FuncFileLine object that is modified with source map information and returned
 * @return Modified FFL is also returned
 */
export function getSourceMap (ffl) {

    // read from pre-generated source info if available, otherwise, read the map file.
    let smxInfo = getSmxInfo()
    const mapData = smxInfo ? smxInfo[ffl.file] : readMapData(ffl.filePath)

    if (mapData) {

        const decoded = smCodec.decode(mapData.mappings)

        const lc = ('' + ffl.line).split(':')
        const line = Number(lc[0])
        // const column = Number(lc[1])
        let decEntryArr = decoded[line]
        let skipped = false
        if (!decEntryArr || !decEntryArr[0]) {
            decEntryArr = decoded[line + 1]
            if (decEntryArr && decEntryArr[0]) skipped = true
        }
        let decEntry = decEntryArr && decEntryArr[0]
        // console.warn('---->> decoded ' + decEntry + ' for line ' + line + ', column ' + column)
        if (decEntry) {
            const srcindex = decEntry[1]
            const orgFile = mapData.sources[srcindex]
            const rootPath = ffl.filePath.substring(0, ffl.filePath.lastIndexOf('/'))
            ffl.sourcePath = path ? path.normalize(path.join(rootPath, orgFile)) : orgFile
            let orgLine = decEntry[2]
            if (skipped) orgLine--
            ffl.file = orgFile.substring(orgFile.lastIndexOf('/') + 1)
            if(ffl.file.indexOf('?') !== -1) { // webpack decorated
                ffl.file = ffl.file.substring(0,ffl.file.lastIndexOf('?'))
            }
            ffl.column = decEntry[0]
            ffl.line = orgLine
        }
    } else {
        // null flavor checks
        if(mapData === undefined) {
            // the original source is unavailable
            ffl.file = '???'
            ffl.line = '?'
        }
        if(mapData === null) {
            // no embedded mapping info.  Assume it's not mapped
        }
        // console.warn('(SAUCECODE) no translation')
    }
    return ffl
}
