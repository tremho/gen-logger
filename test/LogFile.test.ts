import Tap from 'tap'

import * as fs from 'fs'

/*
Run start.ts to see a variety of log output to the console.
These tests only exercise a few points of the process to test the output to memory
and also the JSON format.  Not extensive at all.
 */

function logFileTest() {

    Tap.test('Log File', t => {
        LogFile.log('this is a test')
        LogFile.info('this is another entry')
        closeFileLog()

        // file will not appear until after a timeout.
        setTimeout(() => {
            const contents = fs.readFileSync(logfilepath).toString()
            t.ok(contents.length > 0, 'we have contents in the log file')
            const lines:string[] = contents.trim().split('\n')
            t.ok(lines.length === 2, 'there are '+lines.length+' lines')
            const l0 = JSON.parse(lines[0])
            const l1 = JSON.parse(lines[1])
            t.ok(l0.message === 'this is a test')
            t.ok(l0.level === 'log0')
            t.ok(l1.message === 'this is another entry')
            t.ok(l1.level === 'info0')

            t.end()

        }, 500)
    })
}

import {loadLoggerConfig, getLogger,readMemoryLog, clearMemoryLog} from '../src/Log'

loadLoggerConfig('./testConfig.json')

const LogFile = getLogger('LogFile') // cache name 'test'
const writer = LogFile.getWriters()[0]
const logfilepath = writer.target.location
if(fs.existsSync(logfilepath)) fs.unlinkSync(logfilepath)
const logstream = fs.createWriteStream(logfilepath, {flags: 'a'})

writer.outputLog = (formatted, category, level, stack, xargs) => {
    logstream.write(formatted + '\n')
}
function closeFileLog() {
    logstream.end('\n')
    logstream.close()
}

logFileTest()
