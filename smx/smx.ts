#!/usr/bin/env node

/*
Makes a source map record of mappings to the original .ts files using
the information embeddied in bundle.js by webpack.

Webpack is set to use the typescript loader, so it makes executable .js from the .ts sources
on the fly when bundling. For one, this saves us the hassle of doing an explicit tsc compile.
When Webpack does this, it also creates a sourcemap url reference as a comment appended to
each section of the bundle.js output. This maps to the original TS source.

On execution, we'll the the source line numbers of the end-product JS and need to translate this
to their .ts origins.  We do that by looking up this information in the table generated here.

As a command line tool, we pass in the bundle path with the expectation to output to the same directory, and/or
specify the directory otherwise.
` smx dist/bundle.js` (outdir will be dist)
` smx dist/bundle.js outdir`

 */

const fs = require('fs')
const path = require('path')

const smCodec = require('sourcemap-codec')
const base64 = require('base-64')


let bundleFile
let outDir

let mapInfo = {}

function openBundleFile() {
    if(fs.existsSync(bundleFile)) {
        return fs.readFileSync(bundleFile).toString()
    }
}

function findNextSourceMapEntry(contents, startPos) {
    const entryStartTag = '!*** '
    const entryEndTag = '/***/'
    const sourceMapTag = '# sourceMappingURL='
    const b64Tag = 'data:application/json;charset=utf-8;base64,'
    let tagPos = contents.indexOf(entryStartTag, startPos)
    let endTagPos = contents.indexOf(entryEndTag, tagPos)
    let smTagPos = contents.indexOf(sourceMapTag, startPos)
    let startLine = contents.indexOf(b64Tag, smTagPos) + b64Tag.length
    if(startLine < endTagPos) {

        let endLine = contents.indexOf('\n', startLine)
        let eol = contents.indexOf('//', startLine)
        if(eol !== -1 && eol < endLine) endLine = eol
        let b64 = contents.substring(startLine, endLine-2)
        let mapData
        try {
            const mapText = base64.decode(b64)
            mapData = JSON.parse(mapText)
        } catch (e) {
        }
        let position = endTagPos === -1 ? contents.length : endTagPos + entryEndTag.length;
        return { mapData, position }
    } else {
        return { position: endTagPos+entryEndTag.length }
    }

}

function writeMapInfoFile() {

    const mapFile = path.join(outDir, 'smx-info.js')

    try {
        const infoText = JSON.stringify(mapInfo)
        const assign = '_smxInfo = '+infoText+'\n'
        fs.writeFileSync(mapFile, assign)
    } catch(e) {
        console.error('Failed to write map data', e)
        process.exit(-1)
    }
}

function makeSourceMap() {
    const contents = openBundleFile()
    let curPos = 0
    while(curPos < contents.length) {
        let { mapData, position } = findNextSourceMapEntry(contents, curPos) || {}
        if (position && mapData) {
            let filename = mapData.sources[0]
            if(filename) {
                filename = filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('?'))
                mapInfo[filename] = mapData
            }
        }
        if(position < curPos) break;

        curPos = position
    }
    writeMapInfoFile()
}

const cwd = process.cwd()
const bundlePath = process.argv[2]
if(!bundlePath) {
    console.error('-- No arguments provided --')
    console.log('')
    console.log('-'.repeat(32))
    console.log('smx usage:')
    console.log('  smx <bundle path> [<outDir>]')
    console.log('where:')
    console.log(' <bundle path> = path of webpack bundle file to be mapped (e.g. "dist/bundle.js")')
    console.log(' <outDir> = Directory of target root (e.g. "dist") (defaults to folder containing bundle)')
    console.log('-'.repeat(32))
    console.log('')

    process.exit(1)
}

bundleFile = path.normalize((path.join(cwd, bundlePath)))
if(process.argv[3]) {
    outDir = path.normalize(path.join(cwd, process.argv[3]))
} else {
    outDir = bundleFile.substring(0, bundleFile.lastIndexOf('/'))
}


if(!fs.existsSync(bundleFile)) {
    console.error(' -- Unable to find bundle file "'+bundleFile+ ' --')
    process.exit(2)
}
if(!fs.existsSync(outDir)) {
    console.error(' -- Output directory "'+outDir+ ' does not exist --')
    process.exit(2)
}

makeSourceMap()


