# gen-logger

This is a general purpose logging module for use in Javascript projects.

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![TotalDownloads][total-downloads-image]][npm-url]
[![Twitter Follow][twitter-image]][twitter-url]

[build-status]: https://travis-ci.org/tremho/gen-logger.svg?branch=master

[build-url]: https://travis-ci.org/tremho/gen-logger

[npm-image]: http://img.shields.io/npm/v/gen-logger.svg

[npm-url]: https://npmjs.org/package/gen-logger

[downloads-image]: http://img.shields.io/npm/dm/gen-logger.svg

[total-downloads-image]: http://img.shields.io/npm/dt/gen-logger.svg?label=total%20downloads

[twitter-image]: https://img.shields.io/twitter/follow/Tremho1.svg?style=social&label=Follow%20me

[twitter-url]: https://twitter.com/Tremho1

The world may not need yet another logger utility, but gen-logger provides
an easy to use structure, and a flexible, configuration-driven architectture
that make it a good choice across a spectrum of logging needs.

-   Support Console, Memory, File, and Service type output targets.
-   Organize logs by a configurable set of categories
-   Route logs to different outputs
-   Supports 60 logging levels (six named levels with 10 granlularities each)
-   Supports grouping of log messages
-   Supports Color output 
-   Supports 'Debugger Console' output for color and collapsible groups in browser logging
-   Supports text console with ANSI colors
-   Configurable output
-   Stack tracing with source map support
-   Supports JSON format logging for compatibility with other tools
-   Extensible for custom needs

###### Installation

npm install @tremho/gen-logger

###### Basic configuration

Create a JSON file at a conveniently accessible path
within your project.
e.g. `logconfig.json`

and enter the following:

```json
{
  "loggers": [
    {
      "name": "Main",
      "writers": ["Console"]
    }
  ],
  "writers": [
    {
      "name": "Console",
      "type": "Console"
    }
  ]
}
```

This defines the most basic logger configuration.
It defines a single logger named "Main" that will output
to one target ('Console'). None of the many options
for format or coloration are defined, and all defaults
are assumed.  No categories are defined here.

There are _many more_ configuration options that may be set
and you will want to create a suite of loggers and writers
that suit the purposes of your development environment and
application.  Refer to the _Configuration_ section for
tips on how to tailor loggers to your needs.

###### Basic use

Once you have configured a set of loggers, you can 
start using them in  your code.

The best way to do this is to create a Log module of your own
that establishes the loggers you will use for your needs and 
can then be imported and used by other modules in
your application project.

For example, a Typescript application running under Node might
want to create a `Log.ts` module that looks like this: 

```typescript
import {loadLoggerConfig, getLogger} from '@tremho/gen-logger'

loadLoggerConfig('./logConfig.json')
const Log = getLogger('Main')

export default Log
```

and then other modules can use this as follows:

```typescript
import Log from './Log'

Log.debug('this is a log statement')
```

Note if you are using plain Javascript rather than Typescript,
the above code may look something more like this:

```javascript
var {loadLoggerConfig, getLogger} = require('@tremho/gen-logger')

loadLoggerConfig('./logConfig.json')
var Log = getLogger('Main')

module.exports = Log
```

_Read more about configuration [in the configuration document](./configuration.md)_

If you are running in a browser-based context and not
running under Node, you cannot use the `loadLoggerConfig`
method, since direct file access is not normally 
available in a browser context.

In this instance, you can use a script load or an AJAX operation
to bring in the config json, or else construct the
JS object directly, and then set the configuration with
`setLoggerConfig`:

Note that the logconfig.json file must exist in your runtime path, 
so you may need to add a copy of this file into the output directory
to your build steps.
Especially if you are using an intermediate build step, such as with typescript or babel.

If you are using a log in a browser context, consider using the 'Browser' console type instead of
the the default 'tty' for your writer.  This will integrate with the Google-style debugging console of most browsers 
and will support collapsible groups and other features. Read more about this later in this document.

###### Creating a simple default logger

If you are looking for a simple, ready to use Console logger (color), you can choose to not use
a configuration file and instead use `createDefaultLogger()` in your Log.js file like this:

```typescript
import {createDefaultLogger} from '@tremho/gen-logger'

const Log = createDefaultLogger();

export default Log
```

or just

```typescript
import {createDefaultLogger} from '@tremho/gen-logger'
export default createDefaultLogger()
```

or for non-typescript javascript

```javascript
var {createDefaultLogger} = require('@tremho/gen-logger')
module.exports = createDefaultLogger()
```

###### Multiple loggers, and multiple outputs

There can be multiple loggers defined and each logger
may output to one or more writer targets. These targets
may be configured to handle only logs of a particular category
or of a particular logging level, or they may simply
be different places to put logging information.

For example, you might create 2 logging outputs: One to the console,
and one to a file.  You can create corresponding loggers
for each of these, and another one that is a 'combined' option.

For example, in the `loggers` section of the configuration:

```json
  "loggers": [
    {
      "name": "Main",
      "writers": ["Console"]
    },
    {
       "name": "File",
       "writers": ["LogFile"]            
    },
    {
      "name": "Combined",
      "writers": ["Console", "LogFile"]
    }
], 
```

and in our `Log` module we could export these as such:

```typescript
import {loadLoggerConfig, getLogger} from '@tremho/gen-logger'

loadLoggerConfig('./logfile.json')
var LogCon = getLogger('Main')
var LogFile = getLogger('File')
var LogBoth = getLogger('Combined')

export {LogCon, LogFile, LogBoth}
```

and import and use later like this:

```typescript
import {LogCon, LogFile, LogBoth} from 'Log'

LogCon.debug('this goes to the console')
LogFile.info('this goes to the file')
LogBoth.log('this goes to both console and file')
```

###### Types of log writer targets

There are 4 basic types of writers defined:

-   Console - outputs to the console display.  There are two forms of this, dictated by the "consoleType" property.
-   LogFile - outputs to a file in the filesystem.
-   Memory - records logs in memory
-   Service - sends log data to a web service

These types are declared by name in the writer `type` property.
There are additional fields for the writer configuration that may apply per 'type' choice:

-   For 'Console', there is `consoleType`.  This may be either `tty` or `browser`. The default is `tty`.
    Choose `browser` for integration into browser console displays.

-   For 'LogFile', there is `filePath` which is a path to the log file
-   
-   For 'Memory', there is `memoryName` which names the memory block for later access. If this is not given,
    the name of the writer is used for the memory name.
-   
-   For 'Service', there is `serviceUrl` which is the url for the service that is called.

###### Implementing custom writers

There is an existing node-compatible file writer available for easy construction.

```typescript
const writer = createLogFileWriter(name, filePath)
```

and then you can add it to your logger with

```typescript
Log.addWriter(writer)
```

but for Service writers or any other custom output,  you must create a custom writer.

This is relatively easy to do.  Create your Logger object programmatically and attach
a custom writer, like this:

```typescript
import {Logger, LogTarget, LogWriter} from "../../gen-logger";

const Log = new Logger();

// Define a log target with the name 'test', and a type name (anything other than Console or Memory or LogFile)
// and a reference (e.g. a location or identifier)
const target = new LogTarget('test', 'MyCustom', 'myReference')

// This will be our custom output function
target.outputLogToDestination = (location: string, formatted: string, category: string, level: string, stack: string | null, xargs: any[] | null) => {
    // here we could log to a file, output to a service, update a DB, or whatever.
    console.log(formatted)
}
// we might want to have the formatted message in json rather than plain text
target.displayOptions.format = 'json'

// if we want stack information to be passed to our callback, we must set the target options for that,
// setting stack: true for any log level that you desire a stack for. In this case, all of them.
// (not necessary if no stack is needed)
target.colorLevels = {
    trace: {stack: true},
    debug: {stack: true},
    log: {stack: true},
    info: {stack: true},
    warn: {stack: true},
    error: {stack: true},
    exception: {stack: true},
    fatal: {stack: true}
}
// if your custom output supports ansi colors, you can define other color options here as well.


// now create and add this writer to our logger
const writer = new LogWriter(target)
Log.addWriter(writer)
export default Log
```

using the pattern above, one can create custom log writers for file, service, database, whatever.

###### Default LogFile writer example

A basic logfile writer is built-in, and available for NodeJS projects.
It will not work for browser implementations.

```typescript
import {Logger, createLogFileWriter} from '@tremho/gen-logger'

const Log = new Logger()
const writer = createLogFileWriter("MyLogger", 'logs/log.txt')
Log.addWriter(writer)
export default Log
```

This will create a directory named 'logs' and there will be one log file (named 'log.txt') in this directory after
the first one, and one named 'log1.txt' after the second run, one named 'log2.txt' after the third run, and so on.
The log will contain a series of json objects separated by newlines.
No stack trace is captured with this writer.
The highest numbered log is the most current.
You are responsible for cleaning up old log files.

###### Setting LogLevel filtering

By default, a logger will emit logs for all Log Levels - trace through fatal - but sometimes we want to 
filter out some of the noise.  We can do this a couple of ways.
One is by using the familiar paradigm of "log level" as a value, where 'trace' is the lowest value and 'fatal' is the highest.
We can call `Log.setMinimumLevel` to specify that only log levels of the given level or higher will be emitted.
You must name the writer to affect as the first parameter, and the name of the minimum level as the second parameter when using this function.

For example, `Log.setMinimumLevel('Console', 'info`) will insure that only 'info', 'warn', 'error', 'exception', and 'fatal'
messages make it through to output on the 'Console' writer of the logger.
But there is another mechanism that allows us to cherry-pick which levels to see.  This happens through "exclusion"
of level values.  We can "exclude" a value, say 'debug' and by doing so, only the 'debug' level logs will be supressed.
We can use the api `Log.excludeLevel` or `Log.excludeAllLevels` or the complement to these, `Log.includeLevel` and 
`Log.includeAllLevels`. Note that "include" simply removes a value from the exclusion list.
We can combine techniques, too, so if we were to say
```typescript
Log.setMinimumLevel('Console', 'info')
Log.includeLevel('Console', 'debug')
```
we would end up with the levels debug, info, warn, error, exception, and fatal, but not 'trace' or 'log'.

Note that ___granularity is not selectable in this way___. That is, you cannot say, for example `Log.excludeLevel('debug3')`.

If you turn on or off a level (say, 'debug'), all the associated granular sub-levels are affected with that as well.
Filtering beyond this would require a custom writer.


###### Categories
You can log an optional "category" to be associated with a log message to help identify the context of
the log message.
To do this, you must first assign a category with the api `addCategory`.  Then, pass this category name
as the first argument to a log statement and it will appear in the log output
For example:

```typescript
addCategory('Application')
Log.debug('Application', 'This is n log in the application category')
```
will produce output similar to this:

- 08:21:23.062 basicLogTest (logTest.ts:27) [Application]  DEBUG  This is a log in the application category

note that if a category is passed that is not a recognized category (that is, one that has been added),
the category name will simply appear pre-pended to the log message and not reported as a category.

###### Setting a default category name

Normally, logs without a category appear with no category display.  This is considered the "Default" category.
To make all the 'Default' category messages present with a specific name, use the api `Log.setDefaultCategoryName`

This will make all the default logs appear with this name as the reported "category",  Note that in this case, the category
does not necessarily need to be added ahead of time.

This can be useful for separating sections of context.
Note that the `setDefaultCategoryName` api returns the value of any previously set name, so this can be used
to go in and out of different contexts.
Note that if an assigned category is passed, this category declaration will override the default category name, which 
only affects log output without a specifically passed category.

###### Using groups

Log statements can be grouped together into a named bracketed section that informs context.
Groups can be nested as well.  In a browser context, groups can be expanded / collapse using the browser console UI.

For example thes log lines:
```typescript
    Log.group("GroupTest")
    Log.trace("this is a log in the group")
    Log.debug('another log in the group')
    Log.log('Application', 'a categorized log in the group')
    Log.info('still in the group')
    Log.group('Subgroup')
    Log.info('this is in a subgroup')
    Log.trace('that is all')
    Log.groupEnd()
    Log.warn('still in the group')
    Log.groupEnd()
    Log.info('done with groups')
```
will produce the following output:

```
 <GroupTest> 
  - 10:33:09.950 basicLogTest (logTest.ts:29)  TRACE  this is a log in the group 
  - 10:33:09.951 basicLogTest (logTest.ts:30)  DEBUG  another log in the group 
  - 10:33:09.952 basicLogTest (logTest.ts:31) [Application]  LOG  a categorized log in the group 
  - 10:33:09.953 basicLogTest (logTest.ts:32)  INFO  still in the group 
   <Subgroup> 
    - 10:33:09.953 basicLogTest (logTest.ts:34)  INFO  this is in a subgroup 
    - 10:33:09.954 basicLogTest (logTest.ts:35)  TRACE  that is all 
   </Subgroup> 
  - 10:33:09.955 basicLogTest (logTest.ts:37) [Foobar]  WARN  still in the group 
 </GroupTest> 

```



###### Use in browser projects

gen-logger may be used in a browser context, but there are some caveats.

Source mapping is not available in this mode, so the reported file names and
line numbers will be misleading, or outright wrong.

While this is something that could be addressed, the problem is non-trivial and
the solution may depend upon which bundler is used (if any) and how the source is loaded by
the browser.
This has been made to work in the past, so in limited contexts at least, it is certainly
possible.  If you have a solution, please contribute to the open source project.

The style of the output in a browser console is not ideal and could use better
default formatting.

Browser console logging is enabled by setting the 'location' property of a 'Console' writer
to be 'browser' instead of 'tty'

```typescript
const Log = createDefaultLogger()
const w = Log.findWriter('Console')
w.target.location = 'browser'

```

###### Uses for the Memory Log Writer

The memory log target is an interesting and useful option. It allow you to 
emit logs that go unseen, but recorded in memory.

There are many possible scenarios for such a feature.  For example, suppose
you have a subsystem that usually works fine, but sometimes fails, and the only way
to understand why it fails is to look at all the state changes that have occurred over
a wide span. However, logging these events to the main logger creates too much noise
and confuses understanding of the log in general.

So, you log these events into a memory logger and then at the point the subsystem
performs its action (or perhaps only on an exception catch of when it fails)
the memory log contents are retrieved and output for analysis.

You can define a MemLog in a config file or your can create one programatically like this:

```typescript
import {Logger, LogTarget, LogWriter} from '@tremho/gen-logger'

const MemLog = new Logger()
MemLog.addWriter(new LogWriter(new LogTarget('MemLog', 'Memory', 'MemLog')))

```
Note that the last value passed when creating the MemLog target is the name by which you will fetch
the recorded log data by.

You can then use it at points the code, such as this example:
```typescript
import {clearMemoryLog, readMemoryLog} from '@tremho/gen-logger'

try{
    MemLog.trace("Recording logs we don't see yet")
    MemLog.info("these can be any log statements, just like any other logger")
        // ...
    }
    catch(e:any) {
        Log.Exception(e)
        // output all the collected logs recorded up to this point
        console.log(readMemoryLog('MemLog'))
        clearMemoryLog('MemLog') // clear for future use
    }
}
```


## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### getCategories

Returns the set of established categories as defined in configuration.

### addCategory

Adds a new category to the set of known categories

#### Parameters

-   `category`  

### removeCategory

Removes a category from the set of known categories

#### Parameters

-   `category`  

### loadLoggerConfig

Loads the logger configuration JSON from the given path and sets the configuration.
This establishes the loggers and output writers, as well as category and level
definitions, color settings, and output formats to use.
See the documentation section on Configuration for more information.

Available in Node settings.  For browser-based contexts, load your config
via a script or AJAX operation and call `setLoggerConfig` rather than use this method.

#### Parameters

-   `path`  


-   Throws **any** Error if Node is not available or file is not found at path.

### setLoggerConfigJSON

Sets the configuration from a JSON text string.
If you've loaded a parsed script, or have constructed a JS object,
call `setLoggerConfig` instead.

#### Parameters

-   `json`  

### createDefaultLogger

Creates and returns a default logger suitable for general console purposes
It has a single writer ('Console') that outputs in color.

### setLoggerConfig

Use to set the Logger configuration from an object resolved from JSON or
constructed dynamically.
Use in browser-based contexts, since `loadLoggerConfig` in unavailable without Node support.
This establishes the loggers and output writers, as well as category and level
definitions, color settings, and output formats to use.
See the documentation section on Configuration for more information.

#### Parameters

-   `config`  

### getLogger

Return a configured Logger by name

#### Parameters

-   `name`  

### readMemoryLog

Read the accumulated text in the named memory log.
Note that the name of a Memory log is established with the 'memoryName' property of
the writer configuration, or the name of the writer itself if no 'memoryName' is provided.
See the section on Configuration for more info.

#### Parameters

-   `name`  

### clearMemoryLog

Clears the memory buffer text for this Memory log.

#### Parameters

-   `name`  

### LogTarget

A target names the target type and location

#### Parameters

-   `name`  
-   `type`  
-   `location`  
-   `color`  

### LogWriter

Defines where the output will appear, and what categories/levels are filtered

#### Parameters

-   `target`  

#### getColors

Returns the colors to use per display item for a given category and level

##### Parameters

-   `category`  
-   `level`  

Returns **any** Object containing color info

#### composeJSON

Support output as JSON

##### Parameters

-   `time`  
-   `category`  
-   `level`  
-   `ffl`  
-   `fmesg`  
-   `stackdump`  

#### logFormat

Format the log output

##### Parameters

-   `time`  
-   `category`  
-   `level`  
-   `ffl`  
-   `stackParser`  
-   `message`  
-   `args` **...any** 

### getWriters

return the array of writers attached to this logger

### addWriter

Add a new writer to this logger

#### Parameters

-   `writer`  

### removeWriter

Remove a writer from this logger

#### Parameters

-   `writer`  

### findWriter

Find a writer by name that belongs to this Logger

#### Parameters

-   `targetName`  

### setDefaultCategoryName

Set the name of a category to appear by default

#### Parameters

-   `defName`  

Returns **any** previously set name (so we can put it back if this is a temporary labelling)

### includeAllLevels

Include all the levels in the writer output

#### Parameters

-   `writerName`  name of writer to affect

### excludeAllLevels

Exclude all levels from the writer output

#### Parameters

-   `writerName`  name of writer to affect

### includeLevel

Include a level for the named writer to output

#### Parameters

-   `writerName`  name of writer to affect
-   `level`  name of level. note that granular levels are not supported. Only primary level names.

### excludeLevel

Exclude a level for the named writer.
The writer will ignore all logs for this level

#### Parameters

-   `writerName`  name of writer to affect
-   `level`  name of level. note that granular levels are not supported. Only primary level names.

### setMinimumLevel

Set a minimum level.
This level and above will be output by the writer.
levels below this will be excluded.

#### Parameters

-   `writerName`  name of writer to affect
-   `minLevel`  
-   `level`  name of level. note that granular levels are not supported. Only primary level names.

### enableColor

turn color support on/off for a given writer

#### Parameters

-   `writerName`  
-   `enabled`  

### includeAllCategories

Include all the categories in the writer output

#### Parameters

-   `writerName`  name of writer to affect

### excludeAllCategories

Exclude all levels from the writer output

#### Parameters

-   `writerName`  name of writer to affect

### includeCategory

Include a category for the named writer to output

#### Parameters

-   `writerName`  name of writer to affect
-   `level`  
-   `category`  name of category.

### excludeCategory

Exclude a category for the named writer.
This writer will ignore logs in this category.

#### Parameters

-   `writerName`  name of writer to affect
-   `category`  \-- name of category

### outToWriters

Direct output to all writers, subject to filtering.

#### Parameters

-   `time` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** in milliseconds
-   `ffl` **{file, func, line, stack}** 
-   `category` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `level` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `message` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `args` **any** arguments used for formatting message

### trace9

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### trace8

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### trace7

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### trace6

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### trace5

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### trace4

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### trace3

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### trace2

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### trace1

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### trace0

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### trace

Synonymous with trace0

#### Parameters

-   `args` **...any** 

### debug9

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### debug8

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### debug7

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### debug6

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### debug5

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### debug4

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### debug3

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### debug2

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### debug1

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### debug0

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### debug

Synonymous with debug0

#### Parameters

-   `args` **...any** 

### log9

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### log8

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### log7

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### log6

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### log5

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### log4

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### log3

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### log2

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### log1

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### log0

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### log

Synonymous with log0

#### Parameters

-   `args` **...any** 

### info9

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### info8

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### info7

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### info6

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### info5

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### info4

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### info3

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### info2

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### info1

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### info0

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### info

Synonymous with info0

#### Parameters

-   `args` **...any** 

### warn9

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### warn8

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### warn7

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### warn6

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### warn5

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### warn4

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### warn3

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### warn2

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### warn1

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### warn0

Outputs log at the named level granularity

#### Parameters

-   `args` **...any** 

### warn

Synonymous with warn0

#### Parameters

-   `args` **...any** 

### error

Used to output a log related to an error.

#### Parameters

-   `args` **...any** 

### exception

Used to output a log related to an exception.

#### Parameters

-   `args` **...any** 

### fatal

Used to output a log related to non-recoverable crash.

#### Parameters

-   `args` **...any** 

### crash

alias for fatal

#### Parameters

-   `args` **...any** 

### Trace

alias for trace

#### Parameters

-   `args` **...any** 

### Debug

alias for debug

#### Parameters

-   `args` **...any** 

### Log

alias for log

#### Parameters

-   `args` **...any** 

### Info

alias for info

#### Parameters

-   `args` **...any** 

### Warn

alias for warb

#### Parameters

-   `args` **...any** 

### Error

alias for error

#### Parameters

-   `args` **...any** 

### Critical

alias for fatal

#### Parameters

-   `args` **...any** 

### Exception

alias for exception

#### Parameters

-   `args` **...any** 

### group

Declares the start of a contextual group of related log statements.
In the ConsoleWriter, Log statements following a group declaration appear slightly indented so as to form
a visually grouped collection.  The group block is preceded by a label tag announcing the name of the group.

Other Writer implementations may handle `group` blocks in different ways.  Interactive log clients may support
collapsible sections.

Groups are concluded with `groupEnd` statments.

Groups initiated when another group is active appear nested within the former group.

#### Parameters

-   `name`  

### groupEnd

Marks the end of the current group.

### readMapData

Read the target (.js) file and find the //# sourceMappingURL= tag
then, either decode the date or read the referenced map file depending upon url type

Record this as the mapData for this file path for later lookup.
Note that in 'Sniff' the first part (making a mapData table) is done as a post-build tool activity
and the resulting JSON is read in so we have a preconstructed source map table at the start.

#### Parameters

-   `filePath`  Path of the file (note: full path, not just the name)

### getSourceMap

From the already parsed FuncFileLine data from StackLineParser,
find the referenced source map data and decode it to find the corresponding
source file and line values.  Update the FFL object in place.
Resulting FFL will also contain the source file path.

#### Parameters

-   `ffl`  FuncFileLine object that is modified with source map information and returned

Returns **any** Modified FFL is also returned
