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
-   Supports 50 logging levels (five named levels with 10 granlularities each)
-   Supports grouping of log messages
-   Supports Color output 
-   Supports 'Debugger Console' output for color and collapsible groups
-   Supports text console with ANSI colors
-   Configurable output
-   Stack tracing with source map support
-   Supports JSON format logging for compatibility with other tools
-   Extensible for custom needs

###### Installation
npm install gen-logger

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
import {loadLoggerConfig, getLogger} from 'gen-logger'

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
var {loadLoggerConfig, getLogger} = require('gen-logger')

loadLoggerConfig('./logConfig.json')
var Log = getLogger('Main')

module.exports = Log
```

If you are running in a browser-based context and not
running under Node, you cannot use the `loadLoggerConfig`
method, since direct file access is not normally 
available in a browser context.

In this instance, you can use a script load or an AJAX operation
to bring in the config json, or else construct the
JS object directly, and then set the configuration with
`setLoggerConfig`

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
import {loadLoggerConfig, getLogger} from 'gen-logger'

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

###### Implementing File and Service endpoints
 

###### Use in _Node_ projects

###### Use in browser projects

###### Uses for the Memory Log Writer

###### Creating a Logger programmatically

###### Extending and customizing

###### Reference and API



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

### LogWriter

Defines where the output will appear, and what categories/levels are filtered

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

### outToWriters

Direct output to all writers, subject to filtering.

#### Parameters

-   `time` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** in milliseconds
-   `ffl` **{file, func, line, stack}** 
-   `category` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `level` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `message` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `args` **any** arguments used for formatting message

### debug9

Outputs log at the named level granularity

### debug8

Outputs log at the named level granularity

### debug7

Outputs log at the named level granularity

### debug6

Outputs log at the named level granularity

### debug5

Outputs log at the named level granularity

### debug4

Outputs log at the named level granularity

### debug3

Outputs log at the named level granularity

### debug2

Outputs log at the named level granularity

### debug1

Outputs log at the named level granularity

### debug0

Outputs log at the named level granularity

### debug

Synonymous with debug0

### log9

Outputs log at the named level granularity

### log8

Outputs log at the named level granularity

### log7

Outputs log at the named level granularity

### log6

Outputs log at the named level granularity

### log5

Outputs log at the named level granularity

### log4

Outputs log at the named level granularity

### log3

Outputs log at the named level granularity

### log2

Outputs log at the named level granularity

### log1

Outputs log at the named level granularity

### log0

Outputs log at the named level granularity

### log

Synonymous with log0

### info9

Outputs log at the named level granularity

### info8

Outputs log at the named level granularity

### info7

Outputs log at the named level granularity

### info6

Outputs log at the named level granularity

### info5

Outputs log at the named level granularity

### info4

Outputs log at the named level granularity

### info3

Outputs log at the named level granularity

### info2

Outputs log at the named level granularity

### info1

Outputs log at the named level granularity

### info0

Outputs log at the named level granularity

### info

Synonymous with info0

### warn9

Outputs log at the named level granularity

### warn8

Outputs log at the named level granularity

### warn7

Outputs log at the named level granularity

### warn6

Outputs log at the named level granularity

### warn5

Outputs log at the named level granularity

### warn4

Outputs log at the named level granularity

### warn3

Outputs log at the named level granularity

### warn2

Outputs log at the named level granularity

### warn1

Outputs log at the named level granularity

### warn0

Outputs log at the named level granularity

### warn

Synonymous with warn0

### error

Used to output a log related to an error.

### exception

Used to output a log related to an exception.

### fatal

Used to output a log related to non-recoverable crash.

### crash

alias for fatal

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
