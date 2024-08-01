import {loadLoggerConfig, getLogger} from './src/Log'

/* NON-CONFIG WAY

const Log = new Logger()

const logTarget = new LogTarget('Console', TargetType.Console, '', true)
const consoleWrite = new LogWriter(logTarget)

// We will want to create a different logger for each context
// each logger may write to more than one output
// each output (writer) may filter to its own set of categories and levels so redundancy is managed.

// ------------------
// TODO
// Looking pretty good for a start, I think.
// - √ need to migrate and incorporate sourceMap handling.
// - √ stack trace
// - embed into some functions and classes, etc to check the FFL
// - write up docs on how to set up and use
// - √ TODO: we'll want a comprehensive configuration feature
// - [X] exception and fatal color

// - import into Thunderbolt and continue working there.
// ------------------

// Writers filter on level
// consoleWrite.excludeLevel('debug', 'info', 'log')
// and on category
// consoleWrite.excludeCategory('Page')

Log.addWriter(consoleWrite)

End Non-Config way
*/

loadLoggerConfig('./logconfig.json')

const Log = getLogger('Main')

let foo = {
    test: 'Hello',
    bar: {
        thing: 'world'
    }
}

Log.log('This is a default category test')
Log.debug('This is a default category test')
Log.debug4('This is a default category test')
Log.log('Test', 'This is a Test category test')
Log.debug('Test', 'This is a Test category test')
Log.info('Test', 'This is a Test category test')
Log.info2('Test', 'This is a Test category test')

Log.warn('Warning message')

function logTest() {

    Log.log('This is test of formatted value $(01.2)', Math.PI)
    Log.log('This is a test of formatted object output $(,), $(,), $(,)', foo, ['apple', 'banana', 'cherry'], null, {more: 'stuff'})
    Log.log('This is a test of object output default', foo, 'hello world', Math.PI, ['apple', 'banana', 'cherry'], null, {more: 'stuff'})

    Log.log('more object out', {
        str: 'this is a : string',
        num: 42,
        empty: null,
        torf: true,
        fort: false,
        regex: /blah/,
        promise: new Promise(resolve => {
        }),
        err: TypeError('foobar')
    }, 'and so it goes')
    Log.info(Error('Foobar'))

    const multiLine = '\n\nNow is the time\nFor all good men\nTo come to the aid\nOf their country\n\n'

    Log.info(multiLine)
    Log.info('This is an object with a multi-line string:', {multiLine})


    Log.group('foo')
    Log.log('This is part of the foo group')
    Log.log('More foo group action')
    Log.group('bar')
    Log.log('This is part of the bar group')
    Log.groupEnd()
    Log.log('Done with the bar')
    Log.groupEnd()
    Log.log('Done with groups')

    Log.log('back to normal logging')
    Log.log("isn't that nice")

    Log.error('This is an error message')

    new Promise(resolve => {
        setTimeout(resolve, 1000)
    }).then(() => {
        Log.log('This log is after a then')
    })

    // Testing of groups
    Log.group('A Poem')
    Log.info('Stopping by Woods on a Snowy Evening')
    Log.group('Stanza 1')
    Log.log('Whose woods these are I think I know')
    Log.log('His house is in the village though;')
    Log.log('He will not see me stopping here')
    Log.log('To watch his woods fill up with snow.')
    Log.groupEnd('Stanza 1')
    Log.group('Stanza 2')
    Log.log('My little horse must think it queer')
    Log.log('To stop without a farmhouse near')
    Log.log('Between the woods and frozen lake')
    Log.log('The darkest evening of the year.')
    Log.groupEnd('Stanza 2')
    Log.group('Stanza 3')
    Log.log('He gives his harness bells a shake')
    Log.log('To ask if there is some mistake')
    Log.log("The only other sound's the sweep")
    Log.log('Of easy wind and downy flake.')
    Log.groupEnd('Stanza 3')
    Log.group('Stanza 4')
    Log.log('The woods are lovely, dark and deep,')
    Log.log('But I have promises to keep,')
    Log.log('And miles to go before I sleep,')
    Log.log('And miles to go before I sleep.')
    Log.groupEnd('Stanza 4')
    Log.info('By Robert Frost')
    Log.groupEnd('A Poem')
}
logTest()

// a deeper nesting to show up in stack trace

Log.info('----------- crash testing ------------')

function a () {
    try {
        Log.debug('about to crash...')
        let a = null
        let x = a.foo
    } catch (e) {
        Log.exception("this is an exception ", e)
        Log.crash('this is the crash ', e)

    }
}

function b () {
    return a()
}

function c () {
    return b()
}

function d () {
    return c()
}

function e () {
    return d()
}

e()
