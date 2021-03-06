import Tap from 'tap'

/*
Run start.ts to see a variety of log output to the console.
These tests only exercise a few points of the process to test the output to memory
and also the JSON format.  Not extensive at all.
 */

function memLogTest() {
    Tap.test('Memory Log', t => {
        MemLog.log('this is a test')
        let r = readMemoryLog('test')
        let x = 'Test.<anonymous> (MemLog.test.ts:11) LOG this is a test'
        t.ok(r.indexOf(x) === 15, r)

        JSONLog.debug('This is a json log')
        r = readMemoryLog("MemJSON")
        let job = JSON.parse(r)
        t.ok(job.message === 'This is a json log')
        t.ok(job.level = 'debug0')


        clearMemoryLog('test')
        clearMemoryLog('MemJSON')
        t.end()
    })
}

import {loadLoggerConfig, getLogger,readMemoryLog, clearMemoryLog} from '../src/Log'

loadLoggerConfig('/Users/sohmert/tbd/gen-logger/testConfig.json')

const MemLog = getLogger('Mem') // cache name 'test'
const JSONLog = getLogger('MemJSON') // default cache name (MemJSON)

memLogTest()
